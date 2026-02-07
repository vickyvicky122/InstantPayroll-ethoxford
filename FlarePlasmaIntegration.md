# Flare + Plasma Integration: How and Why

## The Core Idea

InstantPayroll splits its workload across two chains — **Flare** for computation and **Plasma** for record-keeping — because each chain does something the other cannot.

Flare provides enshrined data protocols (FTSO price feeds, FDC Web2 attestation, Secure Random) that no other EVM chain offers natively. Plasma provides zero-fee transactions, making it viable to store every single micro-payment receipt on-chain without cost accumulating over time.

Using both together produces a payroll system where every claim is **verified by real-world data on Flare** and **permanently recorded for free on Plasma**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FLARE (Coston2)                                                │
│                                                                 │
│  InstantPayroll.sol                                             │
│  ├── createStream()  ← Employer deposits FLR escrow            │
│  ├── claim()         ← Worker proves GitHub activity via FDC    │
│  │   ├── FDC Web2Json  → verifies GitHub commits on-chain       │
│  │   ├── FTSO v2       → converts USD rate to FLR at live price │
│  │   └── Secure Random → 1-in-10 bonus lottery (2x payout)     │
│  ├── claimDemo()     ← Demo mode (bypasses FDC, keeps FTSO+RNG)│
│  └── endStream()     ← Employer recovers unused escrow          │
│                                                                 │
│  emits PaymentClaimed(streamId, worker, amountFLR, amountUSD,   │
│                       flrUsdPrice, bonusTriggered, commitCount)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                         Relayer watches
                         PaymentClaimed events
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│  PLASMA (Testnet)                                               │
│                                                                 │
│  InstantPayrollPayout.sol                                       │
│  ├── recordPayout()      ← Relayer writes each claim receipt    │
│  ├── getAllPayouts()      ← Worker queries full payment history │
│  └── totalEarnedUSD()    ← Lifetime USD earnings per worker    │
│                                                                 │
│  Zero-fee storage: every receipt is on-chain at no cost         │
└─────────────────────────────────────────────────────────────────┘
```

## What Flare Does (and Why Only Flare Can)

Flare's value is its **enshrined protocols** — data services baked into the network at the validator level, not bolted on through third-party oracles. InstantPayroll uses three of them in a single `claim()` transaction:

### 1. FDC (Flare Data Connector) — Work Verification

The FDC's Web2Json attestation type lets a smart contract verify data from any public Web2 API. InstantPayroll uses it to query the GitHub API and prove that a worker has pushed commits.

The flow:
1. Worker submits an attestation request for `https://api.github.com/repos/{owner}/{repo}/commits?since={timestamp}`
2. FDC attestation providers fetch the URL, apply a JQ filter (`{commitCount: . | length}`), and reach consensus
3. The resulting proof is submitted to `claim()`, which calls `FdcVerification.verifyWeb2Json(proof)` on-chain
4. The contract decodes the ABI-encoded response to extract the commit count

This is structurally impossible on other EVM chains without trusting a centralized oracle. On Flare, the verification is performed by the same validator set that secures the network.

### 2. FTSO v2 — Price Conversion

Payment streams are denominated in USD (e.g., $0.50 per interval) but paid in FLR. On every claim, the contract calls `FtsoV2.getFeedById(FLR_USD_FEED_ID)` to get the current exchange rate and calculates:

```
flrPayout = (usdRatePerInterval * 10^decimals) / flrUsdPrice
```

Because FTSO is enshrined, this price feed has the same security guarantees as Flare itself — no external oracle risk, no additional trust assumption.

### 3. Secure Random v2 — Bonus Lottery

Each claim includes a bonus check using Flare's threshold-signature random number generator:

```solidity
(uint256 randomNumber, bool isSecure,) = randomV2.getRandomNumber();
if (isSecure && (randomNumber % 10 == 0)) {
    flrPayout *= 2;  // 2x bonus
}
```

The `isSecure` flag ensures the number was generated through the full threshold protocol rather than derived from a blockheader. This makes the lottery verifiably fair — no miner/validator can influence the outcome.

## What Plasma Does (and Why It's the Right Choice)

Plasma is a zero-fee EVM chain. Transactions cost nothing. This changes what's economically rational to store on-chain.

### The Problem with Receipt Storage on Flare

If a worker claims 50 times per day at 60-second intervals, storing each receipt on Flare means 50 on-chain writes per day with gas fees. For a payroll product, the cost of record-keeping shouldn't eat into the payment itself.

### The Solution: Free Permanent Receipts on Plasma

On Plasma, those same 50 writes cost zero. The `InstantPayrollPayout` contract stores every claim as a structured `Payout` record:

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

It also maintains a running `totalEarnedUSD` per worker — a lifetime earnings counter that costs nothing to update.

Workers (or any third party — accountants, tax tools, auditors) can call `getAllPayouts(worker)` to get a complete, verifiable payment history without parsing event logs or relying on an indexer.

## The Relayer: Connecting the Two Chains

The `relayer.ts` script is the bridge between Flare and Plasma:

1. It connects to Flare (Coston2) as a read-only listener
2. It connects to Plasma testnet with a signing wallet
3. When a `PaymentClaimed` event fires on Flare, it extracts the event data (worker, stream ID, amounts, bonus status, commit count)
4. It calls `recordPayout()` on the Plasma contract with that data

The relayer is a simple, stateless process. If it misses an event, it can be replayed from Flare event history. The Plasma contract's `onlyRelayer` modifier ensures only the authorized relayer can write records.

## Why This Two-Chain Design Is Unique

### 1. Each Chain Plays to Its Strength

Most multi-chain applications deploy the same logic on multiple chains for liquidity or user reach. InstantPayroll does the opposite — it uses each chain for what it's uniquely good at:

- **Flare**: Computation that requires enshrined data (price feeds, Web2 attestation, randomness)
- **Plasma**: Storage that requires zero marginal cost (payment receipts, earnings aggregation)

### 2. Data Flows in One Direction

The bridge is unidirectional: Flare → Plasma. There's no complex bidirectional message passing, no lock-and-mint, no liquidity pools. Events on Flare are facts; Plasma records them. This makes the system simple to reason about and hard to break.

### 3. The Worker Gets Two Views of the Same Truth

The frontend reads from both chains simultaneously:
- **Flare tab**: Raw claim events from `queryFilter` — shows FLR amounts, FTSO prices at time of claim, bonus status
- **Plasma tab**: Structured payout records from `getAllPayouts` — shows lifetime USD totals, full history as stored data

Same underlying payments, two complementary perspectives. Flare gives you the execution details; Plasma gives you the accounting.

### 4. No Protocol Exists for This Without Flare

The combination of on-chain Web2 API verification (FDC), native price feeds (FTSO), and verifiable randomness (Secure Random) — all in one transaction, all enshrined at the protocol level — doesn't exist on any other EVM chain. Chainlink VRF + Chainlink Functions + Chainlink Price Feeds could approximate it on Ethereum, but as three separate external services with three separate trust models and three separate fee structures.

On Flare, it's one trust model (the validator set), one fee (gas), and one transaction.

## Deployed Contracts

| Contract | Chain | Address |
|---|---|---|
| InstantPayroll | Flare Coston2 (chain 114) | `0xB36B121e227CEfE4e0936a6223dB22923493EAE3` |
| InstantPayrollPayout | Plasma Testnet (chain 9746) | `0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4` |
