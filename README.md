# InstantPayroll

Real-time verified payroll streaming powered by Flare + Plasma. Built at ETH Oxford 2026.

## What It Does

InstantPayroll lets employers create payment streams that pay workers in real-time. Workers prove their GitHub activity through Flare's enshrined data protocols, and payments are automatically converted from USD to FLR using live price feeds. A bonus lottery powered by provably fair randomness adds a 1-in-10 chance of 2x payout on each claim. All payment records are relayed cross-chain to Plasma for zero-fee receipt storage.

## Architecture

```
                    FLARE (Coston2)                         PLASMA (Testnet)
            ┌──────────────────────────┐            ┌─────────────────────────┐
            │    InstantPayroll.sol     │            │ InstantPayrollPayout.sol│
            │                          │            │                         │
 Employer──>│  createStream()          │            │  recordPayout()         │
            │  endStream()             │   Relayer  │  getAllPayouts()        │
 Worker────>│  claim() / claimDemo()   │───────────>│  totalEarnedUSD()      │
            │                          │            │                         │
            │  Uses:                   │            │  Zero-fee receipts      │
            │  - FTSO (FLR/USD price)  │            │  Payment history        │
            │  - FDC (GitHub verify)   │            └─────────────────────────┘
            │  - Secure Random (bonus) │
            └──────────────────────────┘
```

## Flare Enshrined Protocols Used

| Protocol | Usage |
|----------|-------|
| **FTSO** (Flare Time Series Oracle) | Real-time FLR/USD price feed for USD-denominated payroll conversion |
| **FDC** (Flare Data Connector) | Web2Json attestation verifying GitHub commit count via API |
| **Secure Random** | Provably fair bonus lottery - 1-in-10 chance of 2x payout |

## Plasma Integration

- **InstantPayrollPayout** contract on Plasma testnet records all payment events
- Cross-chain relayer watches Flare events and writes to Plasma
- Zero-fee payment receipts and earnings history for workers

## Deployed Contracts

| Contract | Network | Address |
|----------|---------|---------|
| InstantPayroll | Coston2 (Chain 114) | `0xB36B121e227CEfE4e0936a6223dB22923493EAE3` |
| InstantPayrollPayout | Plasma Testnet (Chain 9746) | `0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4` |

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask with Coston2 network configured
- C2FLR from [Flare Faucet](https://faucet.flare.network/)

### Setup

```bash
# Install dependencies
npm install

# Copy .env and set your private key
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# Compile contracts
npm run compile
```

### Deploy

```bash
# Deploy to Flare Coston2
npm run deploy:coston2

# Deploy to Plasma Testnet
npm run deploy:plasma
```

### Create a Payment Stream

```bash
WORKER_ADDRESS=0x... npx hardhat run scripts/createStream.ts --network coston2
```

### Claim Payment

```bash
# Demo claim (FTSO + Secure Random, bypasses FDC)
STREAM_ID=0 COMMIT_COUNT=5 npx hardhat run scripts/claimDemo.ts --network coston2

# Full FDC claim (verifies GitHub commits on-chain)
STREAM_ID=0 GITHUB_REPO=owner/repo npx hardhat run scripts/fdcGithub.ts --network coston2
```

### Run Cross-Chain Relayer

```bash
npx ts-node scripts/relayer.ts
```

### Frontend

```bash
cd frontend
npm install
# Set contract addresses in .env
npm run dev
```

## Project Structure

```
contracts/
  InstantPayroll.sol          # Main contract (Flare Coston2)
  InstantPayrollPayout.sol    # Payout records (Plasma Testnet)
scripts/
  deploy.ts                   # Deploy to Coston2
  deployPlasma.ts             # Deploy to Plasma
  createStream.ts             # Create payment stream
  claimDemo.ts                # Demo claim (FTSO + Random)
  fdcGithub.ts                # Full FDC claim with GitHub proof
  relayer.ts                  # Cross-chain event relayer
  utils/
    fdc.ts                    # FDC attestation utilities
    core.ts                   # Hex/encoding helpers
    getters.ts                # Flare contract registry getters
frontend/
  src/
    components/
      EmployerPage.tsx        # Create streams, manage deposits
      WorkerPage.tsx          # View earnings, claim history, Plasma payouts
      Header.tsx              # Navigation + wallet connection
    hooks/useWallet.ts        # MetaMask integration
    config.ts                 # Contract ABIs + chain configs
```

## How It Works

1. **Employer** creates a stream: deposits FLR, sets USD rate per interval and worker address
2. **Worker** proves GitHub activity via FDC Web2Json attestation (or demo mode)
3. **FTSO** converts USD rate to FLR amount using real-time price feed
4. **Secure Random** rolls a 1-in-10 bonus lottery for 2x payout
5. **Payment** is sent to worker on Flare
6. **Relayer** picks up the PaymentClaimed event and records it on Plasma
7. **Worker** can view full payment history on both chains via the frontend

## Tech Stack

- Solidity 0.8.25 with viaIR compilation
- Hardhat v2 + Truffle5 artifacts
- Flare Periphery Contracts v0.1.37
- React + TypeScript + ethers.js v6
- Vite for frontend bundling

## License

MIT
