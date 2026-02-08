import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import {
  INSTANT_PAYROLL_ADDRESS,
  INSTANT_PAYROLL_ABI,
  flareProvider,
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

interface EmployerPageProps {
  address: string;
  signer: ethers.Signer | null;
  isFlareNetwork: boolean;
  switchToFlare: () => void;
}

export function EmployerPage({
  address, signer, isFlareNetwork, switchToFlare,
}: EmployerPageProps) {
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
  const [displayName, setDisplayName] = useState(() => {
    const name = localStorage.getItem("instantPayroll_employer_name");
    if (name) return name;
    try { const u = JSON.parse(localStorage.getItem("instantPayrollUser") || ""); return u?.role === "employer" ? (u?.displayName || "") : ""; } catch { return ""; }
  });
  const [nameInput, setNameInput] = useState("");
  const [flrBalance, setFlrBalance] = useState<string | null>(null);

  const readContract = useMemo(
    () => INSTANT_PAYROLL_ADDRESS ? new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, flareProvider) : null,
    []
  );

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

  const loadBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await flareProvider.getBalance(address);
      setFlrBalance(parseFloat(ethers.formatEther(bal)).toFixed(2));
    } catch (e) { console.error("Balance error:", e); }
  }, [address]);

  const accountStats = useMemo(() => {
    const active = streams.filter(s => s.active);
    const activeCount = active.length;
    const totalDeposited = streams.reduce((sum, s) => sum + s.totalDeposit, 0n);
    const remainingEscrow = active.reduce((sum, s) => sum + (s.totalDeposit - s.totalClaimed), 0n);
    return { activeCount, totalDeposited, remainingEscrow };
  }, [streams]);

  useEffect(() => {
    loadStreams();
    loadPrice();
    loadBalance();
    const timer = setInterval(() => {
      loadPrice();
      loadBalance();
    }, 15000);
    return () => clearInterval(timer);
  }, [loadStreams, loadPrice, loadBalance]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !isFlareNetwork) return;
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
    if (!signer || !isFlareNetwork) return;
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

  if (!address) {
    return (
      <div className="page">
        <div className="card">
          <h2>Employer Dashboard</h2>
          <p className="muted">Connect your wallet to create payment streams.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Connect Wallet
          </Link>
        </div>
      </div>
    );
  }

  if (!displayName) {
    const handleSetName = () => {
      if (!nameInput.trim()) return;
      const name = nameInput.trim();
      localStorage.setItem("instantPayroll_employer_name", name);
      localStorage.setItem("instantPayrollUser", JSON.stringify({ role: "employer", displayName: name }));
      setDisplayName(name);
    };
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
          <h2>Employer Dashboard</h2>
          <p className="muted" style={{ marginBottom: 16 }}>Enter your name to continue.</p>
          <input
            type="text"
            className="input"
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            autoFocus
            style={{ width: "100%", marginBottom: 12 }}
          />
          <button
            className="btn btn-primary btn-full"
            onClick={handleSetName}
            disabled={!nameInput.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {!isFlareNetwork && (
        <div className="network-banner">
          Switch to Flare network to manage streams.{" "}
          <button className="btn btn-warning" onClick={switchToFlare}>Switch to Flare</button>
        </div>
      )}

      {/* Account Header */}
      <div className="card account-header">
        <div className="account-greeting">
          {displayName ? `Welcome, ${displayName}` : "Employer Dashboard"}
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
            <div className="stat-label">Active Streams</div>
            <div className="stat-value">{accountStats.activeCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Deposited</div>
            <div className="stat-value">{parseFloat(ethers.formatEther(accountStats.totalDeposited)).toFixed(2)} {CURRENCY_SYMBOL}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining Escrow</div>
            <div className="stat-value">{parseFloat(ethers.formatEther(accountStats.remainingEscrow)).toFixed(2)} {CURRENCY_SYMBOL}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Create Payment Stream</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Deposit FLR as escrow. Worker claims by proving GitHub commits or Google Docs edits via FDC.
          Receipts are stored for free on Plasma.
        </p>
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
    </div>
  );
}
