// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// To be deployed on goreli testnet
contract TestToken is ERC20 {
    
    address owner;

    uint256 mintThreshold = 12 hours;
    mapping(address => uint256) public usersLastMintTime;

    event Drip(address,uint256);


    modifier onlyOwner() {
        require(msg.sender == owner, "Not Owner!");
        _;
    }


    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        owner = msg.sender;
        uint256 initialSupply = 1000000 ether;
        _mint(msg.sender, initialSupply);
    }

    function setThreshold(uint256 _newThreshold) external onlyOwner{
        mintThreshold = _newThreshold;
    } 

    function drip() external {
        uint256 lastMintTime = usersLastMintTime[msg.sender];
        require(block.timestamp >= lastMintTime + mintThreshold, "Only allowed to mint once every 12 hours!");

        _mint(msg.sender, 750 ether);

        usersLastMintTime[msg.sender] = block.timestamp;

        emit Drip(msg.sender, 750 ether);

    }

}