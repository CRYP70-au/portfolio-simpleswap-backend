require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const GOERLI_DEV_PRIVATE_KEY = process.env.GOERLI_DEV_PRIVATE_KEY
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.5.5"
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      chainId: 31337
    },
    goerli: {
      chainId: 5,
      url: GOERLI_RPC_URL,
      accounts: [
        GOERLI_DEV_PRIVATE_KEY
      ]
    }
  }
};
