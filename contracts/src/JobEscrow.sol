// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title JobEscrow
 * @notice Holds native MON for annotation jobs and pays a contributor when the
 *         platform's settlement relayer confirms an accepted submission.
 *
 * @dev Deliberately minimal. The platform database stays the source of truth
 *      for task/annotation state; the chain enforces only the money rules:
 *
 *        - only an allow-listed relayer may settle;
 *        - a task can be settled at most once;
 *        - cumulative payouts for a job can never exceed its funded budget;
 *        - every settlement emits `TaskSettled`, which the backend verifies
 *          (receipt status + decoded event) before recording a real receipt.
 *
 *      Roles:
 *        - owner    : deploys, manages relayers, reclaims unspent escrow;
 *        - relayer  : the backend signer (`SETTLEMENT_PRIVATE_KEY`), server-only;
 *        - buyer    : whoever funds a job (informational on-chain attribution).
 */
contract JobEscrow {
    struct Job {
        address buyer; // first funder, informational
        uint256 budget; // total native MON deposited
        uint256 paid; // total native MON settled
        bool exists;
    }

    /// @notice Deployer; may add/remove relayers and withdraw unspent escrow.
    address public owner;

    /// @notice Backend signer(s) allowed to call {settle}.
    mapping(address => bool) public relayers;

    /// @notice Per-job escrow ledger, keyed by keccak256(platform job id).
    mapping(bytes32 => Job) public jobs;

    /// @notice taskKey => settled, where taskKey = keccak256(jobId, taskId).
    mapping(bytes32 => bool) public settled;

    event JobFunded(bytes32 indexed jobId, address indexed funder, uint256 amount);
    event TaskSettled(
        bytes32 indexed jobId,
        bytes32 indexed taskId,
        address indexed payee,
        uint256 amount,
        bytes32 annotationHash
    );
    event RelayerSet(address indexed relayer, bool allowed);
    event JobWithdrawn(bytes32 indexed jobId, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotRelayer();
    error JobNotFound();
    error AlreadySettled();
    error BudgetExceeded();
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();
    error NothingToWithdraw();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyRelayer() {
        if (!relayers[msg.sender]) revert NotRelayer();
        _;
    }

    constructor() {
        owner = msg.sender;
        relayers[msg.sender] = true; // owner can settle until reconfigured
        emit OwnershipTransferred(address(0), msg.sender);
        emit RelayerSet(msg.sender, true);
    }

    // ---------------------------------------------------------------
    // Administration
    // ---------------------------------------------------------------

    /// @notice Allow or revoke a settlement relayer.
    function setRelayer(address relayer, bool allowed) external onlyOwner {
        if (relayer == address(0)) revert ZeroAddress();
        relayers[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ---------------------------------------------------------------
    // Funding
    // ---------------------------------------------------------------

    /**
     * @notice Deposit native MON against a job.
     * @param jobId keccak256 of the platform job id.
     * @param buyer address attributed as the funder (informational).
     */
    function fundJob(bytes32 jobId, address buyer) external payable {
        if (msg.value == 0) revert ZeroAmount();
        Job storage job = jobs[jobId];
        if (!job.exists) {
            job.exists = true;
            job.buyer = buyer;
        }
        job.budget += msg.value;
        emit JobFunded(jobId, buyer, msg.value);
    }

    // ---------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------

    /**
     * @notice Pay a contributor for one accepted task.
     * @param jobId keccak256 of the platform job id.
     * @param taskId keccak256 of the platform task id.
     * @param payee contributor payout address.
     * @param amount native MON to transfer (wei).
     * @param annotationHash hash of the accepted annotation payload.
     */
    function settle(
        bytes32 jobId,
        bytes32 taskId,
        address payable payee,
        uint256 amount,
        bytes32 annotationHash
    ) external onlyRelayer {
        if (payee == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        Job storage job = jobs[jobId];
        if (!job.exists) revert JobNotFound();

        bytes32 key = _taskKey(jobId, taskId);
        if (settled[key]) revert AlreadySettled();
        if (job.paid + amount > job.budget) revert BudgetExceeded();

        // Effects before interaction.
        settled[key] = true;
        job.paid += amount;

        (bool ok,) = payee.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit TaskSettled(jobId, taskId, payee, amount, annotationHash);
    }

    // ---------------------------------------------------------------
    // Withdrawal
    // ---------------------------------------------------------------

    /// @notice Reclaim a job's unspent escrow (owner only).
    function withdraw(bytes32 jobId, address payable to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        Job storage job = jobs[jobId];
        if (!job.exists) revert JobNotFound();

        uint256 remaining = job.budget - job.paid;
        if (remaining == 0) revert NothingToWithdraw();

        job.budget = job.paid;
        (bool ok,) = to.call{value: remaining}("");
        if (!ok) revert TransferFailed();

        emit JobWithdrawn(jobId, to, remaining);
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    /// @notice Canonical key for a (job, task) pair; matches the backend helper.
    function taskKey(bytes32 jobId, bytes32 taskId) external pure returns (bytes32) {
        return _taskKey(jobId, taskId);
    }

    function _taskKey(bytes32 jobId, bytes32 taskId) private pure returns (bytes32) {
        // forge-lint: disable-next-line(asm-keccak256) -- clarity over a hand-written hash loop
        return keccak256(abi.encodePacked(jobId, taskId));
    }
}
