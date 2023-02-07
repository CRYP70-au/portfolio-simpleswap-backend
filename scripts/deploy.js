// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const {ethers, network} = require("hardhat");

async function logBalances(swap, tokenA, tokenB, user) {

  console.log(`TokenA: ${ethers.utils.formatEther(await tokenA.balanceOf(user.address))}`);
  console.log(`TokenB: ${ethers.utils.formatEther(await tokenB.balanceOf(user.address))}`);
  console.log(`LPToken: ${ethers.utils.formatEther(await swap.balanceOf(user.address))}`);
  console.log("\n");

}

async function main() {

  let deployer, user1;
  [deployer, user1] = await ethers.getSigners();

  // Setup Scenario
  const testTokenFactory = await ethers.getContractFactory("TestToken", deployer);
  const tokenA = await testTokenFactory.deploy("TokenA", "A");
  await tokenA.deployed();

  const tokenB = await testTokenFactory.deploy("TokenB", "B");
  await tokenB.deployed();

  const swapFactory = await ethers.getContractFactory("SimpleSwap", deployer);
  const swap = await swapFactory.deploy(tokenA.address, tokenB.address);
  await swap.deployed();

  console.log("Contract addresses:");
  console.log(`SimpleSwap: ${swap.address}`);
  console.log(`Token A: ${tokenA.address}`);
  console.log(`Token B: ${tokenB.address}`);



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
