import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  INSTANT_PAYROLL_ADDRESS,
  INSTANT_PAYROLL_ABI,
  PLASMA_PAYOUT_ADDRESS,
  PLASMA_PAYOUT_ABI,
  GOOGLE_CLIENT_ID,
  flareProvider,
  plasmaProvider,
} from "../config";
import {
  prepareGitHubAttestationRequest,
  prepareGoogleDocsAttestationRequest,
  submitAttestationRequest,
  waitForFinalization,
  retrieveProof,
  buildClaimProof,
} from "../utils/fdc";
import { requestGoogleAccessToken, parseGoogleDocId } from "../utils/google-auth";

interface Stream {
  id: number;
  employer: string;
  worker: string;
  usdRatePerInterval: bigint;
  claimInterval: bigint;
  totalDeposit: bigint;
  totalClaimed: bigint;
  lastClaimTime: bigint;
  createdAt: bigint;
  active: boolean;
}

interface PlasmaPayout {
  flareStreamId: bigint;
  amountFLR: bigint;
  amountUSD: bigint;
  timestamp: bigint;
  bonusTriggered: boolean;
  commitCount: bigint;
}

interface WorkerPageProps {
  address: string;
  signer: ethers.Signer | null;
  isCoston2: boolean;
}

type FdcStep = "idle" | "preparing" | "submitting" | "finalizing" | "retrieving" | "claiming" | "done" | "error";

const FDC_STEP_LABELS: Record<FdcStep, string> = {
  idle: "",
  preparing: "Preparing attestation request...",
  submitting: "Submitting attestation to FDC...",
  finalizing: "Waiting for round finalization (~90s)...",
  retrieving: "Retrieving proof from DA layer...",
  claiming: "Claiming payment on-chain...",
  done: "Claim complete!",
  error: "Error occurred",
};

const FDC_STEP_NUMBER: Record<FdcStep, number> = {
  idle: 0,
  preparing: 1,
  submitting: 2,
  finalizing: 3,
  retrieving: 4,
  claiming: 5,
  done: 5,
  error: 0,
};

export function WorkerPage({ address, signer, isCoston2 }: WorkerPageProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [plasmaPayouts, setPlasmaPayouts] = useState<PlasmaPayout[]>([]);
  const [totalEarnedUSD, setTotalEarnedUSD] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimEvents, setClaimEvents] = useState<any[]>([]);
  const [bonusStatus, setBonusStatus] = useState<{ wouldTrigger: boolean; isSecure: boolean } | null>(null);
  const [price, setPrice] = useState<string>("");
  const [priceDecimals, setPriceDecimals] = useState<number>(7);
  const [activeTab, setActiveTab] = useState<"flare" | "plasma">("flare");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // FDC state
  const [githubRepo, setGithubRepo] = useState<string>(() => localStorage.getItem("githubRepo") || "");
  const [fdcStep, setFdcStep] = useState<FdcStep>("idle");
  const [fdcError, setFdcError] = useState<string | null>(null);
  const [fdcProgress, setFdcProgress] = useState<string>("");
  const [fdcClaimingStreamId, setFdcClaimingStreamId] = useState<number | null>(null);

  // Google Docs state
  const [workSource, setWorkSource] = useState<"github" | "google">(() => (localStorage.getItem("workSource") as "github" | "google") || "github");
  const [googleDocInput, setGoogleDocInput] = useState<string>(() => localStorage.getItem("googleDocInput") || "");
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("githubRepo", githubRepo);
  }, [githubRepo]);
  useEffect(() => {
    localStorage.setItem("googleDocInput", googleDocInput);
  }, [googleDocInput]);
  useEffect(() => {
    localStorage.setItem("workSource", workSource);
  }, [workSource]);

  // Tick every second for live countdowns
  useEffect(() => {
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  const readContract = useMemo(
    () => INSTANT_PAYROLL_ADDRESS ? new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, flareProvider) : null,
    []
  );

  const loadWorkerData = useCallback(async () => {
    if (!address || !readContract) return;
    setLoading(true);
    try {
      // Load streams where address is the worker
      const nextId = await readContract.nextStreamId();
      const count = Number(nextId);
      const results = await Promise.allSettled(
        Array.from({ length: count }, (_, i) => readContract.getStream(i))
      );
      const found: Stream[] = results
        .map((r, i) => ({ r, i }))
        .filter((x): x is { r: PromiseFulfilledResult<any>; i: number } => x.r.status === "fulfilled")
        .map(({ r, i }) => ({
          id: i,
          employer: r.value.employer,
          worker: r.value.worker,
          usdRatePerInterval: r.value.usdRatePerInterval,
          claimInterval: r.value.claimInterval,
          totalDeposit: r.value.totalDeposit,
          totalClaimed: r.value.totalClaimed,
          lastClaimTime: r.value.lastClaimTime,
          createdAt: r.value.createdAt,
          active: r.value.active,
        }))
        .filter((s) => s.worker.toLowerCase() === address.toLowerCase());
      setStreams(found);

      // Load price
      try {
        const result = await readContract.getCurrentPrice();
        const decimals = Number(result.decimals);
        setPriceDecimals(decimals);
        setPrice(ethers.formatUnits(result.price, decimals));
      } catch (e) { console.error("Price feed error:", e); }

      // Load bonus status
      try {
        const bonus = await readContract.checkBonusStatus();
        setBonusStatus({ wouldTrigger: bonus.wouldTrigger, isSecure: bonus.isSecure });
      } catch (e) { console.error("Bonus status error:", e); }

      // Load past claim events for this worker
      try {
        const filter = readContract.filters.PaymentClaimed(null, address);
        let events;
        try {
          events = await readContract.queryFilter(filter, -10000);
        } catch {
          // Fallback: query without block range if RPC rejects the range
          events = await readContract.queryFilter(filter);
        }
        setClaimEvents(events.map((e: any) => e.args));
      } catch (e) { console.error("Claim events error:", e); }

    } catch (e: any) {
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  }, [address, readContract]);

  const loadPlasmaData = useCallback(async () => {
    if (!address || !PLASMA_PAYOUT_ADDRESS) return;
    try {
      const plasmaContract = new ethers.Contract(PLASMA_PAYOUT_ADDRESS, PLASMA_PAYOUT_ABI, plasmaProvider);
      const payouts = await plasmaContract.getAllPayouts(address);
      setPlasmaPayouts(payouts);
      const totalUsd = await plasmaContract.totalEarnedUSD(address);
      setTotalEarnedUSD(totalUsd);
    } catch (e: any) {
      console.error("Plasma load error:", e);
    }
  }, [address]);

  useEffect(() => {
    loadWorkerData();
    loadPlasmaData();
    const timer = setInterval(() => {
      loadWorkerData();
      loadPlasmaData();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadWorkerData, loadPlasmaData]);

  const handleClaimDemo = async (streamId: number) => {
    if (!signer || !isCoston2) return;
    setClaiming(streamId);
    try {
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.claimDemo(streamId, 1);
      await tx.wait();
      await loadWorkerData();
    } catch (e: any) {
      console.error("Claim error:", e);
      alert("Claim error: " + (e.reason || e.message));
    } finally {
      setClaiming(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) return;
    setGoogleSigningIn(true);
    try {
      const token = await requestGoogleAccessToken(GOOGLE_CLIENT_ID);
      setGoogleToken(token);
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      alert("Google sign-in failed: " + e.message);
    } finally {
      setGoogleSigningIn(false);
    }
  };

  const handleFdcClaim = async (streamId: number) => {
    if (!signer || !isCoston2) return;
    if (workSource === "github" && !githubRepo.trim()) return;
    if (workSource === "google" && !googleDocInput.trim()) return;

    if (workSource === "google" && !googleToken) {
      alert("Please sign in with Google first.");
      return;
    }

    setFdcClaimingStreamId(streamId);
    setFdcError(null);
    setFdcProgress("");

    try {
      // Step 1: Prepare
      setFdcStep("preparing");
      setFdcProgress("Calling FDC verifier API...");
      let abiEncodedRequest: string;
      if (workSource === "google") {
        const fileId = parseGoogleDocId(googleDocInput.trim());
        const data = await prepareGoogleDocsAttestationRequest(fileId, googleToken!);
        abiEncodedRequest = data.abiEncodedRequest;
      } else {
        const data = await prepareGitHubAttestationRequest(githubRepo.trim());
        abiEncodedRequest = data.abiEncodedRequest;
      }

      // Step 2: Submit
      setFdcStep("submitting");
      setFdcProgress("Submitting attestation transaction...");
      const roundId = await submitAttestationRequest(signer, abiEncodedRequest);
      setFdcProgress(`Attestation submitted. Round ID: ${roundId}`);

      // Step 3: Wait for finalization
      setFdcStep("finalizing");
      await waitForFinalization(signer.provider!, roundId, (msg) => setFdcProgress(msg));

      // Step 4: Retrieve proof
      setFdcStep("retrieving");
      setFdcProgress("Fetching proof from DA layer...");
      const proofData = await retrieveProof(abiEncodedRequest, roundId, (msg) => setFdcProgress(msg));

      // Step 5: Claim on-chain
      setFdcStep("claiming");
      setFdcProgress("Sending claim transaction...");
      const proof = buildClaimProof(proofData.proof, proofData.response_hex);
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.claim(streamId, proof);
      await tx.wait();

      // Done
      setFdcStep("done");
      setFdcProgress("Payment claimed successfully!");
      await loadWorkerData();

      // Reset after a short delay
      setTimeout(() => {
        setFdcStep("idle");
        setFdcProgress("");
        setFdcClaimingStreamId(null);
      }, 5000);
    } catch (e: any) {
      console.error("FDC claim error:", e);
      setFdcStep("error");
      setFdcError(e.reason || e.message || "Unknown error");
      setFdcClaimingStreamId(null);
    }
  };

  const resetFdcState = () => {
    setFdcStep("idle");
    setFdcError(null);
    setFdcProgress("");
    setFdcClaimingStreamId(null);
  };

  const getTimeUntilClaim = (stream: Stream) => {
    const nextClaim = stream.lastClaimTime + stream.claimInterval;
    if (BigInt(now) >= nextClaim) return 0;
    return Number(nextClaim - BigInt(now));
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
  };

  const isFdcBusy = fdcStep !== "idle" && fdcStep !== "done" && fdcStep !== "error";

  if (!address) {
    return (
      <div className="page">
        <div className="card">
          <h2>Worker Dashboard</h2>
          <p className="muted">Connect your wallet to view your payment streams.</p>
        </div>
      </div>
    );
  }

  if (!INSTANT_PAYROLL_ADDRESS) {
    return (
      <div className="page">
        <div className="card">
          <h2>Worker Dashboard</h2>
          <p className="muted">Set VITE_INSTANT_PAYROLL_ADDRESS in your .env to connect.</p>
        </div>
      </div>
    );
  }

  const totalClaimedFLR = streams.reduce((sum, s) => sum + s.totalClaimed, 0n);

  return (
    <div className="page">
      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Earned (FLR)</div>
          <div className="stat-value">{ethers.formatEther(totalClaimedFLR)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">FLR/USD Price</div>
          <div className="stat-value">${price || "..."}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bonus Lottery</div>
          <div className={`stat-value ${bonusStatus?.wouldTrigger ? "bonus-active" : ""}`}>
            {bonusStatus?.wouldTrigger ? "2x ACTIVE!" : "Normal"}
          </div>
        </div>
        {PLASMA_PAYOUT_ADDRESS && (
          <div className="stat-card">
            <div className="stat-label">Plasma Total (USD)</div>
            <div className="stat-value">${ethers.formatEther(totalEarnedUSD)}</div>
          </div>
        )}
      </div>

      {/* Work Verification Source */}
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Work Verification</h3>
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button
            className={`tab ${workSource === "github" ? "tab-active" : ""}`}
            onClick={() => setWorkSource("github")}
            disabled={isFdcBusy}
          >
            GitHub
          </button>
          <button
            className={`tab ${workSource === "google" ? "tab-active" : ""}`}
            onClick={() => setWorkSource("google")}
            disabled={isFdcBusy}
          >
            Google Docs
          </button>
        </div>

        {workSource === "github" && (
          <div>
            <input
              type="text"
              className="input"
              placeholder="owner/repo (e.g. myorg/myproject)"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              disabled={isFdcBusy}
              style={{ width: "100%", maxWidth: 400 }}
            />
            <p className="muted" style={{ marginTop: 4, fontSize: "0.8rem" }}>
              FDC verifies GitHub commit count as proof of work
            </p>
          </div>
        )}

        {workSource === "google" && (
          <div>
            {!GOOGLE_CLIENT_ID ? (
              <p className="muted" style={{ color: "#e67e22" }}>
                Set VITE_GOOGLE_CLIENT_ID in your .env to enable Google Docs verification.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  placeholder="Google Doc URL or file ID"
                  value={googleDocInput}
                  onChange={(e) => setGoogleDocInput(e.target.value)}
                  disabled={isFdcBusy}
                  style={{ width: "100%", maxWidth: 400, marginBottom: 8 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {googleToken ? (
                    <span style={{ color: "#27ae60", fontSize: "0.85rem", fontWeight: 600 }}>
                      Signed in with Google
                    </span>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={handleGoogleSignIn}
                      disabled={googleSigningIn || isFdcBusy}
                    >
                      {googleSigningIn ? "Signing in..." : "Sign in with Google"}
                    </button>
                  )}
                </div>
                <p className="muted" style={{ marginTop: 4, fontSize: "0.8rem" }}>
                  FDC verifies Google Doc revision count as proof of work
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* FDC Progress (global, shown when active) */}
      {fdcStep === "error" && (
        <div className="card" style={{ borderLeft: "3px solid #e74c3c" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>FDC Claim Error</strong>
              <p className="muted" style={{ marginTop: 4 }}>{fdcError}</p>
            </div>
            <button className="btn btn-secondary" onClick={resetFdcState}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Active Streams */}
      <div className="card">
        <h2>Your Payment Streams {loading && <span className="spinner" />}</h2>
        {streams.length === 0 && !loading && (
          <p className="muted">No streams assigned to your address.</p>
        )}
        {streams.map((s) => {
          const secsLeft = getTimeUntilClaim(s);
          const canClaim = secsLeft === 0 && s.active;
          const remaining = s.totalDeposit - s.totalClaimed;
          const pctUsed = Number(s.totalDeposit) > 0
            ? (Number(s.totalClaimed) * 100) / Number(s.totalDeposit)
            : 0;
          const isThisStreamFdcBusy = isFdcBusy && fdcClaimingStreamId === s.id;

          return (
            <div key={s.id} className={`stream-card ${s.active ? "active" : "ended"}`}>
              <div className="stream-header">
                <span className="stream-id">Stream #{s.id}</span>
                <span className={`badge ${s.active ? "badge-active" : "badge-ended"}`}>
                  {s.active ? "Active" : "Ended"}
                </span>
              </div>
              <div className="stream-details">
                <div><strong>Employer:</strong> {s.employer.slice(0, 8)}...{s.employer.slice(-6)}</div>
                <div><strong>Rate:</strong> ${ethers.formatEther(s.usdRatePerInterval)} / {s.claimInterval.toString()}s</div>
                <div><strong>Remaining:</strong> {ethers.formatEther(remaining)} C2FLR</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pctUsed}%` }} />
                </div>
              </div>

              {s.active && (
                <div className="claim-section">
                  {canClaim ? (
                    <div className="claim-ready">
                      {/* FDC Progress for this stream */}
                      {isThisStreamFdcBusy && (
                        <div className="fdc-progress" style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>
                            Step {FDC_STEP_NUMBER[fdcStep]}/5: {FDC_STEP_LABELS[fdcStep]}
                          </div>
                          <div className="progress-bar" style={{ height: 8 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(FDC_STEP_NUMBER[fdcStep] / 5) * 100}%`,
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                          {fdcProgress && (
                            <div className="muted" style={{ marginTop: 4, fontSize: "0.8rem" }}>
                              {fdcProgress}
                            </div>
                          )}
                        </div>
                      )}

                      {fdcStep === "done" && fdcClaimingStreamId === s.id && (
                        <div style={{ marginBottom: 12, color: "#27ae60", fontWeight: 600 }}>
                          Payment claimed successfully!
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleFdcClaim(s.id)}
                          disabled={
                            isFdcBusy ||
                            claiming === s.id ||
                            !isCoston2 ||
                            (workSource === "github" && !githubRepo.trim()) ||
                            (workSource === "google" && (!googleDocInput.trim() || !googleToken || !GOOGLE_CLIENT_ID))
                          }
                          title={
                            workSource === "github" && !githubRepo.trim()
                              ? "Enter a GitHub repo above first"
                              : workSource === "google" && !googleToken
                                ? "Sign in with Google first"
                                : workSource === "google"
                                  ? "Verify Google Doc revisions via FDC and claim"
                                  : "Verify GitHub commits via FDC and claim"
                          }
                        >
                          {isThisStreamFdcBusy
                            ? "FDC Claiming..."
                            : workSource === "google"
                              ? "Claim with Google Docs Proof"
                              : "Claim with GitHub Proof"}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleClaimDemo(s.id)}
                          disabled={claiming === s.id || isFdcBusy || !isCoston2}
                        >
                          {claiming === s.id ? "Claiming..." : "Quick Claim (Demo)"}
                        </button>
                      </div>
                      <p className="muted" style={{ marginTop: 8, fontSize: "0.8rem" }}>
                        {workSource === "google"
                          ? "Google Docs Proof uses FDC attestation to verify document revisions. Demo uses hardcoded count."
                          : "GitHub Proof uses FDC attestation to verify commits. Demo uses hardcoded count."}
                      </p>
                    </div>
                  ) : (
                    <div className="claim-wait">
                      Next claim in: <span className="countdown">{formatCountdown(secsLeft)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabs: Flare Claims / Plasma Payouts */}
      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "flare" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("flare")}
          >
            Flare Claims ({claimEvents.length})
          </button>
          {PLASMA_PAYOUT_ADDRESS && (
            <button
              className={`tab ${activeTab === "plasma" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("plasma")}
            >
              Plasma Payouts ({plasmaPayouts.length})
            </button>
          )}
        </div>

        {activeTab === "flare" && (
          <div className="events-list">
            {claimEvents.length === 0 ? (
              <p className="muted">No claims yet.</p>
            ) : (
              claimEvents.map((ev, i) => (
                <div key={i} className={`event-row ${ev.bonusTriggered ? "bonus-row" : ""}`}>
                  <div className="event-main">
                    <span className="event-amount">{ethers.formatEther(ev.amountFLR)} FLR</span>
                    <span className="event-stream">Stream #{ev.streamId.toString()}</span>
                    {ev.bonusTriggered && <span className="bonus-badge">2x BONUS</span>}
                  </div>
                  <div className="event-sub">
                    {ev.commitCount.toString()} commits | FLR/USD: {ethers.formatUnits(ev.flrUsdPrice, priceDecimals)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "plasma" && (
          <div className="events-list">
            {plasmaPayouts.length === 0 ? (
              <p className="muted">No Plasma payouts recorded yet.</p>
            ) : (
              plasmaPayouts.map((p, i) => (
                <div key={i} className={`event-row ${p.bonusTriggered ? "bonus-row" : ""}`}>
                  <div className="event-main">
                    <span className="event-amount">{ethers.formatEther(p.amountFLR)} FLR</span>
                    <span className="event-usd">(${ethers.formatEther(p.amountUSD)})</span>
                    {p.bonusTriggered && <span className="bonus-badge">2x BONUS</span>}
                  </div>
                  <div className="event-sub">
                    {p.commitCount.toString()} commits | {new Date(Number(p.timestamp) * 1000).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
