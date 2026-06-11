// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Faucet-style mock ERC-20 mirroring Zama's Sepolia mock tokens: a public
 * `mint(address,uint256)` and a configurable, non-18 `decimals()` so tests can
 * exercise the wrapper's rate/decimals handling exactly as the registry's real
 * tokens (USDC = 6, WETH = 18, …) do.
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @dev Open faucet — anyone can mint. Matches the testnet mock behaviour.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
