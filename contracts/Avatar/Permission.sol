// SPDX-License-Identifier: MIT
// Permission Control Contract v0.2.0
pragma solidity ^0.8.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract PermissionControl is Ownable {
    /**
     * @dev Operator map.
     */
    mapping(address => bool) private _operatorMap;

    /**
     * @dev Operator list.
     */
    address[] private _operatorList;

    /**
     * @dev Emitted when add an operator.
     */
    event AddOperator(address indexed operator);

    /**
     * @dev Emitted when remove an operator.
     */
    event RemoveOperator(address indexed operator);

    /**
     * @dev Throws if called by any account other than the operator.
     */
    modifier onlyOperator() {
        require(_operatorMap[_msgSender()], "PermissionControl: invalid operator");
        _;
    }

    /**
     * @dev Throws if the operator already exist.
     */
    modifier onlyOperatorNotExist(address operator) {
        require(!_operatorMap[operator], "PermissionControl: operator already exist");
        _;
    }

    /**
     * @dev Throws if the operator not exist.
     */
    modifier onlyOperatorExist(address operator) {
        require(_operatorMap[operator], "PermissionControl: operator not exist");
        _;
    }

    /**
     * @dev Initializes the contract setting default operator as the initial owner.
     */
    constructor() {
        addOperator(_msgSender());
    }

    /**
     * @dev Get operator list.
     */
    function getOperatorList() public view returns (address[] memory) {
        return _operatorList;
    }

    /**
     * @dev Get operator list length.
     */
    function getOperatorListLength() public view returns (uint) {
        return _operatorList.length;
    }

    /**
     * @dev Check if it is the operator address.
     */
    function isOperator(address operator) public view returns (bool) {
        return _operatorMap[operator];
    }

    /**
     * @dev Add operator.
     */
    function addOperator(address operator) public onlyOwner onlyOperatorNotExist(operator) {
        _operatorMap[operator] = true;
        _operatorList.push(operator);

        emit AddOperator(operator);
    }

    /**
     * @dev Remove operator.
     */
    function removeOperator(address operator) public onlyOwner onlyOperatorExist(operator) {
        _operatorMap[operator] = false;
        _removeOperatorFromList(operator);

        emit RemoveOperator(operator);
    }

    /**
     * @dev Operator retire.
     */
    function retire() public onlyOperator {
        _operatorMap[_msgSender()] = false;
        _removeOperatorFromList(_msgSender());

        emit RemoveOperator(_msgSender());
    }

    /**
     * @dev Remove operator from list.
     */
    function _removeOperatorFromList(address operator) private {
        for (uint256 i = 0; i < _operatorList.length; i++) {
            if (_operatorList[i] == operator) {
                address last = _operatorList[_operatorList.length - 1];
                _operatorList[i] = last;
                _operatorList.pop();
                break;
            }
        }
    }
}
