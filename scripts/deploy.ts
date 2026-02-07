import { run } from "hardhat";

const InstantPayroll = artifacts.require("InstantPayroll");

// npx hardhat run scripts/deploy.ts --network coston2
async function main() {
    const args: any[] = [];
    const instantPayroll = await InstantPayroll.new(...args);

    try {
        await run("verify:verify", {
            address: instantPayroll.address,
            constructorArguments: args,
        });
    } catch (e: any) {
        console.log("Verification error (may already be verified):", e.message);
    }

    console.log("InstantPayroll deployed to:", instantPayroll.address);
    return instantPayroll;
}

void main().then(() => {
    process.exit(0);
});
