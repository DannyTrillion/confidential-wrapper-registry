// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @dev Faithful reimplementation of the Confidential Token Wrappers Registry's
 * read surface, used to validate the frontend's ABI assumptions:
 *  - getTokenConfidentialTokenPairsLength()
 *  - getTokenConfidentialTokenPairsSlice(fromIndex, toIndex)  [from incl, to excl]
 *  - getConfidentialTokenAddress(token) -> (isValid, confidentialToken)
 *  - revoked pairs (isValid=false) are RETAINED in storage and returned by slices.
 *
 * This mirrors the documented behaviour: revocation is permanent, preserves
 * history, and never deletes the mapping entry.
 */
contract WrappersRegistry {
    struct TokenWrapperPair {
        address tokenAddress;
        address confidentialTokenAddress;
        bool isValid;
    }

    TokenWrapperPair[] private _pairs;
    // token => 1-based index into _pairs (0 = not present)
    mapping(address => uint256) private _indexByToken;

    event ConfidentialTokenRegistered(address indexed tokenAddress, address indexed confidentialTokenAddress);
    event ConfidentialTokenRevoked(address indexed tokenAddress, address indexed confidentialTokenAddress);

    error AlreadyRegistered(address tokenAddress);
    error NotRegistered(address confidentialTokenAddress);

    function registerConfidentialToken(address tokenAddress, address confidentialTokenAddress) external {
        if (_indexByToken[tokenAddress] != 0) revert AlreadyRegistered(tokenAddress);
        _pairs.push(TokenWrapperPair(tokenAddress, confidentialTokenAddress, true));
        _indexByToken[tokenAddress] = _pairs.length; // 1-based
        emit ConfidentialTokenRegistered(tokenAddress, confidentialTokenAddress);
    }

    function revokeConfidentialToken(address confidentialTokenAddress) external {
        for (uint256 i = 0; i < _pairs.length; i++) {
            if (_pairs[i].confidentialTokenAddress == confidentialTokenAddress) {
                _pairs[i].isValid = false; // retained, not deleted
                emit ConfidentialTokenRevoked(_pairs[i].tokenAddress, confidentialTokenAddress);
                return;
            }
        }
        revert NotRegistered(confidentialTokenAddress);
    }

    function getTokenConfidentialTokenPairsLength() external view returns (uint256) {
        return _pairs.length;
    }

    /// @dev fromIndex inclusive, toIndex exclusive.
    function getTokenConfidentialTokenPairsSlice(uint256 fromIndex, uint256 toIndex)
        external
        view
        returns (TokenWrapperPair[] memory slice)
    {
        require(fromIndex <= toIndex && toIndex <= _pairs.length, "bad range");
        slice = new TokenWrapperPair[](toIndex - fromIndex);
        for (uint256 i = fromIndex; i < toIndex; i++) {
            slice[i - fromIndex] = _pairs[i];
        }
    }

    function getConfidentialTokenAddress(address token)
        external
        view
        returns (bool isValid, address confidentialToken)
    {
        uint256 idx = _indexByToken[token];
        if (idx == 0) return (false, address(0));
        TokenWrapperPair storage p = _pairs[idx - 1];
        return (p.isValid, p.confidentialTokenAddress);
    }
}
