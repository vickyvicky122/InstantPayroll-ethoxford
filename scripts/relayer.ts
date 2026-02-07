import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

/**
 * Relayer script: watches PaymentClaimed events on Flare (Coston2)
 * and records them on Plasma testnet via InstantPayrollPayout contract.
 *
 * Usage:
 *   INSTANT_PAYROLL_ADDRESS=0x... PLASMA_PAYOUT_ADDRESS=0x... \
 *   npx ts-node scripts/relayer.ts
 */

const {
    PRIVATE_KEY = "",
    INSTANT_PAYROLL_ADDRESS = "",
    PLASMA_PAYOUT_ADDRESS = "",
    FLARE_RPC_API_KEY = "",
} = process.env;

const COSTON2_RPC = FLARE_RPC_API_KEY
    ? `https://coston2-api-tracer.flare.network/ext/C/rpc?x-apikey=${FLARE_RPC_API_KEY}`
    : "https://coston2-api.flare.network/ext/C/rpc";
const PLASMA_RPC = "https://testnet-rpc.plasma.to";

// InstantPayroll PaymentClaimed event ABI
const PAYMENT_CLAIMED_ABI = [
    "event PaymentClaimed(uint256 indexed streamId, address indexed worker, uint256 amountFLR, uint256 amountUSD, uint256 flrUsdPrice, bool bonusTriggered, uint256 commitCount)",
];

// InstantPayrollPayout recordPayout function ABI
const RECORD_PAYOUT_ABI = [
    "function recordPayout(address _worker, uint256 _flareStreamId, uint256 _amountFLR, uint256 _amountUSD, bool _bonusTriggered, uint256 _commitCount) external",
];

async function main() {
    if (!INSTANT_PAYROLL_ADDRESS || !PLASMA_PAYOUT_ADDRESS || !PRIVATE_KEY) {
        throw new Error(
            "Set INSTANT_PAYROLL_ADDRESS, PLASMA_PAYOUT_ADDRESS, and PRIVATE_KEY in .env"
        );
    }

    console.log("=== InstantPayroll Relayer ===");
    console.log("Watching Flare (Coston2) for PaymentClaimed events...");
    console.log("Relaying to Plasma testnet...\n");

    // Connect to Flare (Coston2) — read events
    const flareProvider = new ethers.JsonRpcProvider(COSTON2_RPC);
    const flareContract = new ethers.Contract(
        INSTANT_PAYROLL_ADDRESS,
        PAYMENT_CLAIMED_ABI,
        flareProvider
    );

    // Connect to Plasma — write payouts
    const plasmaProvider = new ethers.JsonRpcProvider(PLASMA_RPC);
    const plasmaSigner = new ethers.Wallet(PRIVATE_KEY, plasmaProvider);
    const plasmaContract = new ethers.Contract(
        PLASMA_PAYOUT_ADDRESS,
        RECORD_PAYOUT_ABI,
        plasmaSigner
    );

    // Listen for PaymentClaimed events
    flareContract.on(
        "PaymentClaimed",
        async (
            streamId: bigint,
            worker: string,
            amountFLR: bigint,
            amountUSD: bigint,
            flrUsdPrice: bigint,
            bonusTriggered: boolean,
            commitCount: bigint
        ) => {
            console.log(`\n--- PaymentClaimed on Flare ---`);
            console.log(`  Stream: ${streamId}`);
            console.log(`  Worker: ${worker}`);
            console.log(`  Amount: ${ethers.formatEther(amountFLR)} FLR`);
            console.log(`  Bonus: ${bonusTriggered}`);
            console.log(`  Commits: ${commitCount}`);

            try {
                console.log("  Relaying to Plasma...");
                const tx = await plasmaContract.recordPayout(
                    worker,
                    streamId,
                    amountFLR,
                    amountUSD,
                    bonusTriggered,
                    commitCount
                );
                const receipt = await tx.wait();
                console.log(`  Relayed! Plasma TX: ${receipt.hash}`);
            } catch (error: any) {
                console.error("  Relay failed:", error.message);
            }
        }
    );

    console.log("Relayer running. Press Ctrl+C to stop.\n");

    // Keep process alive
    await new Promise(() => {});
}

void main();
