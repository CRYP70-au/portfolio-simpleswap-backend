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
  const tokenB = await testTokenFactory.deploy("TokenB", "B");

  const swapFactory = await ethers.getContractFactory("SimpleSwap", deployer);
  const swap = await swapFactory.deploy(tokenA.address, tokenB.address);

  await tokenA.transfer(user1.address, ethers.utils.parseEther("250.0"));
  await tokenB.transfer(user1.address, ethers.utils.parseEther("250.0"));


  await tokenA.approve(swap.address, ethers.utils.parseEther("10000.0"));
  await tokenB.approve(swap.address, ethers.utils.parseEther("10000.0"));

  const deadline = await (await ethers.provider.getBlock("latest")).timestamp + [60 * 60 * 24];

  await swap.addLiquidity(ethers.utils.parseEther("10000.0"), ethers.utils.parseEther("5000.0"), deadline);

  //await logBalances(swap, tokenA, tokenB, deployer);

  await swap.approve(swap.address, await swap.balanceOf(deployer.address));
  //await swap.removeLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("250"), deadline);

  await logBalances(swap, tokenA, tokenB, user1);
  await tokenA.connect(user1).approve(swap.address, ethers.utils.parseEther("250.0"))
  await tokenB.connect(user1).approve(swap.address, ethers.utils.parseEther("250.0"))
  await swap.connect(user1).swap(0, ethers.utils.parseEther("250.0"), 0, 0);
  await logBalances(swap, tokenA, tokenB, user1);


  console.log(ethers.utils.formatEther(await swap.getTokenAPrice(ethers.utils.parseEther("1.0"))));


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
