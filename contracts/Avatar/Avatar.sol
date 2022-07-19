// SPDX-License-Identifier: MIT
/*
 *   █████╗ ██╗   ██╗ █████╗ ████████╗ █████╗ ██████╗
 *  ██╔══██╗██║   ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
 *  ███████║██║   ██║███████║   ██║   ███████║██████╔╝
 *  ██╔══██║╚██╗ ██╔╝██╔══██║   ██║   ██╔══██║██╔══██╗
 *  ██║  ██║ ╚████╔╝ ██║  ██║   ██║   ██║  ██║██║  ██║
 *  ╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
 *
 *  Avatar Contract v0.4.0
 *  Dependencies:
 *  "@openzeppelin/contracts": "4.7.0"
 *  "erc721a": "4.2.0"
 */

pragma solidity ^0.8.4;

import {ERC721A} from "erc721a/contracts/ERC721A.sol";
import {ERC721AQueryable} from "erc721a/contracts/extensions/ERC721AQueryable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./Permission.sol";

/**
 * @title An avatar NFT contract.
 */
contract Avatar is ERC721A, ERC721AQueryable, ReentrancyGuard, Ownable, PermissionControl {
    /* *******
     * Globals
     * *******
     */

    /**
     * @dev Maximum supply.
     */
    uint256 public maxSupply = 1000;

    /**
     * @dev Finalization state, only false can permit mint.
     */
    bool public finalization = false;

    /**
     * @dev A URL for the storefront-level metadata for contract.
     */
    string private _contractURI;

    /**
     * @dev Base URI for computing {tokenURI}.
     */
    string private _baseTokenURI;

    /**
     * @dev Mapping from token id to sha256 hash of content.
     * (tokenId <-> avatar content hash)
     */
    mapping(uint256 => bytes32) public tokenContentHashes;

    /**
     * @dev Mapping from contentHash to tokenID.
     * (avatar content hash <-> tokenId)
     */
    mapping(bytes32 => uint256) private _contentHashes;

    /* *********
     * Modifiers
     * *********
     */

    /**
     * @notice Require that the token has not been burned and has been minted
     */
    modifier onlyExistingToken(uint256 tokenId) {
        require(_exists(tokenId), "Avatar: nonexistent token");
        _;
    }

    /**
     * @notice Ensure that the provided spender is the approved or the owner of
     * the avatar for the specified tokenId
     */
    modifier onlyApprovedOrOwner(address spender, uint256 tokenId) {
        require(_isApprovedOrOwner(spender, tokenId), "Avatar: only approved or owner");
        _;
    }

    /**
     * @notice Ensure that the collection of this contract is finalization, and can not mint any more.
     */
    modifier onlyMintAvailable() {
        require(finalization == false, "Avatar: mint function is not available.");
        _;
    }

    /**
     * @notice Ensure that within the maximum supply limit.
     */
    modifier onlyWithinMaxSupply(uint256 quantity) {
        require(quantity + totalSupply() <= maxSupply, "Avatar: reach the maximum supply limit");
        _;
    }

    /**
     * @notice Ensure that the hash of contentHashList is not empty and the token with the content hash is not minted.
     */
    modifier onlyValidContentHashList(bytes32[] memory contentHashList) {
        require(contentHashList.length > 0, "Avatar: contentHashList is empty");
        for (uint256 i = 0; i < contentHashList.length; i++) {
            bytes32 contentHash = contentHashList[i];
            require(contentHash != 0, "Avatar: content hash must be non-zero");
            require(_contentHashes[contentHash] == 0, "Avatar: a token has already been minted with this content hash");
        }
        _;
    }

    /**
     * @dev Initializes the contract by setting `name`, `symbol`, `baseTokenURI`, `maxSupply` and `operators` to the token collection.
     * `operators` is optional.
     */
    constructor(string memory name_, string memory symbol_, string memory baseTokenURI_, uint256 maxSupply_, address[] memory operators) ERC721A(name_, symbol_) {
        require(maxSupply_ > 0, "Avatar: invalid maxSupply");
        _baseTokenURI = baseTokenURI_;
        maxSupply = maxSupply_;
        if (operators.length > 0) {
            addOperators(operators);
        }
    }

    /* ****************
     * Public Functions
     * ****************
     */

    /**
     * @notice A URL for the storefront-level metadata for contract.
     * @dev Ref: https://docs.opensea.io/docs/contract-level-metadata
     */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    /**
     * @dev Returns whether `tokenId` exists.
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    /**
     * @dev Returns the total amount of tokens minted in the contract.
     */
    function totalMinted() public view returns (uint256) {
        return _totalMinted();
    }

    /**
     * @dev Returns the total number of tokens burned.
     */
    function totalBurned() public view returns (uint256) {
        return _totalBurned();
    }

    /**
     * @notice get the tokenId by the contentHash if the token had been minted
     * @return the tokenId
     */
    function getTokenIdByContentHash(bytes32 contentHash) public view returns (uint256)
    {
        require(_contentHashes[contentHash] > 0, "Avatar: the token has not been minted.");
        return _contentHashes[contentHash];
    }

    /**
     * @dev Returns whether "contentHash" has ever existed.
     */
    function contentHashExists(bytes32 contentHash) public view returns (bool)
    {
        return _contentHashes[contentHash] > 0;
    }

    /**
     * @dev Returns all content hash.
     */
    function getAllContentHash() public view returns (bytes32[] memory)
    {
        uint256 length = _nextTokenId() - 1 >= 0 ? _nextTokenId() - 1 : 0;
        bytes32[] memory allContentHash = new bytes32[](length);

        for (uint256 i = _startTokenId(); i <= length; i++) {
            allContentHash[i - 1] = tokenContentHashes[i];
        }

        return allContentHash;
    }

    /* ******************
     * External Functions
     * ******************
     */

    /**
     * @dev Change contractURI.
     */
    function changeContractURI(string memory contractURI_) external
    onlyOwner
    {
        _contractURI = contractURI_;
    }

    /**
     * @dev Set baseTokenURI.
     */
    function setBaseTokenURI(string memory baseTokenURI_) external
    onlyOwner
    {
        _baseTokenURI = baseTokenURI_;
    }

    /**
     * @dev Set max supply.
     */
    function setMaxSupply(uint256 val) external
    onlyOwner
    {
        maxSupply = val;
    }

    /**
     * @dev Mint to message sender.
     */
    function mint(uint256 quantity) external
    nonReentrant
    {
        _mintTo(_msgSender(), quantity);
    }

    /**
     * @dev Mint to specified address.
     */
    function mintTo(address to, uint256 quantity) external
    nonReentrant
    {
        _mintTo(to, quantity);
    }

    /**
     * @dev Mint to specified address with content hash list.
     */
    function mintForCreator(address to, uint256 quantity, bytes32[] memory contentHashList) external
    nonReentrant
    {
        _mintForCreator(to, quantity, contentHashList);
    }

    /**
     * @dev Batch tokens transfer from 1 to 1.
     */
    function batchTransfer(address from, address to, uint256 fromTokenId, uint256 toTokenId) external
    nonReentrant
    {
        _batchTransfer(from, to, fromTokenId, toTokenId);
    }

    /**
     * @dev Batch tokens transfer from 1 to N.
     */
    function batchTransferToN(address from, address[] memory to, uint256[] memory tokenIds) external
    nonReentrant
    {
        _batchTransferToN(from, to, tokenIds);
    }

    /**
     * @dev Burn a token.
     */
    function burn(uint256 tokenId) external
    nonReentrant
    onlyExistingToken(tokenId)
    onlyApprovedOrOwner(_msgSender(), tokenId)
    {
        _burn(tokenId);
    }

    /**
     * @dev Batch tokens burn.
     */
    function batchBurn(uint256 fromTokenId, uint256 toTokenId) external
    nonReentrant
    {
        _batchBurn(fromTokenId, toTokenId);
    }

    /**
     * @notice Finalize this contract and can not mint any more.
     */
    function finalize() external
    onlyOwner
    {
        require(finalization == false, "Avatar: already finalized");
        finalization = true;
    }

    /* ******************
     * Internal Functions
     * ******************
     */

    /**
     * @notice Mints a new token for `creator`. Its token ID will be automatically
     * assigned (and available on the emitted {IERC721-Transfer} event), and the token
     * URI autogenerated based on the base URI passed at construction.
     *
     * See {ERC721-_safeMint}.
     *
     * On mint, also set the sha256 hashes of the content for integrity
     * checks, along with the initial URIs to point to the content. Attribute
     * the token ID to the To, mark the content hash as used.
     *
     * Note that the content hash must be unique for future mints to prevent duplicate avatar.
     */
    function _mintTo(address to, uint256 quantity) internal
    onlyMintAvailable
    onlyOperator
    onlyWithinMaxSupply(quantity)
    {
        _safeMint(to, quantity);
    }

    /**
     * @dev Mint to specified address with content hash list.
     */
    function _mintForCreator(address to, uint256 quantity, bytes32[] memory contentHashList) internal
    onlyMintAvailable
    onlyOperator
    onlyWithinMaxSupply(quantity)
    onlyValidContentHashList(contentHashList)
    {
        require(contentHashList.length == quantity, "Avatar: quantity and contentHashList length mismatch");

        uint256 startTokenId = _nextTokenId();

        _safeMint(to, quantity);

        for (uint256 i = 0; i < contentHashList.length; i++) {
            uint256 tokenId = startTokenId + i;
            bytes32 contentHash = contentHashList[i];
            _setTokenContentHash(tokenId, contentHash);
            _contentHashes[contentHash] = tokenId;
        }
    }

    /**
     * @dev Returns the starting token ID.
     */
    function _startTokenId() internal view override virtual returns (uint256) {
        return 1;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal view override virtual returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "Avatar: operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /**
     * @dev Set token content hash.
     */
    function _setTokenContentHash(uint256 tokenId, bytes32 contentHash) internal virtual
    onlyExistingToken(tokenId)
    {
        tokenContentHashes[tokenId] = contentHash;
    }

    /**
     * @dev Batch tokens transfer from 1 to 1.
     */
    function _batchTransfer(address from, address to, uint256 fromTokenId, uint256 toTokenId) internal virtual {
        require(toTokenId > fromTokenId, "Avatar: invalid tokenId");
        for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; tokenId++) {
            safeTransferFrom(from, to, tokenId);
        }
    }

    /**
     * @dev Batch tokens transfer from 1 to N.
     */
    function _batchTransferToN(address from, address[] memory to, uint256[] memory tokenIds) internal virtual {
        require(to.length == tokenIds.length, "Avatar: invalid length of tokenIds");
        for (uint256 i = 0; i < to.length; i++) {
            safeTransferFrom(from, to[i], tokenIds[i]);
        }
    }

    /**
     * @dev Batch tokens burn.
     */
    function _batchBurn(uint256 fromTokenId, uint256 toTokenId) internal virtual {
        require(toTokenId > fromTokenId, "Avatar: invalid tokenId");
        for (uint256 tokenId = fromTokenId; tokenId <= toTokenId; tokenId++) {
            _burn(tokenId, true);
        }
    }
}
