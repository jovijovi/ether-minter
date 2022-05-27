// SPDX-License-Identifier: MIT
// Avatar Contract v0.2.1
pragma solidity ^0.8.4;

import {ERC721A} from "erc721a/contracts/ERC721A.sol";
import {ERC721AQueryable} from "erc721a/contracts/extensions/ERC721AQueryable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./Permission.sol";

/**
 * @title An avatar NFT contract.
 */
contract Avatar is ERC721AQueryable, ReentrancyGuard, Ownable, PermissionControl {

    /* *******
     * Globals
     * *******
     */

    // Maximum supply
    uint256 public maxSupply = 1000;

    // Finalization state, only false can permit mint
    bool public finalization = false;

    string private _contractURI;
    string private _baseTokenURI;

    // Mapping from token id to sha256 hash of content
    // (tokenId <-> avatar content hash)
    mapping(uint256 => bytes32) public tokenContentHashes;

    // Mapping from contentHash to tokenID
    // (avatar content hash <-> tokenId)
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
     * @notice On deployment, set the avatar name, symbol and baseTokenURI
     */
    constructor(string memory _name, string memory _symbol, string memory _uri) ERC721A(_name, _symbol) {
        _baseTokenURI = _uri;
    }

    /* ****************
     * Public Functions
     * ****************
     */

    //https://docs.opensea.io/docs/contract-level-metadata
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    /**
     * @notice Burn a token.
     * @dev Only callable if the avatar owner is also the creator.
     */
    function burn(uint256 tokenId) public
    nonReentrant
    onlyExistingToken(tokenId)
    onlyApprovedOrOwner(_msgSender(), tokenId)
    {
        _burn(tokenId);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
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

    /* ****************
     * External Functions
     * ****************
     */

    function changeContractURI(string memory _uri) external
    onlyOwner
    {
        _contractURI = _uri;
    }

    function setBaseTokenURI(string memory _uri) external
    onlyOwner
    {
        _baseTokenURI = _uri;
    }

    function setMaxSupply(uint256 _val) external
    onlyOwner
    {
        maxSupply = _val;
    }

    function mint(uint256 quantity) external
    nonReentrant
    {
        _mintTo(_msgSender(), quantity);
    }

    function mintTo(address to, uint256 quantity) external
    nonReentrant
    {
        _mintTo(to, quantity);
    }

    function mintForCreator(address to, uint256 quantity, bytes32[] memory contentHashList) external
    nonReentrant
    {
        _mintForCreator(to, quantity, contentHashList);
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

    /* *****************
     * Private Functions
     * *****************
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

    /* *****************
     * Internal Functions
     * *****************
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

    function _setTokenContentHash(uint256 tokenId, bytes32 contentHash) internal virtual
    onlyExistingToken(tokenId)
    {
        tokenContentHashes[tokenId] = contentHash;
    }
}
