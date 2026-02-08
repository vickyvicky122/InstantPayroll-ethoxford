import { useState } from "react";
import { Link } from "react-router-dom";
import "./AboutPage.css";

type Section = "overview" | "flare" | "plasma" | "stack" | "flow";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flare", label: "Flare Payroll" },
  { id: "plasma", label: "Plasma USDC" },
  { id: "flow", label: "How It Works" },
  { id: "stack", label: "Tech Stack" },
];

export function AboutPage() {
  const [active, setActive] = useState<Section>("overview");

  return (
    <div className="about">
      <div className="about-hero">
        <h1 className="about-title">About InstantPayroll</h1>
        <p className="about-subtitle">
          Real-time verified payroll streaming across two chains
        </p>
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
        {active === "overview" && (
          <div className="about-section">
            <div className="about-card about-card-highlight">
              <h2>Two Chains, Two Payroll Models</h2>
              <p>
                InstantPayroll combines the power of <strong>Flare</strong> and <strong>Plasma</strong> into
                a single payroll application. Each chain serves a distinct purpose:
              </p>
              <div className="about-duo">
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #e62058, #ff7094)" }}>F</div>
                  <div>
                    <strong>Flare &mdash; Crypto Payroll</strong>
                    <p>Pay in FLR with oracle-priced USD rates, work verified on-chain via FDC, bonus lottery on each claim</p>
                  </div>
                </div>
                <div className="about-duo-item">
                  <div className="about-duo-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>P</div>
                  <div>
                    <strong>Plasma &mdash; Stablecoin Payroll</strong>
                    <p>Pay in USDC with stable value, simple time-based claims, one click to collect</p>
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
                <h3>On-Chain Verification</h3>
                <p>Flare claims require proof of work via FDC attestations &mdash; GitHub commits or Google Docs revisions verified on-chain.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num">03</div>
                <h3>Dual Network</h3>
                <p>Switch between Flare and Plasma with one click. Each network has independent streams, balances, and history.</p>
              </div>
              <div className="about-feature">
                <div className="about-feature-num">04</div>
                <h3>No Middlemen</h3>
                <p>Smart contracts hold funds in escrow. Workers claim directly. Employers can end streams and recover unused funds anytime.</p>
              </div>
            </div>
          </div>
        )}

        {active === "flare" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Flare Payroll (FLR)</h2>
              <p>The Flare payroll system uses native FLR tokens and leverages Flare's unique protocol-level services:</p>

              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge">FTSO</div>
                  <div>
                    <strong>Oracle-Priced Payouts</strong>
                    <p>Employers set pay rates in USD. The FTSO V2 price oracle converts to FLR at claim time, so workers always get fair market value.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">FDC</div>
                  <div>
                    <strong>Work Verification</strong>
                    <p>Claims require proof of work via Flare Data Connector. Two sources supported: GitHub commit counts and Google Docs revision counts, both verified on-chain.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">RNG</div>
                  <div>
                    <strong>Bonus Lottery</strong>
                    <p>Each claim has a 1-in-10 chance of triggering a 2x bonus payout, powered by Flare's Secure Random Number generator.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge">DEMO</div>
                  <div>
                    <strong>Quick Claim Mode</strong>
                    <p>A demo claim option bypasses FDC verification for fast testing while still using FTSO pricing and the bonus lottery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "plasma" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Plasma Payroll (USDC)</h2>
              <p>The Plasma payroll system provides simple, stable-value payments using USDC stablecoins:</p>

              <div className="about-tech-list">
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>USDC</div>
                  <div>
                    <strong>Stablecoin Payments</strong>
                    <p>Pay and get paid in USDC (6 decimals). No price volatility &mdash; $1 stays $1.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>TIME</div>
                  <div>
                    <strong>Time-Based Claims</strong>
                    <p>Workers claim based on elapsed time intervals. Multiple intervals accumulate and can be claimed in a single transaction.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>1-TX</div>
                  <div>
                    <strong>One-Click Claims</strong>
                    <p>No FDC proof needed. Click "Claim USDC" and receive your earnings in a single transaction.</p>
                  </div>
                </div>
                <div className="about-tech-item">
                  <div className="about-tech-badge" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.25)" }}>TAP</div>
                  <div>
                    <strong>Test Faucet</strong>
                    <p>Get 10,000 test USDC with one click to try the system. Approve, create a stream, and start paying instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {active === "flow" && (
          <div className="about-section">
            <div className="about-card">
              <h2>Employer Flow</h2>
              <div className="about-steps">
                <div className="about-step">
                  <div className="about-step-num">1</div>
                  <div>
                    <strong>Connect Wallet</strong>
                    <p>Connect MetaMask and choose your network &mdash; Flare for FLR or Plasma for USDC</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">2</div>
                  <div>
                    <strong>Fund & Create Stream</strong>
                    <p>Set worker address, pay rate, interval, and deposit. On Plasma, approve USDC first.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Monitor & Manage</strong>
                    <p>Watch claim progress. End streams early to recover unused funds.</p>
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
                    <p>On Flare: verify work via FDC (GitHub/Google Docs) or use Quick Claim. On Plasma: one click.</p>
                  </div>
                </div>
                <div className="about-step">
                  <div className="about-step-num">3</div>
                  <div>
                    <strong>Track History</strong>
                    <p>View claim history, bonus payouts, and total earnings across both networks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <h3>Flare Protocols</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip about-stack-chip-accent">FTSO V2 (Price Oracle)</span>
                    <span className="about-stack-chip about-stack-chip-accent">FDC (Data Connector)</span>
                    <span className="about-stack-chip about-stack-chip-accent">Secure Random V2</span>
                    <span className="about-stack-chip about-stack-chip-accent">Web2Json Attestation</span>
                  </div>
                </div>

                <div className="about-stack-category">
                  <h3>Networks</h3>
                  <div className="about-stack-items">
                    <span className="about-stack-chip">Flare / Coston2</span>
                    <span className="about-stack-chip">Plasma Testnet</span>
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
                    <span className="about-stack-chip">MetaMask</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-card">
              <h2>Contracts</h2>
              <div className="about-contracts">
                <div className="about-contract-row">
                  <span className="about-contract-name">InstantPayroll</span>
                  <span className="about-contract-chain">Flare / Coston2</span>
                  <span className="about-contract-desc">FLR streaming with FTSO + FDC + RNG</span>
                </div>
                <div className="about-contract-row">
                  <span className="about-contract-name">PlasmaPayroll</span>
                  <span className="about-contract-chain">Plasma Testnet</span>
                  <span className="about-contract-desc">USDC streaming with time-based claims</span>
                </div>
                <div className="about-contract-row">
                  <span className="about-contract-name">MockUSDC</span>
                  <span className="about-contract-chain">Plasma Testnet</span>
                  <span className="about-contract-desc">ERC20 test token (6 decimals, faucet)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="about-cta">
        <Link to="/" className="btn btn-primary">Get Started</Link>
      </div>
    </div>
  );
}
