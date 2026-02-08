import { useState } from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

type Section = "overview" | "flare" | "plasma" | "bridge" | "flow" | "stack";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flare", label: "Why Flare" },
  { id: "plasma", label: "Why Plasma" },
  { id: "bridge", label: "Cross-Chain" },
  { id: "flow", label: "How It Works" },
  { id: "stack", label: "Tech Stack" },
];

export function AboutPage() {
  const [active, setActive] = useState<Section>("overview");

  return (
    <div className="about">
      <div className="about-hero">
        <h1 className="about-title">InstantPayroll</h1>
        <p className="about-subtitle">
          Zero-fee stablecoin settlement on Plasma &mdash; verified payroll on Flare &mdash; exportable payment records
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
        {/* ============ OVERVIEW ============ */}
        {active === "overview" && (
          <div className="about-section">
            <div className="about-card about-card-highlight">
              <h2>Two Chains, Each Playing to Its Strength</h2>
              <p>
                InstantPayroll splits its workload across <strong>Flare</strong> and <strong>Plasma</strong> because
                each chain does something the other cannot. Flare provides enshrined data protocols &mdash; FTSO price
                feeds, FDC Web2 attestation, Secure Random &mdash; that no other EVM chain offers natively. Plasma
                provides zero-fee transactions, making it viable to store every micro-payment receipt on-chain and run
                a full USDC stablecoin payroll without cost accumulating.
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
                    <strong>Plasma &mdash; Storage & Stablecoin Payments</strong>
                    <p>Zero-fee receipt storage for every Flare claim via a relayer bridge. Plus a standalone USDC streaming payroll &mdash; stable value, time-based claims, one click to collect.</p>
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
                <h3>Dual Payroll Models</h3>
                <p>Crypto payroll on Flare (FLR, oracle-priced, work-verified). Stablecoin payroll on Plasma (USDC, stable value, simple claims).</p>
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
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>USDC</div>
                  <div>
                    <strong>Stablecoin Payroll</strong>
                    <p>
                      A standalone USDC streaming payroll runs natively on Plasma. Pay and get paid in USDC
                      (6 decimals) with no price volatility. Zero-fee transactions mean the cost of
                      micro-payments doesn't eat into the payment itself.
                    </p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>TIME</div>
                  <div>
                    <strong>Time-Based Claims</strong>
                    <p>
                      Workers claim based on elapsed intervals. Multiple intervals accumulate and pay out
                      in a single transaction. No FDC proof needed &mdash; just click and collect.
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
                  <div className="about-arch-box" style={{ marginTop: 12 }}>
                    <strong>PlasmaPayroll.sol</strong>
                    <div className="about-arch-items">
                      <span>createStream() &larr; Employer deposits USDC</span>
                      <span>claim() &larr; Time-based, one click</span>
                      <span>endStream() &larr; Recover unused USDC</span>
                    </div>
                    <div className="about-arch-event">Standalone stablecoin payroll</div>
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
                    <strong>Connect & Choose Network</strong>
                    <p>Connect MetaMask and switch between Flare (FLR payroll) or Plasma (USDC payroll) with the header toggle</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Fund & Create Stream</strong>
                    <p>On Flare: deposit FLR, set USD rate and interval. On Plasma: get test USDC from faucet, approve, then deposit.</p>
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
                    <p>See all streams assigned to your address with live countdowns to next claim on both networks</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Claim Earnings</strong>
                    <p>On Flare: verify work via FDC (5-step attestation flow) or use Quick Claim demo. On Plasma: one click, one tx.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Track History</strong>
                    <p>Flare tab shows claim events with bonus status. Plasma tab shows structured receipts and lifetime USD totals.</p>
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
                <div className="about-contract-row">
                  <span className="about-contract-name">PlasmaPayroll</span>
                  <span className="about-contract-chain">Plasma Testnet</span>
                  <span className="about-contract-desc">USDC streaming with time-based claims</span>
                </div>
                <div className="about-contract-row">
                  <span className="about-contract-name">MockUSDC</span>
                  <span className="about-contract-chain">Plasma Testnet</span>
                  <span className="about-contract-desc">ERC20 test token (6 decimals, public faucet)</span>
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
