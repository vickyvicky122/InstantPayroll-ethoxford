// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title InstantPayrollPayout
 * @notice Deployed on Plasma testnet. Records payouts relayed from Flare.
 * Provides zero-fee payment receipts for workers.
 */
contract InstantPayrollPayout {
    struct Payout {
        uint256 flareStreamId;
        uint256 amountFLR;
        uint256 amountUSD;
        uint256 timestamp;
        bool bonusTriggered;
        uint256 commitCount;
    }

    address public relayer;
    mapping(address => Payout[]) public workerPayouts;
    mapping(address => uint256) public totalEarnedUSD;

    event PayoutRecorded(
        address indexed worker,
        uint256 indexed flareStreamId,
        uint256 amountFLR,
        uint256 amountUSD,
        bool bonusTriggered,
        uint256 commitCount
    );

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    constructor(address _relayer) {
        relayer = _relayer;
    }

    /**
     * @notice Record a payout relayed from Flare.
     */
    function recordPayout(
        address _worker,
        uint256 _flareStreamId,
        uint256 _amountFLR,
        uint256 _amountUSD,
        bool _bonusTriggered,
        uint256 _commitCount
    ) external onlyRelayer {
        workerPayouts[_worker].push(Payout({
            flareStreamId: _flareStreamId,
            amountFLR: _amountFLR,
            amountUSD: _amountUSD,
            timestamp: block.timestamp,
            bonusTriggered: _bonusTriggered,
            commitCount: _commitCount
        }));

        totalEarnedUSD[_worker] += _amountUSD;

        emit PayoutRecorded(
            _worker,
            _flareStreamId,
            _amountFLR,
            _amountUSD,
            _bonusTriggered,
            _commitCount
        );
    }

    /**
     * @notice Get total number of payouts for a worker.
     */
    function getPayoutCount(address _worker) external view returns (uint256) {
        return workerPayouts[_worker].length;
    }

    /**
     * @notice Get a specific payout for a worker.
     */
    function getPayout(address _worker, uint256 _index) external view returns (Payout memory) {
        return workerPayouts[_worker][_index];
    }

    /**
     * @notice Get all payouts for a worker.
     */
    function getAllPayouts(address _worker) external view returns (Payout[] memory) {
        return workerPayouts[_worker];
    }
}
