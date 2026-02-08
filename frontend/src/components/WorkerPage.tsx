import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  INSTANT_PAYROLL_ADDRESS,
  INSTANT_PAYROLL_ABI,
  PLASMA_PAYOUT_ADDRESS,
  PLASMA_PAYOUT_ABI,
  GOOGLE_CLIENT_ID,
  CURRENCY_SYMBOL,
  FLARE_EXPLORER,
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
  extractCommitCount,
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
  isFlareNetwork: boolean;
  switchToFlare: () => void;
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

export function WorkerPage({
  address, signer, isFlareNetwork, switchToFlare,
}: WorkerPageProps) {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [plasmaPayouts, setPlasmaPayouts] = useState<PlasmaPayout[]>([]);
  const [totalEarnedUSD, setTotalEarnedUSD] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimEvents, setClaimEvents] = useState<any[]>([]);
  const [bonusStatus, setBonusStatus] = useState<{ wouldTrigger: boolean; isSecure: boolean } | null>(null);
  const [price, setPrice] = useState<string>("");
  const [priceDecimals, setPriceDecimals] = useState<number>(7);
  const [historyTab, setHistoryTab] = useState<"flare" | "plasma">("flare");
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const [displayName] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem("instantPayrollUser") || ""); return u?.displayName || ""; } catch { return ""; }
  });
  const [flrBalance, setFlrBalance] = useState<string | null>(null);

  // FDC state
  const [githubRepo, setGithubRepo] = useState<string>(() => localStorage.getItem("githubRepo") || "");
  const [fdcStep, setFdcStep] = useState<FdcStep>("idle");
  const [fdcError, setFdcError] = useState<string | null>(null);
  const [fdcProgress, setFdcProgress] = useState<string>("");
  const [fdcClaimingStreamId, setFdcClaimingStreamId] = useState<number | null>(null);
  const [fdcCommitCount, setFdcCommitCount] = useState<number | null>(null);
  const [fdcRoundId, setFdcRoundId] = useState<number | null>(null);
  const [fdcTxHash, setFdcTxHash] = useState<string | null>(null);
  const [fdcProofDepth, setFdcProofDepth] = useState<number | null>(null);

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

      // Load past claim events for this worker (paginated — RPC limits to 30 blocks per query)
      try {
        const filter = readContract.filters.PaymentClaimed(null, address);
        const currentBlock = await flareProvider.getBlockNumber();
        const MAX_RANGE = 30;
        const LOOKBACK = 3000;
        const fromBlock = Math.max(0, currentBlock - LOOKBACK);

        const chunks: [number, number][] = [];
        for (let start = fromBlock; start <= currentBlock; start += MAX_RANGE) {
          chunks.push([start, Math.min(start + MAX_RANGE - 1, currentBlock)]);
        }

        const BATCH_SIZE = 10;
        const allEvents: any[] = [];
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(([from, to]) => readContract.queryFilter(filter, from, to))
          );
          for (const r of results) {
            if (r.status === "fulfilled") allEvents.push(...r.value);
          }
        }
        // Fetch block timestamps for each event
        const uniqueBlocks = [...new Set(allEvents.map((e: any) => e.blockNumber))];
        const blockTimestamps: Record<number, number> = {};
        await Promise.all(
          uniqueBlocks.map(async (bn) => {
            try {
              const block = await flareProvider.getBlock(bn);
              if (block) blockTimestamps[bn] = block.timestamp;
            } catch { /* skip */ }
          })
        );
        setClaimEvents(allEvents.map((e: any) => ({
          streamId: e.args.streamId,
          worker: e.args.worker,
          amountFLR: e.args.amountFLR,
          amountUSD: e.args.amountUSD,
          flrUsdPrice: e.args.flrUsdPrice,
          bonusTriggered: e.args.bonusTriggered,
          commitCount: e.args.commitCount,
          _timestamp: blockTimestamps[e.blockNumber] || 0,
        })));
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

  const loadBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await flareProvider.getBalance(address);
      setFlrBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));
    } catch (e) { console.error("Balance error:", e); }
  }, [address]);

  useEffect(() => {
    loadWorkerData();
    loadPlasmaData();
    loadBalance();
    const timer = setInterval(() => {
      loadWorkerData();
      loadPlasmaData();
      loadBalance();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadWorkerData, loadPlasmaData, loadBalance]);

  const handleClaimDemo = async (streamId: number) => {
    if (!signer || !isFlareNetwork) return;
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
    if (!signer || !isFlareNetwork) return;
    if (workSource === "github" && !githubRepo.trim()) return;
    if (workSource === "google" && !googleDocInput.trim()) return;

    if (workSource === "google" && !googleToken) {
      alert("Please sign in with Google first.");
      return;
    }

    // Find the stream to get lastClaimTime for the `since` filter
    const stream = streams.find(s => s.id === streamId);
    if (!stream) return;

    // For first claim (no previous claims), count all work; for subsequent claims, only new work
    const isFirstClaim = stream.totalClaimed === 0n;
    const sinceDate = isFirstClaim
      ? undefined
      : new Date(Number(stream.lastClaimTime) * 1000).toISOString();

    setFdcClaimingStreamId(streamId);
    setFdcError(null);
    setFdcProgress("");
    setFdcCommitCount(null);
    setFdcRoundId(null);
    setFdcTxHash(null);
    setFdcProofDepth(null);

    try {
      // Step 1: Prepare
      setFdcStep("preparing");
      setFdcProgress(sinceDate
        ? `Verifying ${workSource === "google" ? "revisions" : "commits"} since ${new Date(sinceDate).toLocaleString()}...`
        : `Verifying all ${workSource === "google" ? "revisions" : "commits"}...`
      );
      let abiEncodedRequest: string;
      if (workSource === "google") {
        const fileId = parseGoogleDocId(googleDocInput.trim());
        const data = await prepareGoogleDocsAttestationRequest(fileId, googleToken!, sinceDate);
        abiEncodedRequest = data.abiEncodedRequest;
      } else {
        const data = await prepareGitHubAttestationRequest(githubRepo.trim(), sinceDate);
        abiEncodedRequest = data.abiEncodedRequest;
      }

      // Step 2: Submit
      setFdcStep("submitting");
      setFdcProgress("Submitting attestation transaction...");
      const { roundId, txHash, requestFee } = await submitAttestationRequest(signer, abiEncodedRequest);
      setFdcRoundId(roundId);
      setFdcTxHash(txHash);
      setFdcProgress(`Attestation submitted — Round #${roundId} (fee: ${requestFee} ${CURRENCY_SYMBOL})`);

      // Step 3: Wait for finalization
      setFdcStep("finalizing");
      await waitForFinalization(signer.provider!, roundId, (msg) => setFdcProgress(`Waiting for round #${roundId} finalization... ${msg.match(/\(.*\)/)?.[0] || ""}`));

      // Step 4: Retrieve proof
      setFdcStep("retrieving");
      setFdcProgress("Retrieving Merkle proof from DA layer...");
      const proofData = await retrieveProof(abiEncodedRequest, roundId, (msg) => setFdcProgress(msg));
      setFdcProofDepth(proofData.proofDepth);

      // Extract and display verified commit count
      const verifiedCount = extractCommitCount(proofData.response_hex);
      setFdcCommitCount(verifiedCount);

      // Step 5: Claim on-chain
      setFdcStep("claiming");
      const unitLabel = workSource === "google" ? "revision" : "commit";
      const unitPlural = verifiedCount !== 1 ? "s" : "";
      setFdcProgress(`Verified ${verifiedCount} ${unitLabel}${unitPlural} — Merkle proof depth: ${proofData.proofDepth}. Sending claim transaction...`);
      const proof = buildClaimProof(proofData.proof, proofData.response_hex);
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.claim(streamId, proof);
      await tx.wait();

      // Done
      setFdcStep("done");
      setFdcProgress(`Payment claimed! Verified ${verifiedCount} ${unitLabel}${unitPlural}. Receipt stored on Plasma.`);
      await loadWorkerData();
      await loadPlasmaData();

      // Reset after a short delay
      setTimeout(() => {
        setFdcStep("idle");
        setFdcProgress("");
        setFdcClaimingStreamId(null);
        setFdcCommitCount(null);
        setFdcRoundId(null);
        setFdcTxHash(null);
        setFdcProofDepth(null);
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
    setFdcCommitCount(null);
    setFdcRoundId(null);
    setFdcTxHash(null);
    setFdcProofDepth(null);
  };

  const getTimeUntilClaim = (stream: { lastClaimTime: bigint; claimInterval: bigint }) => {
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

  const exportFlareCsv = () => {
    if (claimEvents.length === 0) return;
    const header = "Stream ID,Amount (FLR),FLR/USD Price,Bonus,Commits\n";
    const rows = claimEvents.map((ev) =>
      `${ev.streamId.toString()},${ethers.formatEther(ev.amountFLR)},${ethers.formatUnits(ev.flrUsdPrice, priceDecimals)},${ev.bonusTriggered ? "Yes" : "No"},${ev.commitCount.toString()}`
    ).join("\n");
    downloadCsv(header + rows, "flare-payment-history.csv");
  };

  const exportPlasmaCsv = () => {
    if (plasmaPayouts.length === 0) return;
    const header = "Stream ID,Amount (FLR),Amount (USD),Date,Bonus,Commits\n";
    const rows = plasmaPayouts.map((p) =>
      `${p.flareStreamId.toString()},${ethers.formatEther(p.amountFLR)},${ethers.formatEther(p.amountUSD)},${new Date(Number(p.timestamp) * 1000).toISOString()},${p.bonusTriggered ? "Yes" : "No"},${p.commitCount.toString()}`
    ).join("\n");
    downloadCsv(header + rows, "plasma-receipts.csv");
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!address) {
    return (
      <div className="page">
        <div className="card">
          <h2>Worker Dashboard</h2>
          <p className="muted">Connect your wallet to view your payment streams.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Connect Wallet
          </Link>
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
      {!isFlareNetwork && (
        <div className="network-banner">
          Switch to Flare network to claim payments.{" "}
          <button className="btn btn-warning" onClick={switchToFlare}>Switch to Flare</button>
        </div>
      )}

      {/* Account Header */}
      <div className="card account-header">
        <div className="account-greeting">
          {displayName ? `Welcome, ${displayName}` : "Worker Dashboard"}
        </div>
        <div className="account-address">
          <a className="address-link" href={`${FLARE_EXPLORER}/address/${address}`} target="_blank" rel="noopener noreferrer">
            {address}
          </a>
        </div>
        {flrBalance !== null && (
          <div className="account-balance">Balance: {flrBalance} {CURRENCY_SYMBOL}</div>
        )}
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
              <div className="stat-label">Lifetime (USD)</div>
              <div className="stat-value">${ethers.formatEther(totalEarnedUSD)}</div>
            </div>
          )}
        </div>
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
                <div><strong>Remaining:</strong> {ethers.formatEther(remaining)} {CURRENCY_SYMBOL}</div>
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
                          {fdcTxHash && (
                            <div style={{ marginTop: 4, fontSize: "0.8rem" }}>
                              <a href={`${FLARE_EXPLORER}/tx/${fdcTxHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>
                                View attestation tx
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {fdcStep === "done" && fdcClaimingStreamId === s.id && (
                        <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(39,174,96,0.08)", borderRadius: 8, border: "1px solid rgba(39,174,96,0.2)" }}>
                          <div style={{ color: "#27ae60", fontWeight: 600 }}>
                            Payment claimed! {fdcCommitCount !== null && `(${fdcCommitCount} ${workSource === "google" ? "revision" : "commit"}${fdcCommitCount !== 1 ? "s" : ""} verified)`}
                          </div>
                          <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                            Verified by Flare validator set via FDC round #{fdcRoundId}
                            {fdcProofDepth !== null && ` · Merkle proof depth: ${fdcProofDepth}`}
                          </div>
                        </div>
                      )}

                      <button
                        className="btn btn-primary"
                        onClick={() => handleFdcClaim(s.id)}
                        disabled={
                          isFdcBusy ||
                          claiming === s.id ||
                          !isFlareNetwork ||
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
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: "0.75rem", padding: "4px 10px", opacity: 0.6 }}
                          onClick={() => handleClaimDemo(s.id)}
                          disabled={claiming === s.id || isFdcBusy || !isFlareNetwork}
                        >
                          {claiming === s.id ? "Claiming..." : "Quick Claim (skip FDC — demo only)"}
                        </button>
                      </div>
                      <p className="muted" style={{ marginTop: 8, fontSize: "0.75rem" }}>
                        FDC attestation verifies {workSource === "google" ? "document revisions" : "GitHub commits"} through the Flare validator set before releasing payment.
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

      {/* Payment History */}
      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${historyTab === "flare" ? "tab-active" : ""}`}
            onClick={() => setHistoryTab("flare")}
          >
            Flare Claims ({claimEvents.length})
          </button>
          <button
            className={`tab ${historyTab === "plasma" ? "tab-active" : ""}`}
            onClick={() => setHistoryTab("plasma")}
          >
            Plasma Receipts ({plasmaPayouts.length > 0 ? plasmaPayouts.length : claimEvents.length})
          </button>
        </div>

        {historyTab === "flare" && (
          <div className="events-list">
            {claimEvents.length > 0 && (
              <button className="btn btn-secondary" style={{ alignSelf: "flex-end", marginBottom: 8 }} onClick={exportFlareCsv}>
                Export CSV
              </button>
            )}
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
                    {ev._timestamp > 0 && ` | ${new Date(ev._timestamp * 1000).toLocaleString()}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {historyTab === "plasma" && (
          <div className="events-list">
            {plasmaPayouts.length > 0 ? (
              <>
                <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 12 }}>
                  Free permanent receipts stored on Plasma (zero gas cost). Updated by the cross-chain relayer.
                </p>
                <button className="btn btn-secondary" style={{ alignSelf: "flex-end", marginBottom: 8 }} onClick={exportPlasmaCsv}>
                  Export CSV
                </button>
                {plasmaPayouts.map((p, i) => (
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
                ))}
              </>
            ) : claimEvents.length > 0 ? (
              <>
                <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 12 }}>
                  Relayer not active — showing Flare claim data as receipts. Start the relayer to store permanent receipts on Plasma.
                </p>
                {claimEvents.map((ev, i) => (
                  <div key={i} className={`event-row ${ev.bonusTriggered ? "bonus-row" : ""}`}>
                    <div className="event-main">
                      <span className="event-amount">{ethers.formatEther(ev.amountFLR)} FLR</span>
                      <span className="event-usd">(${ethers.formatEther(ev.amountUSD)})</span>
                      {ev.bonusTriggered && <span className="bonus-badge">2x BONUS</span>}
                    </div>
                    <div className="event-sub">
                      {ev.commitCount.toString()} commits
                      {ev._timestamp > 0 && ` | ${new Date(ev._timestamp * 1000).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="muted">No receipts yet. Make a claim on Flare first.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
