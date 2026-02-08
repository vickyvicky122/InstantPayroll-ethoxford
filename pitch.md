# InstantPayroll — 4-Minute Pitch + Demo Script

## Setup Before Pitch

- Browser open to **http://localhost:5176/** (homepage)
- Two MetaMask accounts ready:
  - **Account A** (Employer) — has testnet FLR on Coston2
  - **Account B** (Worker) — has testnet FLR for gas
- Both accounts have Coston2 network added
- GitHub repo `vickyvicky122/InstantPayroll-ethoxford` has recent commits
- Pre-create one active stream from Account A to Account B (so the worker demo is instant)
- Relayer running (`npx ts-node scripts/relayer.ts`) to bridge receipts to Plasma

---

## Pitch Script (~4 minutes)

### 1. THE HOOK (0:00 — 0:30)

> "How many of you have freelanced or hired a remote contractor?"
>
> "Here's the problem: you agree on $50/hour. The contractor says they worked 8 hours. You have no way to verify that. You pay them $400 on faith. Maybe they worked 3 hours. Maybe they worked 12. You'll never know."
>
> "We built InstantPayroll — a payroll system where money only moves when work is cryptographically proven."

---

### 2. THE PROBLEM (0:30 — 1:15)

> "Global remote work is a $1.5 trillion market, and it runs on trust and spreadsheets."
>
> **Four pain points** (gesture to the homepage — scroll to the "Why" section):
>
> 1. **Overpaying** — Employers pay for hours claimed, not hours worked. No verification.
> 2. **Delayed pay** — Workers wait 30-60 days for invoices to clear. Cash flow kills freelancers.
> 3. **No accountability** — There's no audit trail linking payments to actual output.
> 4. **Fees** — Cross-border payments eat 3-8% in bank fees, FX markups, and platform cuts.
>
> "What if payments were continuous, verified, and instant?"

---

### 3. THE SOLUTION (1:15 — 1:50)

> "InstantPayroll streams payments to workers — but only when they prove they did the work."
>
> "We use **Flare's enshrined protocols** — not oracles you have to trust, but protocols built into the chain itself:"
>
> - **FDC (Flare Data Connector)** — verifies GitHub commits or Google Docs edits as cryptographic proof of work
> - **FTSO v2** — live FLR/USD price feed for accurate USD-denominated pay
> - **Secure Random** — a bonus lottery on each claim (1-in-10 chance of 2x payout)
>
> "And every payment receipt is bridged to **Plasma** — a zero-fee chain — for free permanent storage. Workers get an audit-ready payment history at zero cost."
>
> "Money moves as fast as work does."

---

### 4. LIVE DEMO (1:50 — 3:20)

#### Demo Part A: Employer Creates a Stream (30s)

1. Click **"Log In"** from homepage
2. Select **"I am an Employer"** → enter name → **"Connect Wallet & Continue"** (Account A)
3. You're on the **Employer Dashboard**
4. Show the **FLR/USD price ticker** (live FTSO feed)
5. **Create a stream**:
   - Worker address: paste Account B's address
   - USD per interval: `0.50`
   - Claim interval: `60` seconds
   - Deposit: `10 FLR`
   - Click **"Create Stream"**
6. Stream appears in the list — show the progress bar, rate, worker address

> "That's it. 10 FLR locked in escrow. The worker can now claim $0.50 every minute — but only if they prove they did the work."

#### Demo Part B: Worker Claims with Verified Commits (50s)

1. Click **"Log Out"** in the header
2. Select **"I am a Worker"** → enter name → switch to Account B in MetaMask → **"Connect Wallet & Continue"**
3. Show the **pre-created stream** (set up before the pitch)
4. GitHub repo is entered: `vickyvicky122/InstantPayroll-ethoxford`
5. Click **"Claim with GitHub Proof"**

> "Watch what happens. The FDC is now calling the GitHub API, counting our commits, and creating a cryptographic proof that we actually shipped code."

6. Show the **step-by-step progress**:
   - "Verifying all commits..."
   - "Submitting attestation..."
   - "Waiting for finalization (~90s)..."

> *(While waiting, explain):*
> "This is real. The Flare network is independently verifying our GitHub activity right now. No one can fake this — the proof goes through consensus. When it confirms, the contract will check the commit count, convert USD to FLR using FTSO live pricing, and maybe hit the bonus lottery."

7. **If time is tight**, use **Quick Claim** instead:
   - Click **"Quick Claim (Demo)"** — instant, uses FTSO + Secure Random but skips FDC wait
   - Show the FLR payout and bonus status

> "Quick Claim uses the same FTSO pricing and bonus lottery — it just skips the 90-second FDC wait for demo purposes."

#### Demo Part C: History + Export (10s)

1. Scroll to **Flare Claims** history — show claim events with bonus status
2. Switch to **Plasma Receipts** tab — show the relayed receipts with USD totals
3. Click **"Export CSV"**

> "Every payment is on-chain. Flare has the execution details, Plasma stores the receipts for free. Fully auditable. Exportable for accounting."

---

### 5. TECH & ARCHITECTURE (3:20 — 3:45)

> "Quick recap of the stack:"
>
> - **Flare Coston2** — smart contracts using three enshrined protocols: FTSO, FDC, and Secure Random
> - **Plasma Testnet** — zero-fee receipt storage via a cross-chain relayer
> - **One-way bridge**: Flare verifies and pays → relayer writes receipts to Plasma for free
> - **React + ethers.js** frontend, MetaMask wallet integration
>
> "Two chains, each playing to its strength. Flare verifies the work and moves the money. Plasma stores the receipts."

---

### 6. CLOSE (3:45 — 4:00)

> "InstantPayroll turns payroll from a trust problem into a math problem."
>
> "Employers only pay for verified work. Workers get paid the moment their commits land. No invoices. No disputes. No fees."
>
> "Money should move as fast as work does. Thank you."

---

## Backup Plans

### If FDC finalization takes too long during demo:
- Use the Quick Claim button instead — it still uses FTSO pricing and Secure Random lottery
- Say: "The FDC verification takes about 90 seconds for consensus — that's real decentralized verification. Let me show you the Quick Claim mode which uses the same oracle pricing and bonus lottery."

### If MetaMask is slow or errors:
- Have a second browser window pre-loaded on the Worker dashboard as a fallback
- Show the existing streams and claim history

### If asked "Why not just use Sablier/Superfluid?":
> "Those are great for time-based streaming. We add **proof of work** — your payment is gated on verifiable output, not just time passing. You can't claim if you didn't commit code."

### If asked "What about gaming the system?":
> "The FDC proof is verified by Flare's full validator set through consensus. You can't fake a GitHub commit count — the attestation providers independently query the API and must agree. And the employer sets the repo upfront."

### If asked "Why Plasma for receipts?":
> "Storing every payment receipt on Flare costs gas. On Plasma, it's free. A relayer watches Flare events and writes them to Plasma at zero cost. Workers get a complete, queryable payment history — perfect for accounting, taxes, and audits."

### If asked "What's next?":
> "More proof sources — Jira tickets, Linear issues, Figma edits. Any API with verifiable output can become a proof of work. We're also looking at Flare mainnet once FDC is fully live."

---

## Key Numbers to Mention

- Global freelance market: **$1.5 trillion**
- Average payment delay for freelancers: **30-60 days**
- Cross-border payment fees: **3-8%**
- Plasma receipt storage fees: **zero**
- FDC verification time: **~90 seconds**
- Bonus lottery odds: **1-in-10 for 2x payout**

---

## Demo Timing Checklist

| Time | Action |
|------|--------|
| -10 min | Create a Flare stream from Account A to Account B, start relayer |
| -5 min | Verify both accounts have FLR for gas, streams are visible |
| -2 min | Open browser to homepage, MetaMask unlocked on Account A |
| 0:00 | Start pitch |
| 1:50 | Begin live demo |
| 3:20 | Wrap demo, talk tech |
| 4:00 | Done |
