// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VibeProof {
    struct Checkpoint {
        bytes32 logHash;
        string summary;
        uint256 timestamp;
        uint256 sessionCount;
    }

    // builder address => array of checkpoints
    mapping(address => Checkpoint[]) public checkpoints;

    event VibeAttested(
        address indexed builder,
        bytes32 logHash,
        string summary,
        uint256 timestamp,
        uint256 checkpointIndex
    );

    /**
     * @notice Store a checkpoint onchain
     * @param summary Brief description (max 200 chars)
     * @param logHash SHA-256 hash of log data
     */
    function attestVibe(
        string memory summary,
        bytes32 logHash
    ) external {
        require(bytes(summary).length <= 200, "Summary too long");
        require(logHash != bytes32(0), "Invalid hash");

        uint256 index = checkpoints[msg.sender].length;

        checkpoints[msg.sender].push(Checkpoint({
            logHash: logHash,
            summary: summary,
            timestamp: block.timestamp,
            sessionCount: index + 1
        }));

        emit VibeAttested(
            msg.sender,
            logHash,
            summary,
            block.timestamp,
            index
        );
    }

    /**
     * @notice Get total checkpoints for a builder
     */
    function getCheckpointCount(address builder)
        external
        view
        returns (uint256)
    {
        return checkpoints[builder].length;
    }

    /**
     * @notice Get specific checkpoint
     */
    function getCheckpoint(address builder, uint256 index)
        external
        view
        returns (Checkpoint memory)
    {
        require(index < checkpoints[builder].length, "Invalid index");
        return checkpoints[builder][index];
    }
}
