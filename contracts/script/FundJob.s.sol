// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {JobEscrow} from "../src/JobEscrow.sol";

/**
 * @notice Fund one platform job in an already-deployed {JobEscrow}.
 *
 * Required env:
 *   DEPLOYER_PRIVATE_KEY  funded key that pays into escrow
 *   JOB_ESCROW_ADDRESS    deployed JobEscrow
 *   JOB_ID_HASH           bytes32 = keccak256(utf8(platform job uuid))
 *   JOB_FUND_WEI          amount in wei to deposit
 * Optional env:
 *   JOB_BUYER             address attributed as funder (defaults to deployer)
 *
 *   forge script script/FundJob.s.sol:FundJob \
 *     --rpc-url monad_testnet --broadcast
 */
contract FundJob is Script {
    function run() external {
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        JobEscrow escrow = JobEscrow(payable(vm.envAddress("JOB_ESCROW_ADDRESS")));
        bytes32 jobId = vm.envBytes32("JOB_ID_HASH");
        address buyer = vm.envOr("JOB_BUYER", vm.addr(key));
        uint256 amount = vm.envUint("JOB_FUND_WEI");

        vm.startBroadcast(key);
        escrow.fundJob{value: amount}(jobId, buyer);
        vm.stopBroadcast();

        console2.log("funded job", vm.toString(jobId));
        console2.log("amount (wei)", amount);
        console2.log("buyer", buyer);
    }
}
