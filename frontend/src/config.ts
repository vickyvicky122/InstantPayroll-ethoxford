import { ethers } from "ethers";

// Contract addresses — update after deployment
export const INSTANT_PAYROLL_ADDRESS = import.meta.env.VITE_INSTANT_PAYROLL_ADDRESS || "";
export const PLASMA_PAYOUT_ADDRESS = import.meta.env.VITE_PLASMA_PAYOUT_ADDRESS || "";

// Chain configs
export const COSTON2_CHAIN_ID = 114;
export const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";
export const COSTON2_EXPLORER = "https://coston2-explorer.flare.network";

export const PLASMA_TESTNET_CHAIN_ID = 9746;
export const PLASMA_TESTNET_RPC = "https://testnet-rpc.plasma.to";

// Network configs for MetaMask
export const COSTON2_NETWORK = {
  chainId: "0x" + COSTON2_CHAIN_ID.toString(16),
  chainName: "Flare Testnet Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: [COSTON2_RPC],
  blockExplorerUrls: [COSTON2_EXPLORER],
};

export const PLASMA_NETWORK = {
  chainId: "0x" + PLASMA_TESTNET_CHAIN_ID.toString(16),
  chainName: "Plasma Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: [PLASMA_TESTNET_RPC],
  blockExplorerUrls: [],
};

// Contract ABIs (minimal — only what frontend needs)
export const INSTANT_PAYROLL_ABI = [
  "function createStream(address _worker, uint256 _usdRatePerInterval, uint256 _claimInterval) external payable returns (uint256)",
  "function endStream(uint256 _streamId) external",
  "function getStream(uint256 _streamId) external view returns (tuple(address employer, address worker, uint256 usdRatePerInterval, uint256 claimInterval, uint256 totalDeposit, uint256 totalClaimed, uint256 lastClaimTime, uint256 createdAt, bool active))",
  "function getCurrentPrice() external view returns (uint256 price, int8 decimals, uint64 timestamp)",
  "function checkBonusStatus() external view returns (uint256 randomNumber, bool isSecure, bool wouldTrigger)",
  "function nextStreamId() external view returns (uint256)",
  "event StreamCreated(uint256 indexed streamId, address indexed employer, address indexed worker, uint256 usdRatePerInterval, uint256 claimInterval, uint256 totalDeposit)",
  "event PaymentClaimed(uint256 indexed streamId, address indexed worker, uint256 amountFLR, uint256 amountUSD, uint256 flrUsdPrice, bool bonusTriggered, uint256 commitCount)",
  "event StreamEnded(uint256 indexed streamId, uint256 totalClaimed, uint256 refunded)",
];

export const PLASMA_PAYOUT_ABI = [
  "function getAllPayouts(address _worker) external view returns (tuple(uint256 flareStreamId, uint256 amountFLR, uint256 amountUSD, uint256 timestamp, bool bonusTriggered, uint256 commitCount)[])",
  "function getPayoutCount(address _worker) external view returns (uint256)",
  "function totalEarnedUSD(address) external view returns (uint256)",
  "event PayoutRecorded(address indexed worker, uint256 indexed flareStreamId, uint256 amountFLR, uint256 amountUSD, bool bonusTriggered, uint256 commitCount)",
];

// Read-only providers
export const flareProvider = new ethers.JsonRpcProvider(COSTON2_RPC);
export const plasmaProvider = new ethers.JsonRpcProvider(PLASMA_TESTNET_RPC);
