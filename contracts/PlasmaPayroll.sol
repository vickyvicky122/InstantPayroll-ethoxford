// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PlasmaPayroll
 * @notice USDC streaming payroll on Plasma — simpler than Flare version.
 *         No FDC, no FTSO, no bonus. Time-based claims in stablecoin.
 */
contract PlasmaPayroll {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    struct Stream {
        address employer;
        address worker;
        uint256 usdcPerInterval;   // USDC amount per interval (6 decimals)
        uint256 claimInterval;     // seconds between claims
        uint256 totalDeposit;      // total USDC deposited
        uint256 totalClaimed;      // total USDC claimed so far
        uint256 lastClaimTime;     // timestamp of last successful claim
        uint256 createdAt;         // stream creation timestamp
        bool active;
    }

    uint256 public nextStreamId;
    mapping(uint256 => Stream) public streams;

    event StreamCreated(
        uint256 indexed streamId,
        address indexed employer,
        address indexed worker,
        uint256 usdcPerInterval,
        uint256 claimInterval,
        uint256 totalDeposit
    );

    event PaymentClaimed(
        uint256 indexed streamId,
        address indexed worker,
        uint256 amount,
        uint256 intervalsCount
    );

    event StreamEnded(
        uint256 indexed streamId,
        uint256 totalClaimed,
        uint256 refunded
    );

    constructor(IERC20 _usdc) {
        usdc = _usdc;
    }

    /**
     * @notice Create a USDC payment stream for a worker.
     *         Caller must have approved this contract for `_totalDeposit` USDC.
     * @param _worker Worker address who can claim payments
     * @param _usdcPerInterval USDC per claim interval (6 decimals)
     * @param _claimInterval Seconds between claims
     * @param _totalDeposit Total USDC to deposit into the stream
     */
    function createStream(
        address _worker,
        uint256 _usdcPerInterval,
        uint256 _claimInterval,
        uint256 _totalDeposit
    ) external returns (uint256 streamId) {
        require(_worker != address(0), "Invalid worker");
        require(_usdcPerInterval > 0, "Rate must be > 0");
        require(_claimInterval > 0, "Interval must be > 0");
        require(_totalDeposit > 0, "Must deposit USDC");

        usdc.safeTransferFrom(msg.sender, address(this), _totalDeposit);

        streamId = nextStreamId++;

        streams[streamId] = Stream({
            employer: msg.sender,
            worker: _worker,
            usdcPerInterval: _usdcPerInterval,
            claimInterval: _claimInterval,
            totalDeposit: _totalDeposit,
            totalClaimed: 0,
            lastClaimTime: block.timestamp,
            createdAt: block.timestamp,
            active: true
        });

        emit StreamCreated(
            streamId,
            msg.sender,
            _worker,
            _usdcPerInterval,
            _claimInterval,
            _totalDeposit
        );
    }

    /**
     * @notice Worker claims all elapsed intervals worth of USDC.
     * @param _streamId The stream to claim from
     */
    function claim(uint256 _streamId) external {
        Stream storage stream = streams[_streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.worker, "Not the worker");
        require(
            block.timestamp >= stream.lastClaimTime + stream.claimInterval,
            "Too early to claim"
        );

        // Calculate how many intervals have elapsed
        uint256 elapsed = block.timestamp - stream.lastClaimTime;
        uint256 intervals = elapsed / stream.claimInterval;
        require(intervals > 0, "No intervals elapsed");

        uint256 payout = intervals * stream.usdcPerInterval;

        // Cap payout to remaining balance
        uint256 remaining = stream.totalDeposit - stream.totalClaimed;
        if (payout > remaining) {
            payout = remaining;
        }
        require(payout > 0, "Stream depleted");

        // Update state
        stream.totalClaimed += payout;
        stream.lastClaimTime += intervals * stream.claimInterval;

        // Auto-deactivate if depleted
        if (stream.totalClaimed >= stream.totalDeposit) {
            stream.active = false;
        }

        // Transfer USDC to worker
        usdc.safeTransfer(stream.worker, payout);

        emit PaymentClaimed(_streamId, stream.worker, payout, intervals);
    }

    /**
     * @notice Employer ends stream and recovers unused USDC.
     * @param _streamId The stream to end
     */
    function endStream(uint256 _streamId) external {
        Stream storage stream = streams[_streamId];
        require(msg.sender == stream.employer, "Not the employer");
        require(stream.active, "Stream not active");

        stream.active = false;
        uint256 refund = stream.totalDeposit - stream.totalClaimed;

        if (refund > 0) {
            usdc.safeTransfer(stream.employer, refund);
        }

        emit StreamEnded(_streamId, stream.totalClaimed, refund);
    }

    /**
     * @notice Get stream details.
     */
    function getStream(uint256 _streamId) external view returns (Stream memory) {
        return streams[_streamId];
    }
}
