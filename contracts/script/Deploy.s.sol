// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {JobEscrow} from "../src/JobEscrow.sol";

/**
 * @notice Deploy {JobEscrow} to Monad testnet and (optionally) add the backend
 *         settlement relayer.
 *
 * Required env:
 *   DEPLOYER_PRIVATE_KEY  funded Monad-testnet key (keep out of git)
 * Optional env:
 *   SETTLEMENT_RELAYER    address the backend signs with; defaults to deployer
 *
 *   forge script script/Deploy.s.sol:DeployJobEscrow \
 *     --rpc-url monad_testnet --broadcast
 */
contract DeployJobEscrow is Script {
    function run() external returns (JobEscrow escrow) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address relayer = vm.envOr("SETTLEMENT_RELAYER", deployer);

        vm.startBroadcast(deployerKey);
        escrow = new JobEscrow();
        if (relayer != deployer) {
            escrow.setRelayer(relayer, true);
        }
        vm.stopBroadcast();

        console2.log("JobEscrow:", address(escrow));
        console2.log("owner:    ", deployer);
        console2.log("relayer:  ", relayer);
    }
}
