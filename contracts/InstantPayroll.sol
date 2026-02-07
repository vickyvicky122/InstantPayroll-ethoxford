// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

/**
 * @title InstantPayroll
 * @notice Real-time verified payroll streaming on Flare.
 * Employer creates a payment stream, worker claims per-interval by proving
 * GitHub activity via FDC Web2Json. FTSO provides FLR/USD conversion,
 * Secure Random adds a bonus lottery on each claim.
 */
contract InstantPayroll {
    // FLR/USD feed ID (category 1 = crypto, "FLR/USD")
    bytes21 public constant FLR_USD_FEED_ID = 0x01464c522f55534400000000000000000000000000;

    // Bonus lottery: 1-in-BONUS_DIVISOR chance of 2x payout
    uint256 public constant BONUS_DIVISOR = 10;
    uint256 public constant BONUS_MULTIPLIER = 2;

    struct Stream {
        address employer;
        address worker;
        uint256 usdRatePerInterval; // USD per interval, scaled by 1e18
        uint256 claimInterval;      // seconds between claims
        uint256 totalDeposit;       // total FLR deposited
        uint256 totalClaimed;       // total FLR claimed so far
        uint256 lastClaimTime;      // timestamp of last successful claim
        uint256 createdAt;          // stream creation timestamp
        bool active;
    }

    uint256 public nextStreamId;
    mapping(uint256 => Stream) public streams;

    // Events
    event StreamCreated(
        uint256 indexed streamId,
        address indexed employer,
        address indexed worker,
        uint256 usdRatePerInterval,
        uint256 claimInterval,
        uint256 totalDeposit
    );

    event PaymentClaimed(
        uint256 indexed streamId,
        address indexed worker,
        uint256 amountFLR,
        uint256 amountUSD,
        uint256 flrUsdPrice,
        bool bonusTriggered,
        uint256 commitCount
    );

    event StreamEnded(
        uint256 indexed streamId,
        uint256 totalClaimed,
        uint256 refunded
    );

    /**
     * @notice Create a payment stream for a worker.
     * @param _worker Worker address who can claim payments
     * @param _usdRatePerInterval USD amount per claim interval (scaled by 1e18, e.g. 1e18 = $1)
     * @param _claimInterval Seconds between claims (e.g. 60 for 1 minute)
     */
    function createStream(
        address _worker,
        uint256 _usdRatePerInterval,
        uint256 _claimInterval
    ) external payable returns (uint256 streamId) {
        require(_worker != address(0), "Invalid worker");
        require(_usdRatePerInterval > 0, "Rate must be > 0");
        require(_claimInterval > 0, "Interval must be > 0");
        require(msg.value > 0, "Must deposit FLR");

        streamId = nextStreamId++;

        streams[streamId] = Stream({
            employer: msg.sender,
            worker: _worker,
            usdRatePerInterval: _usdRatePerInterval,
            claimInterval: _claimInterval,
            totalDeposit: msg.value,
            totalClaimed: 0,
            lastClaimTime: block.timestamp,
            createdAt: block.timestamp,
            active: true
        });

        emit StreamCreated(
            streamId,
            msg.sender,
            _worker,
            _usdRatePerInterval,
            _claimInterval,
            msg.value
        );
    }

    /**
     * @notice Worker claims payment by providing FDC proof of GitHub activity.
     * @param _streamId The stream to claim from
     * @param _proof FDC Web2Json proof verifying GitHub commits
     */
    function claim(
        uint256 _streamId,
        IWeb2Json.Proof calldata _proof
    ) external {
        Stream storage stream = streams[_streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.worker, "Not the worker");
        require(
            block.timestamp >= stream.lastClaimTime + stream.claimInterval,
            "Too early to claim"
        );

        // 1. FDC: Verify the Web2Json proof (GitHub commits)
        IFdcVerification fdcVerification = ContractRegistry.getFdcVerification();
        require(fdcVerification.verifyWeb2Json(_proof), "Invalid FDC proof");

        // Decode the response to get commit count
        uint256 commitCount = abi.decode(
            _proof.data.responseBody.abiEncodedData,
            (uint256)
        );
        require(commitCount > 0, "No verified activity");

        // 2. FTSO: Get current FLR/USD price
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        (uint256 flrUsdPrice, int8 decimals,) = ftsoV2.getFeedById(FLR_USD_FEED_ID);
        require(flrUsdPrice > 0, "FTSO price unavailable");

        // Calculate FLR payout: usdRate / flrPrice
        // usdRatePerInterval is in 1e18, flrUsdPrice has `decimals` decimal places
        uint256 flrPayout = (stream.usdRatePerInterval * (10 ** uint8(decimals))) / flrUsdPrice;

        // 3. Secure Random: Bonus lottery
        RandomNumberV2Interface randomV2 = ContractRegistry.getRandomNumberV2();
        (uint256 randomNumber, bool isSecure,) = randomV2.getRandomNumber();
        bool bonusTriggered = false;
        if (isSecure && (randomNumber % BONUS_DIVISOR == 0)) {
            flrPayout *= BONUS_MULTIPLIER;
            bonusTriggered = true;
        }

        // Cap payout to remaining balance
        uint256 remaining = stream.totalDeposit - stream.totalClaimed;
        if (flrPayout > remaining) {
            flrPayout = remaining;
        }
        require(flrPayout > 0, "Stream depleted");

        // Update state
        stream.totalClaimed += flrPayout;
        stream.lastClaimTime = block.timestamp;

        // Auto-deactivate if depleted
        if (stream.totalClaimed >= stream.totalDeposit) {
            stream.active = false;
        }

        // Transfer payment
        (bool sent,) = payable(stream.worker).call{value: flrPayout}("");
        require(sent, "Transfer failed");

        emit PaymentClaimed(
            _streamId,
            stream.worker,
            flrPayout,
            stream.usdRatePerInterval,
            flrUsdPrice,
            bonusTriggered,
            commitCount
        );
    }

    /**
     * @notice Employer ends stream and recovers unused escrow.
     * @param _streamId The stream to end
     */
    function endStream(uint256 _streamId) external {
        Stream storage stream = streams[_streamId];
        require(msg.sender == stream.employer, "Not the employer");
        require(stream.active, "Stream not active");

        stream.active = false;
        uint256 refund = stream.totalDeposit - stream.totalClaimed;

        if (refund > 0) {
            (bool sent,) = payable(stream.employer).call{value: refund}("");
            require(sent, "Refund failed");
        }

        emit StreamEnded(_streamId, stream.totalClaimed, refund);
    }

    /**
     * @notice Get stream details.
     */
    function getStream(uint256 _streamId) external view returns (Stream memory) {
        return streams[_streamId];
    }

    /**
     * @notice Get current FLR/USD price from FTSO.
     */
    function getCurrentPrice() external view returns (uint256 price, int8 decimals, uint64 timestamp) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedById(FLR_USD_FEED_ID);
    }

    /**
     * @notice Check if a bonus would trigger with the current random number.
     */
    function checkBonusStatus() external view returns (uint256 randomNumber, bool isSecure, bool wouldTrigger) {
        RandomNumberV2Interface randomV2 = ContractRegistry.getRandomNumberV2();
        (randomNumber, isSecure,) = randomV2.getRandomNumber();
        wouldTrigger = isSecure && (randomNumber % BONUS_DIVISOR == 0);
    }
}
