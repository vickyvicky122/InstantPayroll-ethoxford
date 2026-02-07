import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  INSTANT_PAYROLL_ADDRESS,
  INSTANT_PAYROLL_ABI,
  flareProvider,
  COSTON2_EXPLORER,
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
  isCoston2: boolean;
}

export function EmployerPage({ address, signer, isCoston2 }: EmployerPageProps) {
  const [workerAddr, setWorkerAddr] = useState("");
  const [usdRate, setUsdRate] = useState("0.5");
  const [interval, setInterval_] = useState("60");
  const [deposit, setDeposit] = useState("10");
  const [creating, setCreating] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<{ price: string; decimals: number } | null>(null);

  const readContract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, flareProvider);

  const loadStreams = useCallback(async () => {
    if (!address || !INSTANT_PAYROLL_ADDRESS) return;
    setLoading(true);
    try {
      const nextId = await readContract.nextStreamId();
      const found: Stream[] = [];
      for (let i = 0; i < Number(nextId); i++) {
        const s = await readContract.getStream(i);
        if (s.employer.toLowerCase() === address.toLowerCase()) {
          found.push({
            id: i,
            employer: s.employer,
            worker: s.worker,
            usdRatePerInterval: s.usdRatePerInterval,
            claimInterval: s.claimInterval,
            totalDeposit: s.totalDeposit,
            totalClaimed: s.totalClaimed,
            lastClaimTime: s.lastClaimTime,
            createdAt: s.createdAt,
            active: s.active,
          });
        }
      }
      setStreams(found);
    } catch (e: any) {
      console.error("Load streams error:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const loadPrice = useCallback(async () => {
    if (!INSTANT_PAYROLL_ADDRESS) return;
    try {
      const result = await readContract.getCurrentPrice();
      setPrice({
        price: ethers.formatUnits(result.price, Number(result.decimals)),
        decimals: Number(result.decimals),
      });
    } catch (e: any) {
      console.error("Price error:", e);
    }
  }, []);

  useEffect(() => {
    loadStreams();
    loadPrice();
    const timer = setInterval(() => {
      loadPrice();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadStreams, loadPrice]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !isCoston2) return;

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
    if (!signer || !isCoston2) return;
    try {
      const contract = new ethers.Contract(INSTANT_PAYROLL_ADDRESS, INSTANT_PAYROLL_ABI, signer);
      const tx = await contract.endStream(streamId);
      await tx.wait();
      await loadStreams();
    } catch (e: any) {
      console.error("End stream error:", e);
      alert("Error: " + (e.reason || e.message));
    }
  };

  if (!address) {
    return (
      <div className="page">
        <div className="card">
          <h2>Employer Dashboard</h2>
          <p className="muted">Connect your wallet to create payment streams.</p>
        </div>
      </div>
    );
  }

  if (!INSTANT_PAYROLL_ADDRESS) {
    return (
      <div className="page">
        <div className="card">
          <h2>Employer Dashboard</h2>
          <p className="muted">Set VITE_INSTANT_PAYROLL_ADDRESS in your .env to connect to the contract.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
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
            <label>Deposit (C2FLR)</label>
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
            disabled={creating || !isCoston2}
          >
            {creating ? "Creating Stream..." : "Create Stream"}
          </button>
          {txHash && (
            <p className="tx-link">
              TX: <a href={`${COSTON2_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash.slice(0, 10)}...</a>
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
              <div><strong>Deposited:</strong> {ethers.formatEther(s.totalDeposit)} C2FLR</div>
              <div><strong>Claimed:</strong> {ethers.formatEther(s.totalClaimed)} C2FLR</div>
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
              <button className="btn btn-danger" onClick={() => handleEnd(s.id)}>
                End Stream
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
