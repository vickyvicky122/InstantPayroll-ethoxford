---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Innovative Flare Network hackathon project using real-world external data on-chain or cross-chain applications secured by Flare protocols'
session_goals: 'Generate a standout ETH Oxford hackathon concept demonstrating novel use of Flare data protocols (FTSO, FDC, Secure Random, FAssets) + Plasma stablecoin payments'
selected_approach: 'progressive-flow'
techniques_used: ['What If Scenarios + Cross-Pollination', 'Morphological Analysis', 'SCAMPER Method', 'Decision Tree Mapping + Resource Constraints']
ideas_generated: [38]
selected_concept: 'InstantPayroll — Real-Time Verified Work-and-Pay Streaming'
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** winner
**Date:** 2026-02-07

## Session Overview

**Topic:** Innovative Flare Network hackathon project — leveraging real-world external data on-chain or building cross-chain applications secured by Flare's protocols (FTSO, State Connector, LayerCake)
**Goals:** Generate a hackathon-winning concept for ETH Oxford that shows genuine innovation in how real-world data meets on-chain logic

### Session Setup

_Session configured for progressive technique flow — starting with broad divergent thinking then systematically narrowing toward actionable concepts._

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Systematic development from exploration to action

**Progressive Techniques:**

- **Phase 1 - Exploration:** What If Scenarios + Cross-Pollination for maximum idea generation
- **Phase 2 - Pattern Recognition:** Morphological Analysis for organizing insights
- **Phase 3 - Development:** SCAMPER Method for refining concepts
- **Phase 4 - Action Planning:** Decision Tree Mapping + Resource Constraints for implementation planning

**Journey Rationale:** This progression maximizes hackathon ideation by first blowing open the design space with radical "what if" questions and cross-domain inspiration, then systematically mapping parameter intersections, refining top concepts through structured lenses, and finally locking in a buildable plan under real constraints.

## Phase 1 Results: Expansive Exploration

**Technique:** What If Scenarios + Cross-Pollination
**Ideas Generated:** 38 concepts across DeFi, identity, commerce, gaming, social impact, education, supply chain, sports, governance, data markets, payments, and cross-chain domains.

**Selected Concept: InstantPayroll (#38) — Real-Time Verified Work-and-Pay Streaming**

Money flows per-second while you work, verified in real-time by Flare's FDC querying Web2 APIs. Combines all 4 Flare enshrined protocols (FTSO, FDC, Secure Random, FAssets + Smart Accounts) with Plasma stablecoin payments and privacy. Targets both Flare ($10K) and Plasma ($5K) bounties.

**Why InstantPayroll Won:**
- Every protocol is structurally necessary — remove any one and the product breaks
- Real-world problem: timesheet fraud ($11B/yr), slow freelancer payments, no continuous verification
- Demo is mesmerizing: start working → watch money flow → stop working → money stops
- Novel capability that doesn't exist without blockchain: continuous FDC-verified streaming payments

## Phase 2 Results: Morphological Analysis

**Parameter mapping across 5 axes:**

- **Work Verification:** GitHub commits API via FDC Web2Json (universally understood by dev judges)
- **Payment Model:** Epoch-drip with configurable interval (30s for demo, aligned with Flare timing)
- **Employer Funding:** FLR direct deposit, USD-denominated rates, FTSO conversion with 10% buffer
- **Secure Random:** Bonus lottery embedded in claim() — 1-in-10 chance of 2x payout
- **Settlement:** Plasma as stretch goal; core demo runs entirely on Flare/Coston2

## Phase 3 Results: SCAMPER Refinement

**Key refinements applied:**

- **Substitute:** Configurable claim interval (not locked to FTSO epochs) for better demo pacing
- **Substitute:** USD-denominated streams with FTSO buffer — real product design
- **Combine:** Claim + bonus in one transaction — single button, maximum drama
- **Combine:** Relayer script bridges Flare → Plasma invisibly (stretch goal)
- **Adapt:** "InstantPayroll Wrapped" summary on stream end (stretch goal)
- **Modify/Magnify:** Live dashboard is the demo killer — earnings counter, GitHub feed, FDC status, bonus animation
- **Modify/Magnify:** "Money stops when work stops" is THE demo moment
- **Eliminate:** Complex stream math, worker registry, multi-token, auto-polling, pause logic — saves ~13h
- **Put to other uses:** Platform positioning — GitHub today, any Web2 API tomorrow (Toggl, Stripe, Zendesk)
- **Reverse:** Employer → Worker framing chosen (clearer for judges vs community-funded alternative)

## Phase 4 Results: Build Plan (Solo, 15 Hours)

### Final Concept

**InstantPayroll** — Employer creates a payment stream on Flare. Worker earns per-epoch, verified by real GitHub activity via FDC. FTSO converts FLR to USD-equivalent payments. Secure Random adds bonus lottery. No timesheets, no trust, no fraud.

### Protocol Usage

| Protocol | Role |
|---|---|
| FDC (Web2Json) | Verify GitHub commits API — proves worker is active |
| FTSO | FLR/USD price conversion on every claim |
| Secure Random | 1-in-10 bonus lottery on each claim |
| Escrow (FLR) | Employer locks funds, released per verified epoch |

### Contract Architecture

```
InstantPayroll.sol (Coston2)
├── createStream(worker, usdRate, interval) payable
│   → FTSO: get FLR/USD → calculate escrow
│   → Store stream, lock FLR
├── claim(streamId, Web2JsonProof)
│   → FDC: verify proof (GitHub commits > 0)
│   → FTSO: get current FLR/USD
│   → Random: bonus check (1-in-10 → 2x)
│   → Transfer FLR to worker
│   → Emit PaymentClaimed(...)
└── endStream(streamId)
    → Return remaining FLR to employer
```

### 15-Hour Build Timeline

| Block | Hours | Deliverable |
|---|---|---|
| Setup + Contract | 3h | Clone starter kit, write InstantPayroll.sol, compile |
| FDC Integration | 4h | Adapt Web2Json for GitHub API, attestation script, test on Coston2 |
| Deploy + Test | 2h | Deploy, verify, test full flow on Coston2 |
| Frontend | 4h | React + ethers.js — employer create, worker claim, earnings display |
| Demo + README | 2h | 3-min video, README with Flare build experience |

### Risk Mitigation

- **FDC slow finalization:** Pre-generate proofs before demo. Contract accepts real proofs, demo replays them.
- **Fallback:** demoMode flag bypasses FDC if integration stalls. Show real FDC code in repo.
- **GitHub rate limits:** Use authenticated requests + controlled test repo.

### Demo Script (2 min)

1. Employer creates stream, deposits FLR (FTSO rate shown)
2. Worker pushes GitHub commit
3. Worker claims → FDC verifies → payment released
4. Another claim → Secure Random bonus triggers → 2x payout
5. Worker stops committing → claim fails → "No verified activity"
6. "All 4 Flare protocols in one transaction. $11B/yr in timesheet fraud, solved."
