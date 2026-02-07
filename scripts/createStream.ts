import { ethers } from "hardhat";

const InstantPayroll = artifacts.require("InstantPayroll");

// npx hardhat run scripts/createStream.ts --network coston2
// Set these before running:
const INSTANT_PAYROLL_ADDRESS = process.env.INSTANT_PAYROLL_ADDRESS || "";
const WORKER_ADDRESS = process.env.WORKER_ADDRESS || "";

async function main() {
    if (!INSTANT_PAYROLL_ADDRESS || !WORKER_ADDRESS) {
        throw new Error("Set INSTANT_PAYROLL_ADDRESS and WORKER_ADDRESS in .env");
    }

    const instantPayroll = await InstantPayroll.at(INSTANT_PAYROLL_ADDRESS);

    // USD rate per interval: $0.50 per interval (scaled by 1e18)
    const usdRatePerInterval = ethers.parseEther("0.5");
    // Claim interval: 60 seconds (1 minute for demo)
    const claimInterval = 60;
    // Deposit: 10 FLR (C2FLR on testnet)
    const deposit = ethers.parseEther("10");

    console.log("Creating stream...");
    console.log("  Worker:", WORKER_ADDRESS);
    console.log("  USD Rate/Interval:", ethers.formatEther(usdRatePerInterval), "USD");
    console.log("  Claim Interval:", claimInterval, "seconds");
    console.log("  Deposit:", ethers.formatEther(deposit), "C2FLR");

    const tx = await instantPayroll.createStream(
        WORKER_ADDRESS,
        usdRatePerInterval.toString(),
        claimInterval,
        { value: deposit.toString() }
    );

    console.log("\nStream created! TX:", tx.tx);

    // Parse the StreamCreated event
    const streamCreatedEvent = tx.logs.find(
        (log: any) => log.event === "StreamCreated"
    );
    if (streamCreatedEvent) {
        console.log("Stream ID:", streamCreatedEvent.args.streamId.toString());
        console.log("Employer:", streamCreatedEvent.args.employer);
        console.log("Worker:", streamCreatedEvent.args.worker);
    }
}

void main().then(() => {
    process.exit(0);
});
