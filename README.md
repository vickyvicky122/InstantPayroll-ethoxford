# InstantPayroll

**Verified payroll on Flare — free permanent receipts on Plasma — exportable payment records.**

Built at ETH Oxford 2026.

---

## Built on Flare

- **Network:** Flare Coston2 Testnet (Chain ID 114) + Plasma Testnet (Chain ID 9746)
- **Integrations:**
  - **FTSO v2** — Real-time FLR/USD price oracle for USD-denominated payroll
  - **FDC (Web2Json)** — On-chain verification of GitHub commits and Google Docs revisions as proof of work
  - **Secure Random v2** — Provably fair bonus lottery (1-in-10 chance of 2x payout)
- **Demo:** http://localhost:5173 (run `npm run frontend:dev` after setup — see [Quick Start](#quick-start) below)
- **Setup:** See [Quick Start](#quick-start) for full install and run instructions
- **Smart Contracts:**

| Contract | Network | Address |
|----------|---------|---------|
| InstantPayroll | Flare Coston2 | [`0xcdACc7626de63B86C63b4F97EA7AfbB3610D927e`](https://coston2-explorer.flare.network/address/0xcdACc7626de63B86C63b4F97EA7AfbB3610D927e) |
| InstantPayrollPayout | Plasma Testnet | [`0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4`](https://testnet.plasmascan.to/address/0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4) |

- **Environment Variables:** See `.env.example` (root) and `frontend/.env.example`
- **License:** MIT

---

## The Problem

Paying global contributors is still broken — and the $1.5 trillion freelance economy is paying the price.

**Employers overpay for unverified work.** Remote managers have no reliable way to verify what a contractor actually delivered before payment runs. They pay based on reported hours, not proven output. When a freelancer underdelivers, the employer has already paid. When a contract ends on day 12, the employer has already wired the full month.

**Freelancers wait weeks to get paid.** Monthly and biweekly pay cycles mean freelancers finance their own work for 30+ days. Cross-border bank transfers add more delays. When disputes arise, payments freeze entirely. The people doing the work are the last to see the money.

**Remote teams have no accountability layer.** Traditional tools show presence (Slack online, hours logged) — not productivity. Employers need verifiable proof that work actually happened, tied directly to the payment flow, not another dashboard to check. Without this, managing distributed contractors across time zones becomes a trust exercise.

**Fees make frequent payments irrational.** Paying a contractor $5 for a quick task costs $3+ in wire fees, FX conversion, and platform cuts. This forces employers into infrequent batch payments, which delays freelancer income and makes micro-task compensation uneconomical.

## Why Continuous Proof-of-Work Payroll

The fix isn't faster invoicing. It's a fundamentally different model: **continuous payment streams gated by cryptographic proof of work**.

- **Pay continuously, not monthly.** Workers earn every minute, not every month. Employers deposit into escrow streams, workers claim accumulated earnings at any interval. No invoicing, no payment runs, no 30-day waits. Cash flow becomes real-time for both sides.
- **Require proof before payment.** Every claim can require cryptographic proof — verified GitHub commits or Google Docs revisions attested by the Flare validator set via FDC. The smart contract won't release funds unless the proof checks out. Employers stop paying for unverified hours; workers get paid the moment they can prove delivery.
- **Accurate pay, zero overspend.** USD-denominated rates with live oracle pricing mean workers receive exactly the right value regardless of crypto volatility. Employers set budgets in dollars. Streams can be ended at any time to recover unused funds — no more paying out a full month when a contract ends early.
- **Free permanent receipts.** Every Flare claim is mirrored to Plasma at zero cost via a relayer. Workers get a complete, queryable payment history stored on-chain permanently — no indexer needed.
- **Audit-ready records from day one.** Every payment is recorded on-chain with full context: amount, timestamp, work proof, exchange rate, and bonus status. Workers export CSV for tax filing. Employers get a verifiable ledger that no one can retroactively edit.

## The Solution

InstantPayroll reimagines payments as continuous streams with cryptographic proof of work:

**Verified Payroll on Flare**
- USD-denominated rates **auto-converted to FLR** via Flare's enshrined FTSO oracle
- **On-chain work verification** via FDC — proves GitHub commits (or Google Docs revisions) before payment
- **Provably fair bonus lottery** via Secure Random (1-in-10 chance of 2x payout)
- All claims are mirrored to Plasma via a relayer for **free permanent receipts**

**Free Receipt Storage on Plasma**
- Every Flare claim is written to Plasma at **zero cost** via a cross-chain relayer
- Workers get a complete, queryable payment history stored on-chain permanently
- **Exportable as CSV** for accounting, tax filing, or audit

### Why This Matters for Payments

| Challenge | How InstantPayroll Solves It |
|---|---|
| Settlement speed | Streaming — workers claim earnings every 60 seconds, not every 2 weeks |
| Trust & disputes | On-chain verification — FDC proves work happened before payment flows |
| Cross-border conversion | FTSO oracle — live USD→FLR conversion with no external oracle fees |
| Payment records | Free Plasma receipts — complete history stored on-chain at zero cost |
| Audit & compliance | CSV export of full history — workers, accountants, tax tools can all access records |

---

## How It Works

### Verified Payroll (Flare — FLR with Oracle Pricing)

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
    |-- Export CSV ← history from both chains via frontend -------------------------- |
```

1. **Employer** deposits FLR, sets a USD rate per interval (e.g., $0.50/min), and assigns a worker
2. **Worker** proves activity (GitHub commits) via Flare's FDC attestation, then claims payment
3. **FTSO** provides live FLR/USD pricing so workers always receive the correct USD-equivalent
4. **Secure Random** rolls a provably fair bonus on each claim (1-in-10 chance of 2x payout)
5. **Relayer** mirrors every claim to Plasma as a zero-fee permanent receipt
6. **Worker** exports complete payment history (both chains) as CSV

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

## Plasma Integration — Free Permanent Receipt Storage

[Plasma](https://www.plasma.to) is a zero-fee EVM chain. Transactions cost nothing. This makes it the ideal storage layer for payment receipts.

### InstantPayrollPayout.sol

Every Flare-based claim is mirrored to Plasma via a relayer as a permanent, queryable receipt:

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

A **relayer script** (`scripts/relayer.ts`) watches Flare events and writes them to Plasma:
1. Connects to Flare Coston2 and listens for `PaymentClaimed` events
2. Calls `recordPayout()` on Plasma with payment details — zero fee
3. Maintains per-worker `totalEarnedUSD` lifetime counter

Workers query `getAllPayouts(address)` for complete history, or **export as CSV** from the frontend for accounting, taxes, or audit.

---

## Deployed Contracts

| Contract | Network | Chain ID | Purpose | Address |
|----------|---------|----------|---------|---------|
| InstantPayroll | Flare Coston2 | 114 | FLR payroll with FTSO + FDC + RNG | [`0xcdACc7626de63B86C63b4F97EA7AfbB3610D927e`](https://coston2-explorer.flare.network/address/0xcdACc7626de63B86C63b4F97EA7AfbB3610D927e) |
| InstantPayrollPayout | Plasma Testnet | 9746 | Zero-fee receipt storage | [`0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4`](https://testnet.plasmascan.to/address/0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4) |

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
# Edit .env: add your PRIVATE_KEY and deployed contract addresses

# Set up frontend environment
cd frontend
npm install
cp .env.example .env
# Edit frontend/.env: add VITE_INSTANT_PAYROLL_ADDRESS (must match root .env)
cd ..

# Compile contracts
npm run compile

# Start the frontend
npm run frontend:dev
# Open http://localhost:5173
```

### Deploy Contracts (if redeploying)

```bash
# Deploy InstantPayroll to Flare Coston2
npm run deploy:coston2

# Deploy InstantPayrollPayout to Plasma Testnet
npm run deploy:plasma

# Update addresses in BOTH frontend/.env and root .env (they must match)
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

The frontend is a React + TypeScript dashboard:

**Employer Dashboard**
- Deposit FLR, set USD rates, create work-verified streams on Flare with live FTSO price ticker
- Monitor stream progress with live progress bars, end streams to recover unused funds

**Worker Dashboard**
- Claim with GitHub/Google Docs proof via FDC (5-step attestation flow) or Quick Claim demo
- Bonus lottery indicator, countdown timers, verified commit count display
- **Flare Claims** tab shows claim events with bonus status
- **Plasma Receipts** tab shows structured receipts with lifetime USD totals (via relayer)
- **CSV export** on all payment history views

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

## Building on Flare — Developer Experience

### What Worked Well

**ContractRegistry is a great pattern.** Accessing FTSO, FDC, and Secure Random through a single on-chain registry (`ContractRegistry.getTestFtsoV2()`, `ContractRegistry.getFdcVerification()`, etc.) meant we didn't have to hardcode protocol addresses or worry about them changing across deployments. One import, one call, and you have a live price feed. Coming from Chainlink where you manage separate oracle contract addresses per feed per network, this felt much cleaner.

**FTSO v2 was the easiest integration.** Getting a price feed was three lines of Solidity — get the interface from the registry, call `getFeedById` with the feed ID, and use the result. The feed ID format (`0x01464c522f555344...` for FLR/USD) is documented in the dev hub. The decimal precision comes back with the price, so no guessing. We had FTSO working in under 30 minutes.

**Secure Random was equally straightforward.** Call `getRandomNumber()`, check the `isSecure` flag, use the number. The `isSecure` boolean is a nice touch — it tells you whether the number came from the full threshold protocol or a fallback, so you can gate security-sensitive logic on it. Our bonus lottery was implemented in about 7 lines of Solidity.

**The Hardhat starter kit saved real time.** Network configs, compiler settings, and periphery contract imports were already wired up. We cloned it, added our contract, and were deploying to Coston2 within the first hour.

**Coston2 testnet is fast and reliable.** Transactions confirmed in seconds, the faucet worked without issues, and the block explorer (Blockscout) had contract verification working. We never had to wait on the testnet or debug RPC connectivity during development.

### What Was Challenging

**FDC Web2Json had the steepest learning curve.** The concept is powerful — verify any public API response on-chain — but the end-to-end flow has many moving parts: prepare the attestation request with the right ABI encoding, submit it to FdcHub with the correct fee, calculate the voting round ID from the block timestamp, poll the Relay contract for finalization, then fetch the Merkle proof from the Data Availability layer. Each step has its own API and data format. We spent roughly 4 hours on FDC integration, more than FTSO and Secure Random combined.

The JQ filter for post-processing the API response (`{commitCount: . | length}`) took some trial and error to get right — the verifier API returns helpful error messages, but the feedback loop is slow because you have to wait for a full attestation round (~90 seconds on testnet) to see if your filter produced the expected output. A local dry-run mode for testing JQ filters against API responses before submitting on-chain would have cut our iteration time significantly.

**FDC testnet finalization latency (~90s) required a design workaround.** For a hackathon demo, waiting 90 seconds between "worker proves work" and "worker gets paid" breaks the narrative flow. We solved this by adding a `claimDemo()` function that bypasses FDC but keeps FTSO and Secure Random, so the live demo stays snappy while the repo contains the full FDC integration. This is a testnet limitation, not a protocol issue — mainnet finalization is faster — but it's worth noting for other hackathon builders.

**ABI encoding for the attestation request body was fiddly.** The request needs specific Solidity types encoded in a particular order (url, httpMethod, postprocessJq, headerParamName, headerParamValue, body, abiSignature). Getting the encoding right required careful reading of the FDC docs and cross-referencing with the verifier API's `prepareRequest` endpoint. More complete examples in the starter kit for Web2Json specifically (not just EVM transaction attestations) would help.

### Suggestions for Flare

1. **Add a Web2Json example to the Hardhat starter kit.** The existing FDC examples focus on EVM transaction verification. A working Web2Json example with a public API (e.g., a weather API or GitHub) would lower the barrier for builders wanting to bring Web2 data on-chain.
2. **Provide a local JQ filter tester.** A CLI tool or web UI where you can paste an API URL and JQ filter and see the processed output instantly, before committing to an on-chain attestation round.
3. **Document the full attestation request ABI encoding.** The current docs cover the concept well but could include more copy-paste-ready code for constructing the `abiEncodedRequest` bytes for each attestation type.

### Overall

Flare's enshrined protocols are genuinely differentiated. Having price feeds, data attestation, and randomness as first-class network features — not external services — simplifies both the trust model and the developer experience. FTSO and Secure Random are production-ready for hackathon-speed development. FDC Web2Json is the most powerful of the three but needs more starter examples to match the onboarding quality of the other protocols.

---

## License

MIT
