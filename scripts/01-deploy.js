
const fs = require("fs");
const {ethers, network} = require("hardhat");
require('dotenv').config();

const FRONT_END_ADDRESSES_FILE= "../portfolio-frontend/constants/simpleswap/contractAddresses.json"
const FRONT_END_ABI_FILE_SWAP = "../portfolio-frontend/constants/simpleswap/swap-abi.json"
const FRONT_END_ABI_FILE_TOKEN = "../portfolio-frontend/constants/simpleswap/token-abi.json"

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
  if(process.env.UPDATE_FRONT_END) {
    console.log("Updating frontend...")
    await updateContractAddresses(swap, tokenA, tokenB);
    await updateAbi(swap, tokenA); // Because their abi is the same
  }

}

async function updateContractAddresses(swap, tokenA, tokenB) {

  const chainId = network.config.chainId.toString();
  const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf-8"));
  if(chainId in currentAddresses){
      if(!currentAddresses[chainId].includes(swap.address)){
          currentAddresses[chainId].push(swap.address);
      }
      if(!currentAddresses[chainId].includes(tokenA)){
          currentAddresses[chainId].push(tokenA.address)
      }
      if(!currentAddresses[chainId].includes(tokenB)){
          currentAddresses[chainId].push(tokenB.address)
      }
  }
  fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}

async function updateAbi(swap, token) {
  const simpleSwap = await ethers.getContractAt("SimpleSwap", swap.address);
  const tokenA = await ethers.getContractAt("TestToken", token.address);
  
  fs.writeFileSync(FRONT_END_ABI_FILE_SWAP, simpleSwap.interface.format(ethers.utils.FormatTypes.json));
  fs.writeFileSync(FRONT_END_ABI_FILE_TOKEN, tokenA.interface.format(ethers.utils.FormatTypes.json));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
module.exports = main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


module.exports.tags = ["all", "SimpleSwap"]