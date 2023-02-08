// const fs = require("fs");
// const {ethers, network} = require("hardhat");

// const FRONT_END_ADDRESSES_FILE= "../portfolio-simpleswap-frontend/constants/contractAddresses.json"
// const FRONT_END_ABI_FILE_SWAP = "../portfolio-simpleswap-frontend/constants/swap-abi.json"
// const FRONT_END_ABI_FILE_TOKEN = "../portfolio-simpleswap-frontend/constants/token-abi.json"


// module.exports = async function () {
//     if(process.env.UPDATE_FRONT_END) {
//         console.log("UPDATING FRONTEND")
//         updateContractAddresses();
//         updateAbi();
//     }
// }

// async function updateAbi() {
//     const swap = await ethers.getContract("SimpleSwap");
//     const token = await ethers.getContract("TestToken");
//     fs.writeFileSync(FRONT_END_ABI_FILE_SWAP, swap.interface.format(ethers.utils.FormatTypes.json));
//     fs.writeFileSync(FRONT_END_ABI_FILE_TOKEN, token.interface.format(ethers.utils.FormatTypes.json));
// }

// async function updateContractAddresses(swap, tokenA, tokenB) {

//     const chainId = network.config.chainId.toString();
//     const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf-8"));
//     if(chainId in currentAddresses){
//         if(!currentAddresses[chainId].includes(swap.address)){
//             currentAddresses[chainId].push(swap.address);
//         }

//         if(!currentAddresses[chainId].includes(tokenA)){
//             currentAddresses[chainid].push(tokenA.address)
//         }
//         if(!currentAddresses[chainId].includes(tokenB)){
//             currentAddresses[chainid].push(tokenB.address)
//         }

//     }
//     fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
// }

// // module.exports.tags = ["all", "frontend"]