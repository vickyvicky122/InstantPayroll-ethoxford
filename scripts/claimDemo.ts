import { web3 } from "hardhat";

const InstantPayroll = artifacts.require("InstantPayroll");

const INSTANT_PAYROLL_ADDRESS = process.env.INSTANT_PAYROLL_ADDRESS || "";
const STREAM_ID = process.env.STREAM_ID || "0";
const COMMIT_COUNT = process.env.COMMIT_COUNT || "1";

// npx hardhat run scripts/claimDemo.ts --network coston2
async function main() {
    if (!INSTANT_PAYROLL_ADDRESS) {
        throw new Error("Set INSTANT_PAYROLL_ADDRESS in .env");
    }

    const instantPayroll = await InstantPayroll.at(INSTANT_PAYROLL_ADDRESS);

    console.log("=== Demo Claim ===");
    console.log("  Stream ID:", STREAM_ID);
    console.log("  Commit Count:", COMMIT_COUNT);

    const tx = await instantPayroll.claimDemo(STREAM_ID, COMMIT_COUNT);
    console.log("\nClaim TX:", tx.tx);

    const claimEvent = tx.logs.find((log: any) => log.event === "PaymentClaimed");
    if (claimEvent) {
        const args = claimEvent.args;
        console.log("\n--- Payment Claimed ---");
        console.log("  Stream ID:", args.streamId.toString());
        console.log("  Worker:", args.worker);
        console.log("  Amount (FLR):", web3.utils.fromWei(args.amountFLR.toString(), "ether"));
        console.log("  Amount (USD):", web3.utils.fromWei(args.amountUSD.toString(), "ether"));
        console.log("  FLR/USD Price:", args.flrUsdPrice.toString());
        console.log("  Bonus Triggered:", args.bonusTriggered);
        console.log("  Commit Count:", args.commitCount.toString());
    }
}

void main().then(() => process.exit(0));
