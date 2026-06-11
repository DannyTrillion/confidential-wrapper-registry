// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from
    "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @dev Concrete confidential wrapper over an ERC-20, identical in shape to the
 * registry's deployed cTokenMocks. ZamaEthereumConfig wires the coprocessor/ACL/
 * KMS by chainid (incl. the local mock at 31337). Confidential decimals are
 * capped at 6 by the base wrapper, so an 18-decimal underlying wraps at rate
 * 10**12 — the exact behaviour the frontend must not hardcode around.
 */
contract ConfidentialMockWrapper is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(IERC20 underlying_, string memory name_, string memory symbol_)
        ERC7984(name_, symbol_, "")
        ERC7984ERC20Wrapper(underlying_)
    {}
}
