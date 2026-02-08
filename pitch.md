# InstantPayroll — Pitch + Live Demo Walkthrough

## Setup Before Pitch

- Browser open to **http://localhost:5176/** (About page)
- Two MetaMask accounts ready:
  - **Account A** (Employer) — has testnet FLR on Coston2
  - **Account B** (Worker) — has testnet FLR for gas
- Both accounts have Coston2 network added
- GitHub repo `vickyvicky122/InstantPayroll-ethoxford` has recent commits
- Pre-create one active stream from Account A to Account B
- Relayer running (`npx ts-node scripts/relayer.ts`)

---

## Pitch Script (~4 minutes)

### 1. THE HOOK (0:00 — 0:20)

> "You hire a remote dev. They say they worked 40 hours. You pay $4,000. Did they actually work? You'll never know."
>
> "We fixed this. **InstantPayroll** — payments stream continuously, but money only moves when work is cryptographically proven on-chain."

---

### 2. WHY THIS MATTERS (0:20 — 0:50)

> "The freelance economy is **$1.5 trillion**. It runs on trust and invoices."

**Four problems** *(don't show UI yet — just speak)*:

> 1. **No verification** — employers pay for hours claimed, not work done
> 2. **30-60 day payment delays** — freelancers finance their own work for weeks
> 3. **No audit trail** — payments aren't linked to output
> 4. **3-8% fees** — bank wires and platform cuts eat micro-payments alive
>
> "What if every payment required proof, settled instantly, and cost nothing to record?"

---

### 3. THE STACK — TWO CHAINS, ONE SYSTEM (0:50 — 1:20)

> "We built this on **Flare** and **Plasma** because each does something the other can't."

| Chain | Role | Protocols Used |
|-------|------|----------------|
| **Flare** (Coston2) | Verify work, price payments, pay workers | **FDC** (Web2Json attestation), **FTSO v2** (FLR/USD oracle), **Secure Random v2** (bonus lottery) |
| **Plasma** (Testnet) | Store every receipt permanently, for free | Zero-fee chain — relayer bridges Flare events at $0 cost |

> "Three enshrined protocols in one `claim()` transaction. No third-party oracles, no extra trust assumptions, no separate fees. That's what makes Flare unique."

---

### 4. LIVE DEMO — SCREEN BY SCREEN (1:20 — 3:30)

#### Screen 1: About Page (10s)

*Already open at `/` — the About/landing page*

> "This is our product page. It explains the full architecture."

- Click through **"Why"** tab — show the four pain points
- Flash the **"Why Flare"** tab — point at the three protocol badges: **FDC**, **FTSO**, **RNG**
- Flash **"Why Plasma"** tab — point at **$0 Free Permanent Receipts**

> "Let me show you it working."

Click **"Get Started"**.

---

#### Screen 2: Login / Role Selection (10s)

*Now on `/login`*

> "Two roles: Employer or Worker. Pick one, connect MetaMask, done."

- Click **"I am an Employer"** → type name → **"Connect Wallet & Continue"** (Account A)

---

#### Screen 3: Employer Dashboard (40s)

*Now on `/employer`*

**What you see:**

| UI Element | Powered By |
|-----------|------------|
| **Welcome header** with wallet address, FLR balance | Flare Coston2 RPC |
| **FLR/USD price ticker** (e.g. "$0.01234") | **FTSO v2** — live feed from `FtsoV2.getFeedById()` |
| **Active Streams** count, Total Deposited, Remaining Escrow | On-chain stream state |

**Create a stream:**

1. Paste Account B's address as Worker
2. USD rate: `0.50` per interval
3. Interval: `60` seconds
4. Deposit: `10 FLR`
5. Click **"Create Stream"** → MetaMask confirms

> "10 FLR locked in escrow. The worker can now claim $0.50 every 60 seconds — but only if they prove they worked."

**Point out:**
- The new stream card with progress bar (deposited vs. claimed)
- The **"End Stream"** button — employer can recover unused funds anytime

> "The employer stays in control. End the stream, get your remaining FLR back. No more paying out a full month when someone quits on day three."

---

#### Screen 4: Worker Dashboard — Top Section (20s)

*Click **"Log Out"** → Select **"I am a Worker"** → switch MetaMask to Account B → Connect*

*Now on `/worker`*

**What you see:**

| UI Element | Powered By |
|-----------|------------|
| **Welcome header** with address, FLR balance | Flare Coston2 RPC |
| **Total Earned (FLR)** | On-chain stream `totalClaimed` |
| **FLR/USD Price** | **FTSO v2** — same live oracle |
| **Bonus Lottery** — "Normal" or "2x ACTIVE!" | **Secure Random v2** — `randomV2.getRandomNumber()` |
| **Lifetime (USD)** | **Plasma** — `totalEarnedUSD` from receipt contract |

> "Four stats. Three different Flare protocols powering them. Plus Plasma for the USD lifetime total."

---

#### Screen 5: Work Verification (15s)

*Scroll to **Work Verification** card*

**What you see:**
- Two tabs: **GitHub** | **Google Docs**
- GitHub selected — repo input with **"Confirm"** button
- Paste `https://github.com/vickyvicky122/InstantPayroll-ethoxford` → click **"Confirm"**
- Auto-parses the URL to `owner/repo`, shows green "Confirmed" badge with repo description, language, stars

| UI Element | Powered By |
|-----------|------------|
| **GitHub tab** — repo input + Confirm button | GitHub REST API (client-side) |
| **Google Docs tab** — Doc URL + Google OAuth sign-in | Google Drive API via OAuth 2.0 |
| **FDC attestation** (happens on claim) | **Flare FDC** — Web2Json attestation type |

> "The worker picks their proof source. GitHub commits or Google Docs revisions. The FDC will verify this through the full Flare validator set — ~100 independent attestation providers reaching consensus."

---

#### Screen 6: Claiming Payment (50s)

*Scroll to the pre-created stream → it shows "Claim ready"*

**Option A: Full FDC Claim** *(if time allows)*

Click **"Claim with GitHub Proof"**

> "Watch the five-step flow."

| Step | What Happens | Protocol |
|------|-------------|----------|
| 1. **Preparing** | Sends URL + JQ filter to FDC verifier API, gets `abiEncodedRequest` with MIC | **FDC** verifier |
| 2. **Submitting** | Calls `FdcHub.requestAttestation()` on-chain — pays fee, emits event | **FDC** hub contract |
| 3. **Finalizing** (~90s) | ~100 attestation providers fetch GitHub API, apply JQ filter, vote via CCCR protocol (Collect→Choose→Commit→Reveal). 50%+ signature weight → Merkle root stored in Relay contract | **FDC** consensus |
| 4. **Retrieving** | Fetches Merkle proof from Flare DA layer | **FDC** DA layer |
| 5. **Claiming** | `claim()` verifies proof on-chain via `FdcVerification.verifyWeb2Json()`, reads FTSO price, rolls Secure Random, transfers FLR | **FDC** + **FTSO** + **Secure Random** |

> *(While waiting for finalization):*
> "This is real. The Flare validator set is independently querying GitHub's API right now. No single node can fake the result — they need 50%+ consensus. When it confirms, the contract verifies the Merkle proof, checks the live FLR/USD price from FTSO, and rolls the bonus lottery from Secure Random. Three enshrined protocols, one transaction."

**Option B: Quick Claim** *(if time is tight)*

Click **"Quick Claim (skip FDC — demo only)"** — instant

> "Quick Claim still uses **FTSO** for pricing and **Secure Random** for the bonus — it just skips the 90-second FDC consensus for demo speed."

**After claim completes:**
- Success message: "Payment claimed! (X commits verified)"
- Shows: "Verified by Flare validator set via FDC round #N · Merkle proof depth: M"

---

#### Screen 7: Payment History (20s)

*Scroll to **Payment History** section*

**Flare Claims tab:**

| Column | Source |
|--------|--------|
| Amount (FLR) | `PaymentClaimed` event from Flare |
| FLR/USD price at time of claim | **FTSO v2** price stored in event |
| Bonus badge (2x BONUS) | **Secure Random v2** result |
| Commit count | **FDC** verified GitHub data |
| Timestamp | Flare block timestamp |

> "Every claim is an on-chain event with full context."

Click **"Export CSV"** → downloads `flare-payment-history.csv`

**Switch to Plasma Receipts tab:**

| Column | Source |
|--------|--------|
| Amount (FLR + USD) | Relayed from Flare `PaymentClaimed` event |
| Date | Timestamp from relayer write |
| Bonus, Commits | Mirrored from Flare |
| Lifetime earnings counter | **Plasma** contract `totalEarnedUSD` |

> "Every Flare claim is automatically bridged to Plasma by our relayer. Zero gas cost. Permanent. The worker gets a complete payment history they can export for taxes or audits — and it cost nothing to store."

Click **"Export CSV"** → downloads `plasma-receipts.csv`

---

#### Screen 8: About Page — Deep Dive (10s, optional)

*If judges want technical depth, navigate to `/` and click tabs:*

- **FDC Deep Dive** — shows the full CCCR protocol (Collect→Choose→Commit→Reveal) and the 7-step claim flow
- **Cross-Chain** — shows the architecture diagram: Flare (InstantPayroll.sol) → Relayer → Plasma (InstantPayrollPayout.sol)
- **Tech Stack** — Solidity, Hardhat, React, ethers.js, all four Flare enshrined protocols listed

---

### 5. CLOSE (3:30 — 4:00)

> "Let me recap what Flare does for us that no other chain can:"
>
> - **FDC** — verifies real-world work (GitHub commits, Google Docs edits) through validator consensus. No centralized oracle.
> - **FTSO v2** — live FLR/USD pricing so employers set budgets in dollars. No Chainlink dependency.
> - **Secure Random v2** — provably fair bonus lottery. No VRF subscription.
> - **All three in one transaction, one trust model, one gas fee.**
>
> "And Plasma gives us what Flare can't do cheaply — **free permanent receipt storage** for every single micro-payment."
>
> "InstantPayroll turns payroll from a trust problem into a math problem. Employers only pay for verified work. Workers get paid the second their commits land. No invoices. No disputes. No fees."
>
> "**Money should move as fast as work does.** Thank you."

---

## Feature → Technology Map (Quick Reference)

| Feature | Screen | Flare Protocol | Plasma |
|---------|--------|---------------|--------|
| Live FLR/USD price ticker | Employer + Worker dashboards | **FTSO v2** | — |
| USD-to-FLR conversion on claim | Worker claim flow | **FTSO v2** | — |
| GitHub commit verification | Worker claim (5-step FDC flow) | **FDC** Web2Json | — |
| Google Docs revision verification | Worker claim (5-step FDC flow) | **FDC** Web2Json | — |
| Bonus lottery (1-in-10 for 2x) | Worker claim | **Secure Random v2** | — |
| Contract address discovery | All contract calls | **ContractRegistry** | — |
| Stream creation + escrow | Employer dashboard | Flare smart contract | — |
| Stream management + end | Employer dashboard | Flare smart contract | — |
| Claim events with full context | Flare Claims tab | Event logs on Flare | — |
| Permanent payment receipts | Plasma Receipts tab | — | **Zero-fee storage** |
| Lifetime USD earnings | Worker stats | — | **Plasma contract** |
| CSV export (Flare) | Flare Claims tab | Flare event data | — |
| CSV export (Plasma) | Plasma Receipts tab | — | Plasma receipt data |
| Cross-chain bridging | Background process | Flare events (source) | Plasma writes (dest) |
| Repo confirmation | Work Verification card | — (GitHub API direct) | — |

---

## Backup Plans

### If FDC finalization takes too long:
Use Quick Claim — still uses FTSO + Secure Random. Say: "FDC consensus takes ~90 seconds — that's real decentralized verification. Quick Claim uses the same oracle pricing and bonus lottery."

### If MetaMask is slow:
Have a second browser pre-loaded on Worker dashboard as fallback.

### If asked "Why not Sablier/Superfluid?":
> "They stream based on time. We stream based on **verified output**. You can't claim if you didn't commit code."

### If asked "What about gaming it?":
> "The FDC proof goes through ~100 independent attestation providers reaching consensus. You can't fake a GitHub commit count — the validators independently query the API and must agree on the result."

### If asked "Why Plasma for receipts?":
> "Storing 50 receipts per day on Flare costs gas every time. On Plasma, it's free. Workers get a complete, queryable payment history at zero cost — perfect for taxes and audits."

### If asked "Why not just use Chainlink?":
> "Chainlink VRF + Functions + Price Feeds = three separate services, three trust models, three fee structures. On Flare, it's one validator set, one gas fee, one transaction."

### If asked "What's next?":
> "More proof sources — Jira, Linear, Figma. Any API with verifiable output becomes proof of work via FDC. And mainnet once FDC is fully live."

---

## Demo Timing Checklist

| Time | Action |
|------|--------|
| -10 min | Create stream from A→B, start relayer |
| -5 min | Verify both accounts have FLR, streams visible |
| -2 min | Browser on About page, MetaMask on Account A |
| 0:00 | Hook + Problem |
| 0:50 | Two-chain architecture |
| 1:20 | Begin live demo walkthrough |
| 3:30 | Close |
| 4:00 | Done |
