
const fs = require("fs");
const {ethers, network} = require("hardhat");
require('dotenv').config();


async function logBalances(swap, tokenA, tokenB, user) {

  console.log(`TokenA: ${ethers.utils.formatEther(await tokenA.balanceOf(user.address))}`);
  console.log(`TokenB: ${ethers.utils.formatEther(await tokenB.balanceOf(user.address))}`);
  console.log(`LPToken: ${ethers.utils.formatEther(await swap.balanceOf(user.address))}`);
  console.log("\n");

}

async function main() {

    let dev1;
    [dev1] = await ethers.getSigners()

    const swap = await ethers.getContractAt("SimpleSwap", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
    const tokenA = await ethers.getContractAt("TestToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
    const tokenB = await ethers.getContractAt("TestToken", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    // console.log(await tokenA.balanceOf(swap.address))
    // console.log(ethers.utils.formatEther(await swap.getTokenBPrice(ethers.utils.parseEther("1.0")))) 
    await tokenA.approve(swap.address, 0);
    await tokenB.approve(swap.address, 0);

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
module.exports = main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


module.exports.tags = ["all", "SimpleSwap"]