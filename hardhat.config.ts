import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-web3";
require("@nomiclabs/hardhat-truffle5");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const FLARE_RPC_API_KEY = process.env.FLARE_RPC_API_KEY ?? "";
const FLARE_EXPLORER_API_KEY = process.env.FLARE_EXPLORER_API_KEY ?? "";

const COSTON2_EXPLORER_URL =
    process.env.COSTON2_EXPLORER_URL ?? "https://coston2-explorer.flare.network";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.25",
                settings: {
                    evmVersion: "cancun",
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        coston2: {
            url: FLARE_RPC_API_KEY
                ? `https://coston2-api-tracer.flare.network/ext/C/rpc?x-apikey=${FLARE_RPC_API_KEY}`
                : "https://coston2-api.flare.network/ext/C/rpc",
            accounts: [`${PRIVATE_KEY}`],
            chainId: 114,
        },
        coston: {
            url: FLARE_RPC_API_KEY
                ? `https://coston-api-tracer.flare.network/ext/C/rpc?x-apikey=${FLARE_RPC_API_KEY}`
                : "https://coston-api.flare.network/ext/C/rpc",
            accounts: [`${PRIVATE_KEY}`],
            chainId: 16,
        },
        flare: {
            url: FLARE_RPC_API_KEY
                ? `https://flare-api-tracer.flare.network/ext/C/rpc?x-apikey=${FLARE_RPC_API_KEY}`
                : "https://flare-api.flare.network/ext/C/rpc",
            accounts: [`${PRIVATE_KEY}`],
            chainId: 14,
        },
        plasmaTestnet: {
            url: "https://testnet-rpc.plasma.to",
            accounts: [`${PRIVATE_KEY}`],
            chainId: 9746,
        },
    },
    etherscan: {
        apiKey: {
            coston2: `${FLARE_EXPLORER_API_KEY}`,
        },
        customChains: [
            {
                network: "coston2",
                chainId: 114,
                urls: {
                    apiURL:
                        `${COSTON2_EXPLORER_URL}/api` +
                        (FLARE_EXPLORER_API_KEY
                            ? `?x-apikey=${FLARE_EXPLORER_API_KEY}`
                            : ""),
                    browserURL: COSTON2_EXPLORER_URL,
                },
            },
        ],
    },
    paths: {
        sources: "./contracts/",
        tests: "./test/",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    typechain: {
        target: "truffle-v5",
    },
};

export default config;
