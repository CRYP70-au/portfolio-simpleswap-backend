require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

/** @type import('hardhat/config').HardhatUserConfig */
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
    }
  }
};
