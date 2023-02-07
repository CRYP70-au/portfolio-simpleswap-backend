// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {


    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {

        uint256 initialSupply = 10000000 ether;
        _mint(msg.sender, initialSupply);
    }


}