const InstantPayrollPayout = artifacts.require("InstantPayrollPayout");

// npx hardhat run scripts/deployPlasma.ts --network plasmaTestnet
// Note: verify:verify is not called because Plasma Testnet (testnet.plasmascan.to) is not
// configured in hardhat's etherscan plugin. Verify manually if needed.
async function main() {
    const [deployer] = await web3.eth.getAccounts();
    console.log("Deploying with account:", deployer);

    // Relayer is the deployer for simplicity
    const args: any[] = [deployer];
    const payout = await InstantPayrollPayout.new(...args);

    console.log("InstantPayrollPayout deployed to:", payout.address);
    console.log("Relayer set to:", deployer);
    return payout;
}

void main().then(() => {
    process.exit(0);
});
