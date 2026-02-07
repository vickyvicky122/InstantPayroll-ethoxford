import { ethers } from "ethers";

// Contract addresses — update after deployment
export const INSTANT_PAYROLL_ADDRESS = import.meta.env.VITE_INSTANT_PAYROLL_ADDRESS || "";

// Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// --- Network-aware configuration ---

type NetworkId = "coston2" | "flare";

interface FlareNetworkConfig {
  chainId: number;
  chainName: string;
  currencyName: string;
  currencySymbol: string;
  rpcUrl: string;
  explorerUrl: string;
  daLayerUrl: string;
  fdcVerifierUrl: string;
}

const NETWORKS: Record<NetworkId, FlareNetworkConfig> = {
  coston2: {
    chainId: 114,
    chainName: "Flare Testnet Coston2",
    currencyName: "Coston2 Flare",
    currencySymbol: "C2FLR",
    rpcUrl: "https://coston2-api.flare.network/ext/C/rpc",
    explorerUrl: "https://coston2-explorer.flare.network",
    daLayerUrl: "https://ctn2-data-availability.flare.network",
    fdcVerifierUrl: "https://fdc-verifiers-testnet.flare.network",
  },
  flare: {
    chainId: 14,
    chainName: "Flare Mainnet",
    currencyName: "Flare",
    currencySymbol: "FLR",
    rpcUrl: "https://flare-api.flare.network/ext/C/rpc",
    explorerUrl: "https://flare-explorer.flare.network",
    daLayerUrl: "https://flr-data-availability.flare.network",
    fdcVerifierUrl: "https://fdc-verifiers-mainnet.flare.network",
  },
};

export const ACTIVE_NETWORK: NetworkId =
  (import.meta.env.VITE_NETWORK as NetworkId) || "coston2";
export const NETWORK_CONFIG = NETWORKS[ACTIVE_NETWORK];

export const FLARE_CHAIN_ID = NETWORK_CONFIG.chainId;
export const FLARE_RPC = NETWORK_CONFIG.rpcUrl;
export const FLARE_EXPLORER = NETWORK_CONFIG.explorerUrl;
export const CURRENCY_SYMBOL = NETWORK_CONFIG.currencySymbol;

export const FLARE_NETWORK = {
  chainId: "0x" + NETWORK_CONFIG.chainId.toString(16),
  chainName: NETWORK_CONFIG.chainName,
  nativeCurrency: {
    name: NETWORK_CONFIG.currencyName,
    symbol: NETWORK_CONFIG.currencySymbol,
    decimals: 18,
  },
  rpcUrls: [NETWORK_CONFIG.rpcUrl],
  blockExplorerUrls: [NETWORK_CONFIG.explorerUrl],
};

export const FDC_API_KEY =
  import.meta.env.VITE_FDC_API_KEY || "00000000-0000-0000-0000-000000000000";

// Plasma config — only relevant on testnet
export const PLASMA_ENABLED = ACTIVE_NETWORK === "coston2";
export const PLASMA_PAYOUT_ADDRESS = PLASMA_ENABLED
  ? import.meta.env.VITE_PLASMA_PAYOUT_ADDRESS || ""
  : "";

export const PLASMA_TESTNET_CHAIN_ID = 9746;
export const PLASMA_TESTNET_RPC = "https://testnet-rpc.plasma.to";

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
  "function claimDemo(uint256 _streamId, uint256 _commitCount) external",
  "function claim(uint256 _streamId, tuple(bytes32[] merkleProof, tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, tuple(string url, string httpMethod, string headers, string queryParams, string body, string postProcessJq, string abiSignature) requestBody, tuple(bytes abiEncodedData) responseBody) data)) external",
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
export const flareProvider = new ethers.JsonRpcProvider(FLARE_RPC);
export const plasmaProvider = new ethers.JsonRpcProvider(PLASMA_TESTNET_RPC);
