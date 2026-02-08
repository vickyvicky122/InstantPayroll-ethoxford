import { useState } from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

type Section = "problem" | "overview" | "flare" | "fdc" | "plasma" | "bridge" | "flow" | "stack";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "problem", label: "Why" },
  { id: "overview", label: "Overview" },
  { id: "flare", label: "Why Flare" },
  { id: "fdc", label: "FDC Deep Dive" },
  { id: "plasma", label: "Why Plasma" },
  { id: "bridge", label: "Cross-Chain" },
  { id: "flow", label: "How It Works" },
  { id: "stack", label: "Tech Stack" },
];

export function AboutPage() {
  const [active, setActive] = useState<Section>("problem");

  return (
    <div className="about">
      <div className="about-hero">
        <h1 className="about-title">InstantPayroll</h1>
        <p className="about-slogan" style={{ fontSize: "1.4rem", fontWeight: 600, opacity: 0.85, marginBottom: 8 }}>
          Money should move as fast as work does.
        </p>
        <p className="about-subtitle">
          Verified payroll on Flare &mdash; free permanent receipts on Plasma &mdash; exportable payment records
        </p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 24, fontSize: "1.1rem", padding: "12px 32px" }}>
          Get Started
        </Link>
      </div>

      <nav className="about-nav">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`about-nav-btn ${active === s.id ? "about-nav-active" : ""}`}
            onClick={() => setActive(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="about-content">
        {/* ============ THE PROBLEM ============ */}
        {active === "problem" && (
          <div className="about-section">
            <div className="about-card about-card-highlight">
              <h2>Remote Work Is Broken Without Proof of Work</h2>
              <p>
                The freelance economy is worth over <strong>$1.5 trillion</strong> globally, and remote teams are now the
                norm. But the payment infrastructure hasn't kept up. Employers pay monthly or biweekly &mdash; long after
                work is done &mdash; and have no reliable way to verify what was actually delivered. Freelancers wait weeks
                for invoices to clear, deal with payment disputes, and lose income to intermediary fees and currency conversion.
              </p>
              <p style={{ marginTop: 12 }}>
                This isn't just inconvenient. It's a structural problem that costs both sides money and trust.
              </p>
            </div>

            <div className="about-features">
              <div className="about-feature">
                <div className="about-feature-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>!</div>
                <h3>Employers Overpay for Unverified Work</h3>
                <p>Without proof of output, businesses pay based on hours reported, not work delivered. Remote managers have no on-chain evidence that a contractor actually committed code, edited documents, or completed tasks before payment flows.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>!</div>
                <h3>Freelancers Wait Weeks to Get Paid</h3>
                <p>Monthly pay cycles mean freelancers finance their own work for 30+ days. Cross-border transfers add more delays. When disputes arise, payments freeze entirely. Continuous streaming eliminates the wait &mdash; earnings accrue in real time.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>!</div>
                <h3>No Accountability for Remote Teams</h3>
                <p>Managing distributed contractors across time zones is hard. Traditional tools show presence, not productivity. Employers need verifiable proof that work happened &mdash; tied directly to the payment flow &mdash; not another dashboard to check.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>!</div>
                <h3>Fees Eat Into Micro-Payments</h3>
                <p>Paying a contractor $5 for a quick task costs $3+ in wire fees, FX conversion, and platform cuts. Traditional rails make frequent small payments irrational. On-chain streaming with oracle pricing changes the economics entirely.</p>
              </div>
            </div>

            <div className="about-card">
              <h2>How InstantPayroll Fixes This</h2>
              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>1</div>
                  <div>
                    <strong>Pay Continuously, Not Monthly</strong>
                    <p>
                      Streaming payments mean workers earn every minute, not every month. Employers deposit funds into
                      an escrow stream, and workers claim accumulated earnings at any interval they choose. No invoicing,
                      no payment runs, no 30-day waits. Cash flow becomes real-time for both sides.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>2</div>
                  <div>
                    <strong>Require Proof Before Payment</strong>
                    <p>
                      On Flare, every claim requires cryptographic proof of work &mdash; verified GitHub commits or Google Docs
                      revisions attested by the Flare validator set via FDC. The smart contract won't release funds unless the
                      proof checks out. Employers stop paying for unverified hours; workers get paid the moment they can prove delivery.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>3</div>
                  <div>
                    <strong>Accurate Pay, Zero Overspend</strong>
                    <p>
                      USD-denominated rates with live oracle pricing mean workers receive exactly the right value regardless of
                      crypto volatility. Employers set budgets in dollars and know precisely what they're spending. Streams can be
                      ended at any time to recover unused funds &mdash; no more paying out a full month when a contract ends on day 12.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>4</div>
                  <div>
                    <strong>Audit-Ready Records From Day One</strong>
                    <p>
                      Every payment is recorded on-chain with full context: amount, timestamp, work proof, exchange rate, and
                      bonus status. Workers export CSV for tax filing. Employers get a verifiable ledger that no one can
                      retroactively edit. Accountants and auditors query the blockchain directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Who This Is For</h2>
              <div className="about-duo">
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>B</div>
                  <div>
                    <strong>Businesses with Remote Teams</strong>
                    <p>Startups, DAOs, and distributed companies that hire globally and need to verify output, control spend, and pay accurately across borders without intermediaries or banking delays.</p>
                  </div>
                </div>
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>F</div>
                  <div>
                    <strong>Freelancers &amp; Contractors</strong>
                    <p>Independent workers who want to get paid the moment they deliver, in stable currency, with a provable payment history they own &mdash; not locked inside a platform they don't control.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ OVERVIEW ============ */}
        {active === "overview" && (
          <div className="about-section">
            <div className="about-card about-card-highlight">
              <h2>Two Chains, Each Playing to Its Strength</h2>
              <p>
                InstantPayroll splits its workload across <strong>Flare</strong> and <strong>Plasma</strong> because
                each chain does something the other cannot. Flare provides enshrined data protocols &mdash; FTSO price
                feeds, FDC Web2 attestation, Secure Random &mdash; that no other EVM chain offers natively. Plasma
                provides zero-fee transactions, making it viable to store every micro-payment receipt on-chain
                without cost accumulating.
              </p>
              <div className="about-duo">
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>F</div>
                  <div>
                    <strong>Flare &mdash; Computation & Verification</strong>
                    <p>FLR payroll with oracle-priced USD rates. Work verified on-chain via FDC (GitHub commits, Google Docs revisions). Bonus lottery via Secure Random. Every claim uses three enshrined protocols in a single transaction.</p>
                  </div>
                </div>
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>P</div>
                  <div>
                    <strong>Plasma &mdash; Free Permanent Receipt Storage</strong>
                    <p>Zero-fee receipt storage for every Flare claim via a relayer bridge. Complete, queryable payment history at zero cost &mdash; workers, accountants, and auditors can access records on-chain.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-features">
              <div className="about-feature">
                <div className="about-feature-num">01</div>
                <h3>Streaming Payments</h3>
                <p>Employers deposit funds into streams. Workers claim earnings at regular intervals &mdash; no waiting for payday.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num">02</div>
                <h3>On-Chain Work Verification</h3>
                <p>Flare claims require FDC attestation proof &mdash; GitHub commits or Google Docs revisions verified by the validator set itself.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num">03</div>
                <h3>Cross-Chain Bridge</h3>
                <p>A relayer watches Flare events and writes permanent receipts to Plasma at zero cost. Two views of the same truth.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num">04</div>
                <h3>Audit-Ready Records</h3>
                <p>Every Flare claim is mirrored to Plasma as a free permanent receipt. Workers export CSV for taxes, employers get a verifiable ledger.</p>
              </div>
            </div>
          </div>
        )}

        {/* ============ WHY FLARE ============ */}
        {active === "flare" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Why Only Flare Can Do This</h2>
              <p>
                Flare's value is its <strong>enshrined protocols</strong> &mdash; data services baked into the network
                at the validator level, not bolted on through third-party oracles. InstantPayroll uses three of them
                in a single <code>claim()</code> transaction:
              </p>

              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge">FDC</div>
                  <div>
                    <strong>Work Verification via Flare Data Connector</strong>
                    <p>
                      The FDC's Web2Json attestation lets a smart contract verify data from any public Web2 API.
                      Workers submit an attestation request for the GitHub commits API; FDC attestation providers
                      fetch the URL, apply a JQ filter, and reach consensus. The resulting proof is verified on-chain
                      by calling <code>FdcVerification.verifyWeb2Json(proof)</code>. Google Docs revisions work the same way.
                      This is structurally impossible on other EVM chains without trusting a centralized oracle.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">FTSO</div>
                  <div>
                    <strong>Price Conversion via FTSO V2</strong>
                    <p>
                      Streams are denominated in USD but paid in FLR. On every claim, the contract
                      calls <code>FtsoV2.getFeedById(FLR_USD_FEED_ID)</code> for the live exchange rate.
                      Because FTSO is enshrined, this price feed has the same security as Flare itself &mdash;
                      no external oracle risk, no additional trust assumption.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">RNG</div>
                  <div>
                    <strong>Bonus Lottery via Secure Random V2</strong>
                    <p>
                      Each claim checks <code>randomV2.getRandomNumber()</code> &mdash; a threshold-signature
                      random number. If <code>isSecure</code> and <code>randomNumber % 10 == 0</code>, the
                      payout doubles. No miner or validator can influence the outcome.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">DEMO</div>
                  <div>
                    <strong>Quick Claim Mode</strong>
                    <p>A demo path bypasses FDC for fast testing while still using FTSO pricing and the bonus lottery.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Why Not Another Chain?</h2>
              <p>
                Chainlink VRF + Chainlink Functions + Chainlink Price Feeds could approximate this on Ethereum,
                but as three separate external services with three separate trust models and three separate fee structures.
                On Flare, it's <strong>one trust model</strong> (the validator set), <strong>one fee</strong> (gas),
                and <strong>one transaction</strong>.
              </p>
              <p style={{ marginTop: 12 }}>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "0.9rem" }}
                  onClick={() => setActive("fdc")}
                >
                  See the FDC Deep Dive for the full protocol breakdown &rarr;
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ============ FDC DEEP DIVE ============ */}
        {active === "fdc" && (
          <div className="about-section">
            <div className="about-card">
              <h2>How FDC Verification Works</h2>
              <p>
                The Flare Data Connector uses the <strong>CCCR protocol</strong> &mdash; four phases that turn a Web2 API
                response into a consensus-verified Merkle root stored on-chain.
              </p>

              <div className="about-steps" style={{ marginTop: 16 }}>
                <div className="about-step">
                  <div className="about-step-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>C</div>
                  <div>
                    <strong>Collect</strong>
                    <p>Attestation providers receive the request (URL, HTTP method, JQ filter, ABI signature) and independently query the Web2 API.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>C</div>
                  <div>
                    <strong>Choose</strong>
                    <p>Each provider applies the JQ post-processing filter to the raw response, producing a deterministic result. Providers build a Merkle tree of all verified responses in the round.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>C</div>
                  <div>
                    <strong>Commit</strong>
                    <p>Providers submit a hash commitment of their Merkle root, preventing them from changing their answer after seeing others' responses.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>R</div>
                  <div>
                    <strong>Reveal</strong>
                    <p>Providers reveal their Merkle roots. If 50%+ of signature weight agrees on the same root, it's accepted and stored in the Relay contract.</p>
                  </div>
                </div>
              </div>

              <div className="about-tech-list" style={{ marginTop: 16 }}>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(230,32,88,0.12)", color: "#e62058", borderColor: "rgba(230,32,88,0.25)" }}>90s</div>
                  <div>
                    <strong>Voting Round Duration</strong>
                    <p>Each voting round takes ~90 seconds. ~100 independent attestation providers participate, and 50%+ signature weight is required for the Merkle root to be finalized.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>What Happens in a Single Claim</h2>
              <p>
                When a worker clicks "Claim with GitHub Proof", seven things happen in sequence &mdash; from the browser to the Flare validator set and back:
              </p>

              <div className="about-steps" style={{ marginTop: 16 }}>
                <div className="about-step">
                  <div className="about-step-num">1</div>
                  <div>
                    <strong>Prepare</strong>
                    <p>
                      The frontend sends <code>{"{url, httpMethod, postProcessJq, abiSignature}"}</code> to the FDC verifier
                      API. The verifier returns an <code>abiEncodedRequest</code> containing a computed Message Integrity Code (MIC)
                      that binds the request parameters together.
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Submit On-Chain</strong>
                    <p>
                      The frontend calls <code>FdcHub.requestAttestation{"{value: fee}"}(abiEncodedRequest)</code> &mdash;
                      paying the attestation fee and emitting an <code>AttestationRequest</code> event that providers watch for.
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Consensus (CCCR)</strong>
                    <p>
                      Attestation providers independently fetch the GitHub/Google API, apply the JQ filter,
                      and vote on the result through the CCCR protocol (Collect &rarr; Choose &rarr; Commit &rarr; Reveal).
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">4</div>
                  <div>
                    <strong>Finalize</strong>
                    <p>
                      Once 50%+ signature weight agrees, the Merkle root is stored in the Relay contract.
                      The frontend polls <code>Relay.isFinalized(protocolId=200, roundId)</code> until it returns true.
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">5</div>
                  <div>
                    <strong>Retrieve Proof</strong>
                    <p>
                      The frontend fetches the Merkle proof from the DA layer
                      via <code>POST /api/v1/fdc/proof-by-request-round-raw</code>, receiving the proof array and the ABI-encoded response.
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">6</div>
                  <div>
                    <strong>Verify On-Chain</strong>
                    <p>
                      <code>FdcVerification.verifyWeb2Json(proof)</code> reconstructs the Merkle leaf from the response,
                      walks the proof path to the root, and compares it against the consensus root stored in the Relay contract.
                    </p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">7</div>
                  <div>
                    <strong>Pay</strong>
                    <p>
                      The contract decodes the verified commit count from the proof, queries FTSO for the live FLR/USD price,
                      checks Secure Random for the bonus lottery, and transfers FLR to the worker.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Why This Can't Be Faked</h2>
              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>1</div>
                  <div>
                    <strong>Full Validator Consensus</strong>
                    <p>
                      The attestation goes through the full Flare validator set &mdash; not a single oracle.
                      ~100 independent providers must reach 50%+ agreement. No single party can forge a result.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>2</div>
                  <div>
                    <strong>Merkle Proof Binding</strong>
                    <p>
                      The Merkle proof ties the specific API response to the consensus root stored on-chain.
                      Altering any byte of the response invalidates the proof path.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>3</div>
                  <div>
                    <strong>Request Integrity</strong>
                    <p>
                      The JQ filter and ABI signature are part of the attestation request itself. Providers can't
                      alter the interpretation of the API response &mdash; the processing logic is fixed at submission time
                      via the Message Integrity Code.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(39,174,96,0.12)", color: "#27ae60", borderColor: "rgba(39,174,96,0.25)" }}>4</div>
                  <div>
                    <strong>Runtime Contract Discovery</strong>
                    <p>
                      All contract addresses are discovered at runtime via <code>ContractRegistry</code> (<code>0xaD67...0019</code>) &mdash;
                      the same address on every Flare network. No hardcoded addresses that could be spoofed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ WHY PLASMA ============ */}
        {active === "plasma" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Why Plasma</h2>
              <p>
                Plasma is a zero-fee EVM chain. Transactions cost nothing. This changes what's economically
                rational to store on-chain.
              </p>

              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>$0</div>
                  <div>
                    <strong>Free Permanent Receipts</strong>
                    <p>
                      If a worker claims 50 times per day, storing each receipt on Flare means 50 on-chain writes
                      with gas fees. On Plasma, those same 50 writes cost zero. Every Flare claim is mirrored
                      to Plasma via a relayer, giving workers a complete, queryable payment history at no cost.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>API</div>
                  <div>
                    <strong>Queryable On-Chain Accounting</strong>
                    <p>
                      Workers, accountants, tax tools, or auditors can call <code>getAllPayouts(worker)</code> to
                      get a complete payment history without parsing event logs or relying on an indexer.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>CSV</div>
                  <div>
                    <strong>Exportable Records</strong>
                    <p>
                      Every receipt includes amount (FLR and USD), timestamp, bonus status, and verified commit
                      count. Workers export CSV directly from the dashboard for tax filing, invoicing, or audit.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>USD</div>
                  <div>
                    <strong>Lifetime Earnings Tracker</strong>
                    <p>
                      The Plasma contract maintains a per-worker <code>totalEarnedUSD</code> counter, updated
                      with every relayed receipt. One call to see total career earnings across all streams.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ CROSS-CHAIN BRIDGE ============ */}
        {active === "bridge" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Cross-Chain Architecture</h2>
              <p>
                Data flows in one direction: <strong>Flare &rarr; Plasma</strong>. There's no complex bidirectional
                message passing, no lock-and-mint, no liquidity pools. Events on Flare are facts; Plasma records them.
              </p>

              <div className="about-arch">
                <div className="about-arch-chain">
                  <div className="about-arch-label" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>FLARE</div>
                  <div className="about-arch-box">
                    <strong>InstantPayroll.sol</strong>
                    <div className="about-arch-items">
                      <span>createStream() &larr; Employer deposits FLR</span>
                      <span>claim() &larr; FDC + FTSO + RNG in one tx</span>
                      <span>claimDemo() &larr; Demo mode (FTSO + RNG)</span>
                      <span>endStream() &larr; Recover unused escrow</span>
                    </div>
                    <div className="about-arch-event">emits PaymentClaimed event</div>
                  </div>
                </div>

                <div className="about-arch-arrow">
                  <div className="about-arch-arrow-line" />
                  <div className="about-arch-arrow-label">Relayer watches events</div>
                  <div className="about-arch-arrow-line" />
                </div>

                <div className="about-arch-chain">
                  <div className="about-arch-label" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>PLASMA</div>
                  <div className="about-arch-box">
                    <strong>InstantPayrollPayout.sol</strong>
                    <div className="about-arch-items">
                      <span>recordPayout() &larr; Relayer writes receipt</span>
                      <span>getAllPayouts() &larr; Full payment history</span>
                      <span>totalEarnedUSD() &larr; Lifetime earnings</span>
                    </div>
                    <div className="about-arch-event">Zero-fee permanent storage</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Why This Design Is Unique</h2>
              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge">1</div>
                  <div>
                    <strong>Each Chain Plays to Its Strength</strong>
                    <p>
                      Most multi-chain apps deploy the same logic on multiple chains for liquidity.
                      InstantPayroll does the opposite &mdash; Flare for computation that requires enshrined
                      data, Plasma for storage that requires zero marginal cost.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">2</div>
                  <div>
                    <strong>Unidirectional Data Flow</strong>
                    <p>
                      The bridge is one-way: Flare &rarr; Plasma. Events on Flare are facts; Plasma records them.
                      Simple to reason about, hard to break.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">3</div>
                  <div>
                    <strong>Two Views of the Same Truth</strong>
                    <p>
                      The frontend reads from both chains simultaneously. Flare gives execution details
                      (FLR amounts, FTSO prices, bonus status). Plasma gives accounting
                      (lifetime USD totals, structured history). Same payments, complementary perspectives.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">4</div>
                  <div>
                    <strong>Stateless Relayer</strong>
                    <p>
                      The relayer is a simple process that listens for Flare events and writes to Plasma.
                      If it misses an event, it can be replayed from Flare event history.
                      The Plasma contract's <code>onlyRelayer</code> modifier ensures only the authorized relayer can write.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ HOW IT WORKS ============ */}
        {active === "flow" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Employer Flow</h2>
              <div className="about-steps">
                <div className="about-step">
                  <div className="about-step-num">1</div>
                  <div>
                    <strong>Connect Wallet</strong>
                    <p>Connect MetaMask on Flare (Coston2 testnet). Get test FLR from the faucet.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Fund & Create Stream</strong>
                    <p>Deposit FLR as escrow, set a USD rate per interval, and assign a worker address.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Monitor & Manage</strong>
                    <p>Watch claim progress with live progress bars. End streams early to recover unused funds.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Worker Flow</h2>
              <div className="about-steps">
                <div className="about-step">
                  <div className="about-step-num">1</div>
                  <div>
                    <strong>View Streams</strong>
                    <p>See all streams assigned to your address with live countdowns to next claim</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Claim Earnings</strong>
                    <p>Verify work via FDC (5-step GitHub/Google Docs attestation flow) or use Quick Claim for demos. Get paid in FLR at live oracle rates.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Track History</strong>
                    <p>Flare claims tab shows events with bonus status. Plasma receipts tab shows structured records with lifetime USD totals. Export CSV for accounting.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>FDC Claim Flow (5 Steps)</h2>
              <div className="about-steps">
                <div className="about-step">
                  <div className="about-step-num">1</div>
                  <div>
                    <strong>Prepare</strong>
                    <p>Build attestation request for GitHub commits API (or Google Docs revisions) via FDC verifier</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Submit</strong>
                    <p>Submit the attestation request on-chain to the FDC hub contract</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Finalize</strong>
                    <p>Wait ~90 seconds for the attestation round to finalize across the validator set</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">4</div>
                  <div>
                    <strong>Retrieve</strong>
                    <p>Fetch the Merkle proof from the Flare Data Availability layer</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">5</div>
                  <div>
                    <strong>Claim</strong>
                    <p>Submit proof to <code>claim()</code> which verifies it on-chain, checks FTSO price, rolls bonus, and pays out</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ TECH STACK ============ */}
        {active === "stack" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Technology Stack</h2>

              <div className="about-stack-grid">
                <div className="about-stack-category">
                  <h3>Smart Contracts</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">Solidity 0.8.25</span>
                    <span className="about-stack-chip">Hardhat</span>
                    <span className="about-stack-chip">OpenZeppelin v5</span>
                    <span className="about-stack-chip">SafeERC20</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Flare Enshrined Protocols</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip about-stack-chip-accent">FTSO V2 (Price Oracle)</span>
                    <span className="about-stack-chip about-stack-chip-accent">FDC Web2Json (Data Connector)</span>
                    <span className="about-stack-chip about-stack-chip-accent">Secure Random V2</span>
                    <span className="about-stack-chip about-stack-chip-accent">ContractRegistry</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Networks</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">Flare / Coston2 (chain 114)</span>
                    <span className="about-stack-chip">Plasma Testnet (chain 9746)</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Frontend</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">React 18 + TypeScript</span>
                    <span className="about-stack-chip">Ethers.js v6</span>
                    <span className="about-stack-chip">Vite</span>
                    <span className="about-stack-chip">React Router</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Integrations</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">GitHub API (via FDC)</span>
                    <span className="about-stack-chip">Google Docs API (via FDC)</span>
                    <span className="about-stack-chip">Google OAuth 2.0</span>
                    <span className="about-stack-chip">MetaMask</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Infrastructure</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">Cross-chain Relayer (Node.js)</span>
                    <span className="about-stack-chip">Flare DA Layer</span>
                    <span className="about-stack-chip">FDC Verifier API</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Deployed Contracts</h2>
              <div className="about-contracts">
                <div className="about-contract-row">
                  <span className="about-contract-name">InstantPayroll</span>
                  <span className="about-contract-chain">Flare Coston2</span>
                  <span className="about-contract-desc">FLR streaming &mdash; FTSO + FDC + Secure Random</span>
                </div>
                <div className="about-contract-row">
                  <span className="about-contract-name">InstantPayrollPayout</span>
                  <span className="about-contract-chain">Plasma Testnet</span>
                  <span className="about-contract-desc">Zero-fee receipt storage via relayer bridge</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="about-cta">
        <Link to="/login" className="btn btn-primary">Get Started</Link>
      </div>
    </div>
  );
}
