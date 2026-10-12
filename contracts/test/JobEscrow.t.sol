// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {JobEscrow} from "../src/JobEscrow.sol";

/**
 * @dev Money-rule tests for {JobEscrow}, mirrored by the backend service tests.
 *      The test contract is the deployer, so it is owner and an initial relayer;
 *      `relayer` is added explicitly to model the backend signer.
 */
contract JobEscrowTest is Test {
    JobEscrow internal escrow;

    address internal relayer = address(0xA11CE);
    address internal payer = address(0xB0B);
    address internal contributor = address(0xC0FFEE);
    address internal stranger = address(0xDEAD);

    bytes32 internal constant JOB_ID = keccak256("job-1");
    bytes32 internal constant TASK_ID = keccak256("task-1");
    bytes32 internal constant TASK_ID_2 = keccak256("task-2");
    bytes32 internal constant ANNOTATION_HASH = keccak256("annotation-1");

    event JobFunded(bytes32 indexed jobId, address indexed funder, uint256 amount);
    event TaskSettled(
        bytes32 indexed jobId,
        bytes32 indexed taskId,
        address indexed payee,
        uint256 amount,
        bytes32 annotationHash
    );
    event JobWithdrawn(bytes32 indexed jobId, address indexed to, uint256 amount);
    event RelayerSet(address indexed relayer, bool allowed);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        escrow = new JobEscrow();
        escrow.setRelayer(relayer, true);
        assertEq(escrow.owner(), address(this));
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    function _fund(uint256 amount) internal {
        vm.deal(address(this), amount);
        escrow.fundJob{value: amount}(JOB_ID, payer);
    }

    function _job()
        internal
        view
        returns (address buyer, uint256 budget, uint256 paid, bool exists)
    {
        return escrow.jobs(JOB_ID);
    }

    // ---------------------------------------------------------------
    // Deployment / roles
    // ---------------------------------------------------------------

    function test_DeployerIsOwnerAndInitialRelayer() public {
        JobEscrow fresh = new JobEscrow();
        assertEq(fresh.owner(), address(this));
        assertTrue(fresh.relayers(address(this)));
    }

    function test_SetRelayer_OnlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(JobEscrow.NotOwner.selector);
        escrow.setRelayer(stranger, true);

        vm.expectEmit(true, false, false, true);
        emit RelayerSet(stranger, true);
        escrow.setRelayer(stranger, true);
        assertTrue(escrow.relayers(stranger));

        escrow.setRelayer(stranger, false);
        assertFalse(escrow.relayers(stranger));
    }

    function test_SetRelayer_RevertsOnZeroAddress() public {
        vm.expectRevert(JobEscrow.ZeroAddress.selector);
        escrow.setRelayer(address(0), true);
    }

    function test_TransferOwnership_OnlyOwnerAndEmits() public {
        vm.prank(stranger);
        vm.expectRevert(JobEscrow.NotOwner.selector);
        escrow.transferOwnership(stranger);

        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(address(this), stranger);
        escrow.transferOwnership(stranger);
        assertEq(escrow.owner(), stranger);
    }

    // ---------------------------------------------------------------
    // Funding
    // ---------------------------------------------------------------

    function test_FundJob_RecordsBudgetAndEmits() public {
        vm.deal(address(this), 1 ether);
        vm.expectEmit(true, true, false, true);
        emit JobFunded(JOB_ID, payer, 1 ether);
        escrow.fundJob{value: 1 ether}(JOB_ID, payer);

        (address buyer, uint256 budget, uint256 paid, bool exists) = _job();
        assertEq(buyer, payer);
        assertEq(uint256(budget), 1 ether);
        assertEq(uint256(paid), 0);
        assertTrue(exists);
    }

    function test_FundJob_AccumulatesAndKeepsFirstBuyer() public {
        _fund(0.4 ether);
        vm.deal(address(this), 0.6 ether);
        escrow.fundJob{value: 0.6 ether}(JOB_ID, stranger);

        (address buyer, uint256 budget,,) = _job();
        assertEq(buyer, payer, "first funder wins");
        assertEq(uint256(budget), 1 ether);
        assertEq(address(escrow).balance, 1 ether);
    }

    function test_FundJob_RevertsOnZeroValue() public {
        vm.expectRevert(JobEscrow.ZeroAmount.selector);
        escrow.fundJob{value: 0}(JOB_ID, payer);
    }

    // ---------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------

    function test_Settle_PaysContributorAndEmits() public {
        _fund(1 ether);
        uint256 before = contributor.balance;

        vm.expectEmit(true, true, true, true);
        emit TaskSettled(JOB_ID, TASK_ID, contributor, 0.25 ether, ANNOTATION_HASH);

        vm.prank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);

        assertEq(contributor.balance, before + 0.25 ether);
        (, uint256 budget, uint256 paid,) = _job();
        assertEq(uint256(budget), 1 ether);
        assertEq(uint256(paid), 0.25 ether);
        assertTrue(escrow.settled(escrow.taskKey(JOB_ID, TASK_ID)));
        assertEq(address(escrow).balance, 0.75 ether);
    }

    function test_Settle_TwoTasksWithinBudget() public {
        _fund(1 ether);
        vm.startPrank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.3 ether, ANNOTATION_HASH);
        escrow.settle(JOB_ID, TASK_ID_2, payable(contributor), 0.3 ether, ANNOTATION_HASH);
        vm.stopPrank();

        (,, uint256 paid,) = _job();
        assertEq(uint256(paid), 0.6 ether);
    }

    function test_Settle_RevertsForNonRelayer() public {
        _fund(1 ether);
        vm.prank(stranger);
        vm.expectRevert(JobEscrow.NotRelayer.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);
    }

    function test_Settle_RevertsIfJobMissing() public {
        vm.prank(relayer);
        vm.expectRevert(JobEscrow.JobNotFound.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);
    }

    function test_Settle_RevertsIfAlreadySettled() public {
        _fund(1 ether);
        vm.startPrank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);
        vm.expectRevert(JobEscrow.AlreadySettled.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);
        vm.stopPrank();
    }

    function test_Settle_DifferentJobsAllowSameTaskId() public {
        // Guards against keying `settled` by taskId alone.
        _fund(1 ether);
        bytes32 otherJob = keccak256("job-2");
        vm.deal(address(this), 1 ether);
        escrow.fundJob{value: 1 ether}(otherJob, payer);

        vm.startPrank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.1 ether, ANNOTATION_HASH);
        escrow.settle(otherJob, TASK_ID, payable(contributor), 0.1 ether, ANNOTATION_HASH);
        vm.stopPrank();

        assertEq(contributor.balance, 0.2 ether);
    }

    function test_Settle_RevertsOverBudget() public {
        _fund(0.2 ether);
        vm.prank(relayer);
        vm.expectRevert(JobEscrow.BudgetExceeded.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.21 ether, ANNOTATION_HASH);
    }

    function test_Settle_RevertsOnZeroAmount() public {
        _fund(1 ether);
        vm.prank(relayer);
        vm.expectRevert(JobEscrow.ZeroAmount.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0, ANNOTATION_HASH);
    }

    function test_Settle_RevertsOnZeroPayee() public {
        _fund(1 ether);
        vm.prank(relayer);
        vm.expectRevert(JobEscrow.ZeroAddress.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(address(0)), 0.1 ether, ANNOTATION_HASH);
    }

    function test_Settle_RevertsIfTransferFails() public {
        _fund(1 ether);
        RejectingPayee rejecter = new RejectingPayee();
        vm.prank(relayer);
        vm.expectRevert(JobEscrow.TransferFailed.selector);
        escrow.settle(JOB_ID, TASK_ID, payable(address(rejecter)), 0.1 ether, ANNOTATION_HASH);
    }

    // ---------------------------------------------------------------
    // Withdrawal
    // ---------------------------------------------------------------

    function test_Withdraw_ReturnsUnspent() public {
        _fund(1 ether);
        vm.prank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);

        uint256 before = stranger.balance;
        vm.expectEmit(true, true, false, true);
        emit JobWithdrawn(JOB_ID, stranger, 0.75 ether);
        escrow.withdraw(JOB_ID, payable(stranger));

        assertEq(stranger.balance, before + 0.75 ether);
        (, uint256 budget, uint256 paid,) = _job();
        assertEq(uint256(budget), 0.25 ether);
        assertEq(uint256(paid), 0.25 ether);
    }

    function test_Withdraw_OnlyOwner() public {
        _fund(1 ether);
        vm.prank(stranger);
        vm.expectRevert(JobEscrow.NotOwner.selector);
        escrow.withdraw(JOB_ID, payable(stranger));
    }

    function test_Withdraw_RevertsIfNothingUnspent() public {
        _fund(0.25 ether);
        vm.prank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), 0.25 ether, ANNOTATION_HASH);

        vm.expectRevert(JobEscrow.NothingToWithdraw.selector);
        escrow.withdraw(JOB_ID, payable(stranger));
    }

    // ---------------------------------------------------------------
    // Fuzz
    // ---------------------------------------------------------------

    function testFuzz_Settle_AnyAmountWithinBudget(uint96 amount) public {
        uint256 budget = 10 ether;
        _fund(budget);
        amount = uint96(bound(amount, 1, budget));

        vm.prank(relayer);
        escrow.settle(JOB_ID, TASK_ID, payable(contributor), amount, ANNOTATION_HASH);

        assertEq(contributor.balance, amount);
        assertEq(address(escrow).balance, budget - amount);
    }

    /// @dev Always reverts on receive, to exercise the TransferFailed path.
    receive() external payable {
        revert("no thanks");
    }
}

contract RejectingPayee {
    receive() external payable {
        revert("reject");
    }
}
