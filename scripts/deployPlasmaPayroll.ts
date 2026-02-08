import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Deploy PlasmaPayroll
  const PlasmaPayroll = await ethers.getContractFactory("PlasmaPayroll");
  const payroll = await PlasmaPayroll.deploy(usdcAddress);
  await payroll.waitForDeployment();
  const payrollAddress = await payroll.getAddress();
  console.log("PlasmaPayroll deployed to:", payrollAddress);

  console.log("\n--- Add to frontend/.env ---");
  console.log(`VITE_MOCK_USDC_ADDRESS=${usdcAddress}`);
  console.log(`VITE_PLASMA_PAYROLL_ADDRESS=${payrollAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
