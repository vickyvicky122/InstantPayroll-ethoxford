# InstantPayroll

**Real-time verified payroll streaming powered by Flare enshrined protocols + Plasma cross-chain receipts.**

Built at ETH Oxford 2026.

---

## The Problem

Traditional payroll is broken. Workers wait weeks or months to get paid, with no transparency into how much they've earned or when payment arrives. Freelancers and gig workers face even worse conditions: delayed invoices, payment disputes, and no verifiable proof of work completion. Cross-border payments add currency conversion complexity and fees on top.

## The Solution

InstantPayroll turns payroll into a real-time stream. Employers deposit funds into a smart contract, workers prove their activity (GitHub commits), and payments flow automatically at configurable intervals. Every claim is:

- **Price-accurate** via Flare's FTSO oracle (USD-denominated rates paid in FLR)
- **Work-verified** via Flare's FDC data connector (on-chain proof of GitHub activity)
- **Bonus-eligible** via Flare's Secure Random (provably fair 1-in-10 chance of 2x payout)
- **Receipt-tracked** via Plasma cross-chain relay (zero-fee permanent payment records)

---

## How It Works

```
 EMPLOYER                           FLARE (Coston2)                              PLASMA (Testnet)
    |                                     |                                            |
    |-- createStream(worker, rate, $) --> |                                            |
    |       deposits FLR escrow           |                                            |
    |                                     |                                            |
 WORKER                                  |                                            |
    |-- claim(proof) ------------------> |                                            |
    |                                     |-- 1. FDC: verify GitHub commits            |
    |                                     |-- 2. FTSO: get FLR/USD price               |
    |                                     |-- 3. Secure Random: bonus lottery           |
    |                                     |-- 4. Transfer FLR to worker                |
    |                                     |                                            |
    |    <-------- payment received ------|                                            |
    |                                     |-- emit PaymentClaimed event                |
    |                                     |                                            |
                                    RELAYER                                            |
                                          |-- watches events on Flare                  |
                                          |-- recordPayout() -----------------------> |
                                          |                                   zero-fee receipt stored
    |                                     |                                            |
    |-- view history on both chains via frontend ------------------------------------ |
```

### Step by Step

1. **Employer** creates a payment stream: deposits C2FLR, sets a USD rate per interval (e.g., $0.50/min), and assigns a worker address
2. **Worker** claims payment after each interval by proving GitHub activity through Flare's FDC Web2Json attestation (or demo mode for testing)
3. **FTSO** provides the real-time FLR/USD exchange rate so the worker always receives the correct USD-equivalent amount in FLR
4. **Secure Random** generates a provably fair random number on each claim -- a 1-in-10 chance triggers a 2x bonus payout
5. **Payment** is transferred to the worker on Flare, and the stream state updates automatically
6. **Relayer** monitors `PaymentClaimed` events on Flare and writes them to the Plasma testnet contract as permanent, zero-fee payment receipts
7. **Worker** views their full payment history, earnings stats, and cross-chain records in the frontend dashboard

---

## Flare Enshrined Protocols

InstantPayroll uses **three** of Flare's enshrined data protocols, all accessed through the on-chain `ContractRegistry`:

### FTSO (Flare Time Series Oracle)

**Purpose:** Real-time FLR/USD price conversion for USD-denominated payroll.

Employers set payment rates in USD (e.g., $0.50 per interval), but payments are made in FLR. On every claim, the contract queries `TestFtsoV2Interface.getFeedById()` with the `FLR/USD` feed ID to get the current exchange rate and decimal precision. The payout is calculated as:

```
flrPayout = (usdRatePerInterval * 10^decimals) / flrUsdPrice
```

This ensures workers always receive the correct USD-equivalent value regardless of FLR price volatility. The price feed updates continuously through Flare's decentralized oracle network.

**Contract usage:** `InstantPayroll.sol` lines 134-141 (full claim) and 250-254 (demo claim)

### FDC (Flare Data Connector)

**Purpose:** On-chain verification of off-chain work activity (GitHub commits).

Before a worker can claim payment, they must prove they've been productive. FDC's `Web2Json` attestation type fetches data from the GitHub API, processes it with a JQ filter to extract the commit count, and generates a cryptographic proof that is verified on-chain.

The attestation flow:
1. **Prepare:** Script calls the FDC verifier API with the GitHub repo URL and a JQ filter (`{commitCount: . | length}`)
2. **Submit:** The encoded attestation request is submitted to `FdcHub` on Flare with a request fee
3. **Finalize:** The FDC protocol finalizes the attestation in the next voting round (~90 seconds)
4. **Verify:** The proof is retrieved from the Data Availability layer and passed to `InstantPayroll.claim()`, which calls `IFdcVerification.verifyWeb2Json()` to validate it on-chain
5. **Decode:** The ABI-encoded response is decoded to extract the verified commit count

```solidity
IFdcVerification fdcVerification = ContractRegistry.getFdcVerification();
require(fdcVerification.verifyWeb2Json(_proof), "Invalid FDC proof");
uint256 commitCount = abi.decode(_proof.data.responseBody.abiEncodedData, (uint256));
```

**Contract usage:** `InstantPayroll.sol` lines 123-132

### Secure Random

**Purpose:** Provably fair bonus lottery on each payment claim.

Every claim rolls a bonus lottery using Flare's on-chain random number generator (`RandomNumberV2Interface`). The random number is generated through Flare's decentralized protocol and is cryptographically secure. If `randomNumber % 10 == 0` (1-in-10 chance) and the random number is marked as secure, the worker receives a **2x payout**.

```solidity
RandomNumberV2Interface randomV2 = ContractRegistry.getRandomNumberV2();
(uint256 randomNumber, bool isSecure,) = randomV2.getRandomNumber();
if (isSecure && (randomNumber % BONUS_DIVISOR == 0)) {
    flrPayout *= BONUS_MULTIPLIER; // 2x bonus!
    bonusTriggered = true;
}
```

The bonus status is also visible in the frontend dashboard, so workers can see whether the current random state would trigger a bonus before claiming.

**Contract usage:** `InstantPayroll.sol` lines 143-150 (full claim) and 256-263 (demo claim)

---

## Plasma Integration

[Plasma](https://www.plasma.to) provides a fast, zero-fee L2 environment for storing payment receipts.

### Why Plasma?

While the core payment logic lives on Flare (where the enshrined protocols are), workers need a permanent, easily queryable record of all their earnings. Storing this on Flare would cost gas on every claim. Plasma's zero-fee testnet provides:

- **Free storage** for payment receipt records
- **Fast finality** for cross-chain writes
- **Separate query layer** so workers can check their total earnings without hitting Flare's RPC

### How It Works

The `InstantPayrollPayout` contract on Plasma testnet is a simple receipt ledger:

```solidity
struct Payout {
    uint256 flareStreamId;
    uint256 amountFLR;
    uint256 amountUSD;
    uint256 timestamp;
    bool bonusTriggered;
    uint256 commitCount;
}
```

A **relayer script** (`scripts/relayer.ts`) runs as a background process:
1. Connects to Flare Coston2 and listens for `PaymentClaimed` events
2. On each event, calls `recordPayout()` on the Plasma contract with the payment details
3. The Plasma contract stores the receipt and updates the worker's `totalEarnedUSD`

Workers can query their full payout history from Plasma via `getAllPayouts(address)` and see their lifetime USD earnings via `totalEarnedUSD(address)` -- all without any gas fees.

---

## Deployed Contracts

| Contract | Network | Chain ID | Address |
|----------|---------|----------|---------|
| InstantPayroll | Flare Coston2 | 114 | [`0xB36B121e227CEfE4e0936a6223dB22923493EAE3`](https://coston2-explorer.flare.network/address/0xB36B121e227CEfE4e0936a6223dB22923493EAE3) |
| InstantPayrollPayout | Plasma Testnet | 9746 | `0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4` |

---

## Architecture

```
frontend/                          React + TypeScript + ethers.js v6
  main.tsx ────────────────────> React entry point (StrictMode)
  App.tsx ─────────────────────> Router, ErrorBoundary, layout
  config.ts ───────────────────> ABIs, addresses, providers, network configs
  EmployerPage ────────────────> createStream(), endStream()
  WorkerPage ──────────────────> claimDemo(), getStream(), events
  useWallet ───────────────────> MetaMask provider + auto-reconnect

contracts/
  InstantPayroll.sol (Coston2) ──> FTSO + FDC + Secure Random
  InstantPayrollPayout.sol ──────> Plasma receipt storage (Plasma Testnet)

scripts/
  deploy.ts ─────────────────────> Deploy to Coston2
  deployPlasma.ts ───────────────> Deploy to Plasma Testnet
  createStream.ts ───────────────> Create payment stream (CLI)
  claimDemo.ts ──────────────────> Demo claim: FTSO + Random (CLI)
  fdcGithub.ts ──────────────────> Full FDC claim with GitHub proof (CLI)
  fdcTest.ts ────────────────────> Test FDC attestation flow (CLI)
  relayer.ts ────────────────────> Cross-chain event bridge (Flare -> Plasma)
  utils/fdc.ts ──────────────────> FDC attestation helpers
  utils/getters.ts ──────────────> Flare contract registry lookups
  utils/core.ts ─────────────────> Hex encoding utilities
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask with [Coston2 network](https://dev.flare.network/network/overview#coston2) configured
- C2FLR from [Flare Faucet](https://faucet.flare.network/coston2)

### Install and Run

```bash
# Clone and install
git clone <repo-url>
cd flare
npm install

# Set up environment
cp .env.example .env
# Edit .env: add your PRIVATE_KEY

# Compile contracts
npm run compile

# Start the frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Deploy Contracts (if redeploying)

```bash
# Deploy InstantPayroll to Flare Coston2
npm run deploy:coston2

# Deploy InstantPayrollPayout to Plasma Testnet
npm run deploy:plasma

# Update addresses in frontend/.env and root .env
```

### Create a Payment Stream (CLI)

```bash
WORKER_ADDRESS=0x... npx hardhat run scripts/createStream.ts --network coston2
```

### Claim Payment (CLI)

```bash
# Demo claim (FTSO + Secure Random, no FDC proof needed)
STREAM_ID=0 COMMIT_COUNT=5 npx hardhat run scripts/claimDemo.ts --network coston2

# Full FDC claim (verifies GitHub commits on-chain)
GITHUB_REPO=owner/repo STREAM_ID=0 npx hardhat run scripts/fdcGithub.ts --network coston2
```

### Run Cross-Chain Relayer

```bash
npx ts-node scripts/relayer.ts
```

---

## Frontend

The frontend is a React + TypeScript dashboard with two views:

**Employer Dashboard (`/`)**
- Create payment streams with configurable USD rate, claim interval, and FLR deposit
- View all active/ended streams with progress bars
- End streams and recover unused escrow
- Live FLR/USD price ticker from FTSO

**Worker Dashboard (`/worker`)**
- Stats: total earned FLR, live FLR/USD price, bonus lottery status, Plasma USD total
- Active streams with real-time countdown timers to next claim
- Claim button with pulsing glow when ready
- Tabbed history: Flare claims + Plasma payouts with bonus indicators

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.25, Hardhat, viaIR optimization |
| Flare Protocols | FTSO v2, FDC Web2Json, Secure Random v2 |
| Flare Libraries | @flarenetwork/flare-periphery-contracts v0.1.37 |
| Cross-chain | Custom relayer (ethers.js event listener) |
| Frontend | React 19, TypeScript, Vite, ethers.js v6 |
| Styling | Custom CSS design system (Flare-inspired dark theme) |
| Networks | Flare Coston2 (testnet), Plasma Testnet |

---

## Demo Mode vs Full FDC Mode

The contract supports two claim paths:

| | Demo Mode (`claimDemo`) | Full Mode (`claim`) |
|---|---|---|
| **Work verification** | Commit count passed as parameter | FDC Web2Json proof of GitHub API |
| **Who can call** | Worker or employer | Worker only |
| **FTSO price feed** | Yes | Yes |
| **Secure Random bonus** | Yes | Yes |
| **Use case** | Testing, hackathon demos | Production, real verification |

Demo mode exists because FDC testnet attestations require ~90 seconds for round finalization. For live demos, `claimDemo` provides the same FTSO + Secure Random experience instantly.

---

## License

MIT
