require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

function normalizePrivateKey(value) {
  if (!value) return value;
  return value.startsWith("0x") ? value : `0x${value}`;
}

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    eSpaceTestnet: {
      url: process.env.ESPACE_RPC_URL || "https://evmtestnet.confluxrpc.com",
      chainId: Number(process.env.ESPACE_CHAIN_ID || "71"),
      accounts: process.env.ESPACE_RELAYER_PRIVATE_KEY ? [normalizePrivateKey(process.env.ESPACE_RELAYER_PRIVATE_KEY)] : [],
    },
  },
};
