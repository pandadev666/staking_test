require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");

const fs = require('fs');

const config = fs.readFileSync(".secret").toString().trim();

/** @type import('hardhat/config').HardhatUserConfig */
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  networks: {
    testnet: {
      url: `https://sepolia.infura.io/v3/a3e4125e854a44a49c1452c794b29647`,
      chainId: 11155111,
      gasPrice: 20000000000,
      accounts: [config]
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [config]
    },
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    }
  },
  etherscan: {
    apiKey: "TFIN9DM77FQ7724NGG8VMMX9232I9MMVVP"
  }
};
