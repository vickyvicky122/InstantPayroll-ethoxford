import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  INSTANT_PAYROLL_ADDRESS,
  INSTANT_PAYROLL_ABI,
  PLASMA_PAYROLL_ADDRESS,
  PLASMA_PAYROLL_ABI,
  MOCK_USDC_ADDRESS,
  MOCK_USDC_ABI,
  flareProvider,
  plasmaProvider,
  FLARE_EXPLORER,
  CURRENCY_SYMBOL,
} from "../config";

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

interface PlasmaStream {
  id: number;
  employer: string;
  worker: string;
  usdcPerInterval: bigint;
  claimInterval: bigint;
  totalDeposit: bigint;
  totalClaimed: bigint;
  lastClaimTime: bigint;
  createdAt: bigint;
  active: boolean;
}

interface EmployerPageProps {
  address: string;
  signer: ethers.Signer | null;
  isCorrectNetwork: boolean;
  isFlareNetwork: boolean;
  isPlasmaNetwork: boolean;
  activeNetwork: "flare" | "plasma" | "unknown";
  switchToFlare: () => void;
  switchToPlasma: () => void;
}

export function EmployerPage({
  address, signer, isCorrectNetwork, isFlareNetwork, isPlasmaNetwork,
  activeNetwork, switchToFlare, switchToPlasma,
}: EmployerPageProps) {
  const [payrollTab, setPayrollTab] = useState<"flare" | "plasma">("flare");

  // --- Flare state ---
  const [workerAddr, setWorkerAddr] = useState("");
  const [usdRate, setUsdRate] = useState("0.5");
  const [interval, setInterval_] = useState("60");
  const [deposit, setDeposit] = useState("10");
  const [creating, setCreating] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState<number | null>(null);
  const [price, setPrice] = useState<{ price: string; decimals: number } | null>(null);

  // --- Plasma state ---
  const [plasmaWorkerAddr, setPlasmaWorkerAddr] = useState("");
  const [plasmaUsdcRate, setPlasmaUsdcRate] = useState("1");
  const [plasmaInterval, setPlasmaInterval_] = useState("60");
  const [plasmaDeposit, setPlasmaDeposit] = useState("100");
  const [plasmaCreating, setPlasmaCreating] = useState(false);
  const [plasmaApproving, setPlasmaApproving] = useState(false);
  const [plasmaStreams, setPlasmaStreams] = useState<PlasmaStream[]>([]);
  const [plasmaLoading, setPlasmaLoading] = useState(false);
  const [plasmaEnding, setPlasmaEnding] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>(0n);
  const [fauceting, setFauceting] = useState(false);

  const readContract = useMemo(
    () => INSTANT_PAYROLL_ADDRESS ? new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, flareProvider) : null,
    []
  );

  // --- Flare loaders ---
  const loadStreams = useCallback(async () => {
    if (!address || !readContract) return;
    setLoading(true);
    try {
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
        .filter((s) => s.employer.toLowerCase() === address.toLowerCase());
      setStreams(found);
    } catch (e: any) {
      console.error("Load streams error:", e);
    } finally {
      setLoading(false);
    }
  }, [address, readContract]);

  const loadPrice = useCallback(async () => {
    if (!readContract) return;
    try {
      const result = await readContract.getCurrentPrice();
      setPrice({
        price: ethers.formatUnits(result.price, Number(result.decimals)),
        decimals: Number(result.decimals),
      });
    } catch (e: any) {
      console.error("Price error:", e);
    }
  }, [readContract]);

  // --- Plasma loaders ---
  const loadPlasmaStreams = useCallback(async () => {
    if (!address || !PLASMA_PAYROLL_ADDRESS) return;
    setPlasmaLoading(true);
    try {
      const contract = new ethers.Contract(PLASMA_PAYROLL_ADDRESS, PLASMA_PAYROLL_ABI, plasmaProvider);
      const nextId = await contract.nextStreamId();
      const count = Number(nextId);
      const results = await Promise.allSettled(
        Array.from({ length: count }, (_, i) => contract.getStream(i))
      );
      const found: PlasmaStream[] = results
        .map((r, i) => ({ r, i }))
        .filter((x): x is { r: PromiseFulfilledResult<any>; i: number } => x.r.status === "fulfilled")
        .map(({ r, i }) => ({
          id: i,
          employer: r.value.employer,
          worker: r.value.worker,
          usdcPerInterval: r.value.usdcPerInterval,
          claimInterval: r.value.claimInterval,
          totalDeposit: r.value.totalDeposit,
          totalClaimed: r.value.totalClaimed,
          lastClaimTime: r.value.lastClaimTime,
          createdAt: r.value.createdAt,
          active: r.value.active,
        }))
        .filter((s) => s.employer.toLowerCase() === address.toLowerCase());
      setPlasmaStreams(found);
    } catch (e: any) {
      console.error("Load plasma streams error:", e);
    } finally {
      setPlasmaLoading(false);
    }
  }, [address]);

  const loadUsdcBalance = useCallback(async () => {
    if (!address || !MOCK_USDC_ADDRESS) return;
    try {
      const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, MOCK_USDC_ABI, plasmaProvider);
      const bal = await usdc.balanceOf(address);
      setUsdcBalance(bal);
      if (PLASMA_PAYROLL_ADDRESS) {
        const allow = await usdc.allowance(address, PLASMA_PAYROLL_ADDRESS);
        setUsdcAllowance(allow);
      }
    } catch (e: any) {
      console.error("USDC balance error:", e);
    }
  }, [address]);

  useEffect(() => {
    loadStreams();
    loadPrice();
    loadPlasmaStreams();
    loadUsdcBalance();
    const timer = setInterval(() => {
      loadPrice();
      loadUsdcBalance();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadStreams, loadPrice, loadPlasmaStreams, loadUsdcBalance]);

  // --- Flare handlers ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !isCorrectNetwork) return;
    if (!ethers.isAddress(workerAddr)) {
      alert("Invalid Ethereum address");
      return;
    }
    setCreating(true);
    setTxHash("");
    try {
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.createStream(
        workerAddr,
        ethers.parseEther(usdRate),
        parseInt(interval),
        { value: ethers.parseEther(deposit) }
      );
      setTxHash(tx.hash);
      await tx.wait();
      await loadStreams();
    } catch (e: any) {
      console.error("Create stream error:", e);
      alert("Error: " + (e.reason || e.message));
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async (streamId: number) => {
    if (!signer || !isCorrectNetwork) return;
    setEnding(streamId);
    try {
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.endStream(streamId);
      await tx.wait();
      await loadStreams();
    } catch (e: any) {
      console.error("End stream error:", e);
      alert("Error: " + (e.reason || e.message));
    } finally {
      setEnding(null);
    }
  };

  // --- Plasma handlers ---
  const handleFaucet = async () => {
    if (!signer || !isPlasmaNetwork) return;
    setFauceting(true);
    try {
      const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, MOCK_USDC_ABI, signer);
      const tx = await usdc.faucet();
      await tx.wait();
      await loadUsdcBalance();
    } catch (e: any) {
      console.error("Faucet error:", e);
      alert("Faucet error: " + (e.reason || e.message));
    } finally {
      setFauceting(false);
    }
  };

  const handleApproveUsdc = async () => {
    if (!signer || !isPlasmaNetwork) return;
    setPlasmaApproving(true);
    try {
      const depositAmount = ethers.parseUnits(plasmaDeposit, 6);
      const usdc = new ethers.Contract(MOCK_USDC_ADDRESS, MOCK_USDC_ABI, signer);
      const tx = await usdc.approve(PLASMA_PAYROLL_ADDRESS, depositAmount);
      await tx.wait();
      await loadUsdcBalance();
    } catch (e: any) {
      console.error("Approve error:", e);
      alert("Approve error: " + (e.reason || e.message));
    } finally {
      setPlasmaApproving(false);
    }
  };

  const handlePlasmaCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !isPlasmaNetwork) return;
    if (!ethers.isAddress(plasmaWorkerAddr)) {
      alert("Invalid Ethereum address");
      return;
    }
    setPlasmaCreating(true);
    try {
      const contract = new ethers.Contract(PLASMA_PAYROLL_ADDRESS, PLASMA_PAYROLL_ABI, signer);
      const depositAmount = ethers.parseUnits(plasmaDeposit, 6);
      const rateAmount = ethers.parseUnits(plasmaUsdcRate, 6);
      const tx = await contract.createStream(
        plasmaWorkerAddr,
        rateAmount,
        parseInt(plasmaInterval),
        depositAmount
      );
      await tx.wait();
      await loadPlasmaStreams();
      await loadUsdcBalance();
    } catch (e: any) {
      console.error("Plasma create error:", e);
      alert("Error: " + (e.reason || e.message));
    } finally {
      setPlasmaCreating(false);
    }
  };

  const handlePlasmaEnd = async (streamId: number) => {
    if (!signer || !isPlasmaNetwork) return;
    setPlasmaEnding(streamId);
    try {
      const contract = new ethers.Contract(PLASMA_PAYROLL_ADDRESS, PLASMA_PAYROLL_ABI, signer);
      const tx = await contract.endStream(streamId);
      await tx.wait();
      await loadPlasmaStreams();
      await loadUsdcBalance();
    } catch (e: any) {
      console.error("Plasma end error:", e);
      alert("Error: " + (e.reason || e.message));
    } finally {
      setPlasmaEnding(null);
    }
  };

  // --- Guards ---
  if (!address) {
    return (
      <div className="page">
        <div className="card">
          <h2>Employer Dashboard</h2>
          <p className="muted">Connect your wallet to create payment streams.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }} onClick={() => localStorage.removeItem("instantPayrollUser")}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const needsDepositParsed = (() => {
    try { return ethers.parseUnits(plasmaDeposit, 6); } catch { return 0n; }
  })();
  const needsApproval = needsDepositParsed > usdcAllowance;

  return (
    <div className="page">
      {/* Top-level payroll tab bar */}
      <div className="payroll-tabs">
        <button
          className={`tab ${payrollTab === "flare" ? "tab-active" : ""}`}
          onClick={() => setPayrollTab("flare")}
        >
          Flare Payroll
        </button>
        <button
          className={`tab ${payrollTab === "plasma" ? "tab-active" : ""}`}
          onClick={() => setPayrollTab("plasma")}
        >
          Plasma Payroll (USDC)
        </button>
      </div>

      {/* ============ FLARE TAB ============ */}
      {payrollTab === "flare" && (
        <>
          {!isFlareNetwork && activeNetwork !== "unknown" && (
            <div className="network-banner">
              You are on {activeNetwork === "plasma" ? "Plasma" : "another"} network.{" "}
              <button className="btn btn-warning" onClick={switchToFlare}>Switch to Flare</button>
            </div>
          )}

          <div className="card">
            <h2>Create Payment Stream</h2>
            {price && (
              <p className="price-ticker">
                FLR/USD: ${price.price}
              </p>
            )}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Worker Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={workerAddr}
                  onChange={(e) => setWorkerAddr(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>USD per Interval</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={usdRate}
                    onChange={(e) => setUsdRate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Claim Interval (sec)</label>
                  <input
                    type="number"
                    min="10"
                    value={interval}
                    onChange={(e) => setInterval_(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Deposit ({CURRENCY_SYMBOL})</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={creating || !isFlareNetwork}
              >
                {creating ? "Creating Stream..." : "Create Stream"}
              </button>
              {txHash && (
                <p className="tx-link">
                  TX: <a href={`${FLARE_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash.slice(0, 10)}...</a>
                </p>
              )}
            </form>
          </div>

          <div className="card">
            <h2>Your Streams {loading && <span className="spinner" />}</h2>
            {streams.length === 0 && !loading && (
              <p className="muted">No streams found.</p>
            )}
            {streams.map((s) => (
              <div key={s.id} className={`stream-card ${s.active ? "active" : "ended"}`}>
                <div className="stream-header">
                  <span className="stream-id">Stream #{s.id}</span>
                  <span className={`badge ${s.active ? "badge-active" : "badge-ended"}`}>
                    {s.active ? "Active" : "Ended"}
                  </span>
                </div>
                <div className="stream-details">
                  <div><strong>Worker:</strong> {s.worker.slice(0, 8)}...{s.worker.slice(-6)}</div>
                  <div><strong>Rate:</strong> ${ethers.formatEther(s.usdRatePerInterval)} / {s.claimInterval.toString()}s</div>
                  <div><strong>Deposited:</strong> {ethers.formatEther(s.totalDeposit)} {CURRENCY_SYMBOL}</div>
                  <div><strong>Claimed:</strong> {ethers.formatEther(s.totalClaimed)} {CURRENCY_SYMBOL}</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Number(s.totalDeposit) > 0 ? (Number(s.totalClaimed) * 100) / Number(s.totalDeposit) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                {s.active && (
                  <button className="btn btn-danger" onClick={() => handleEnd(s.id)} disabled={ending === s.id || !isFlareNetwork}>
                    {ending === s.id ? "Ending..." : "End Stream"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ PLASMA TAB ============ */}
      {payrollTab === "plasma" && (
        <>
          {!isPlasmaNetwork && (
            <div className="network-banner">
              Switch to Plasma network to create USDC streams.{" "}
              <button className="btn btn-warning" onClick={switchToPlasma}>Switch to Plasma</button>
            </div>
          )}

          {!PLASMA_PAYROLL_ADDRESS || !MOCK_USDC_ADDRESS ? (
            <div className="card">
              <h2>Plasma Payroll (USDC)</h2>
              <p className="muted">
                Deploy PlasmaPayroll and MockUSDC contracts first, then set
                VITE_PLASMA_PAYROLL_ADDRESS and VITE_MOCK_USDC_ADDRESS in your .env.
              </p>
            </div>
          ) : (
            <>
              {/* USDC Balance Card */}
              <div className="card">
                <h2>USDC Balance</h2>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-label">Balance</div>
                    <div className="stat-value">{ethers.formatUnits(usdcBalance, 6)} USDC</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Allowance</div>
                    <div className="stat-value">{ethers.formatUnits(usdcAllowance, 6)} USDC</div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={handleFaucet}
                  disabled={fauceting || !isPlasmaNetwork}
                >
                  {fauceting ? "Minting..." : "Get Test USDC (10,000)"}
                </button>
              </div>

              {/* Create USDC Stream */}
              <div className="card">
                <h2>Create USDC Stream</h2>
                <form onSubmit={handlePlasmaCreate}>
                  <div className="form-group">
                    <label>Worker Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={plasmaWorkerAddr}
                      onChange={(e) => setPlasmaWorkerAddr(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>USDC per Interval</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={plasmaUsdcRate}
                        onChange={(e) => setPlasmaUsdcRate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Claim Interval (sec)</label>
                      <input
                        type="number"
                        min="10"
                        value={plasmaInterval}
                        onChange={(e) => setPlasmaInterval_(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Total Deposit (USDC)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={plasmaDeposit}
                      onChange={(e) => setPlasmaDeposit(e.target.value)}
                      required
                    />
                  </div>
                  {needsApproval ? (
                    <button
                      type="button"
                      className="btn btn-warning btn-full"
                      onClick={handleApproveUsdc}
                      disabled={plasmaApproving || !isPlasmaNetwork}
                    >
                      {plasmaApproving ? "Approving..." : `Approve ${plasmaDeposit} USDC`}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary btn-full"
                      disabled={plasmaCreating || !isPlasmaNetwork}
                    >
                      {plasmaCreating ? "Creating Stream..." : "Create USDC Stream"}
                    </button>
                  )}
                </form>
              </div>

              {/* Plasma Streams */}
              <div className="card">
                <h2>Plasma Streams {plasmaLoading && <span className="spinner" />}</h2>
                {plasmaStreams.length === 0 && !plasmaLoading && (
                  <p className="muted">No USDC streams found.</p>
                )}
                {plasmaStreams.map((s) => (
                  <div key={s.id} className={`stream-card ${s.active ? "active" : "ended"}`}>
                    <div className="stream-header">
                      <span className="stream-id">Stream #{s.id}</span>
                      <span className={`badge ${s.active ? "badge-active" : "badge-ended"}`}>
                        {s.active ? "Active" : "Ended"}
                      </span>
                    </div>
                    <div className="stream-details">
                      <div><strong>Worker:</strong> {s.worker.slice(0, 8)}...{s.worker.slice(-6)}</div>
                      <div><strong>Rate:</strong> {ethers.formatUnits(s.usdcPerInterval, 6)} USDC / {s.claimInterval.toString()}s</div>
                      <div><strong>Deposited:</strong> {ethers.formatUnits(s.totalDeposit, 6)} USDC</div>
                      <div><strong>Claimed:</strong> {ethers.formatUnits(s.totalClaimed, 6)} USDC</div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Number(s.totalDeposit) > 0 ? (Number(s.totalClaimed) * 100) / Number(s.totalDeposit) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    {s.active && (
                      <button className="btn btn-danger" onClick={() => handlePlasmaEnd(s.id)} disabled={plasmaEnding === s.id || !isPlasmaNetwork}>
                        {plasmaEnding === s.id ? "Ending..." : "End Stream"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
