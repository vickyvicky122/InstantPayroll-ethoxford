import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

interface LandingPageProps {
  onConnect: () => void;
  connecting: boolean;
  address: string;
}

type Role = "employer" | "worker";

const STORAGE_KEY = "instantPayrollUser";

export function LandingPage({ onConnect, connecting, address }: LandingPageProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();
  const hasAutoRedirected = useRef(false);

  // Auto-redirect if wallet already connected + profile exists
  useEffect(() => {
    if (hasAutoRedirected.current) return;
    if (!address) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { role } = JSON.parse(saved);
        if (role === "employer" || role === "worker") {
          hasAutoRedirected.current = true;
          navigate(`/${role}`);
        }
      }
    } catch {
      // ignore invalid localStorage data
    }
  }, [address, navigate]);

  // After wallet connects during the flow, save profile and navigate
  useEffect(() => {
    if (!address || !selectedRole || !displayName.trim()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: selectedRole, displayName: displayName.trim() }));
    navigate(`/${selectedRole}`);
  }, [address, selectedRole, displayName, navigate]);

  function handleContinue() {
    if (!displayName.trim()) return;
    if (address) {
      // Wallet already connected — save and go
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: selectedRole, displayName: displayName.trim() }));
      navigate(`/${selectedRole}`);
    } else {
      onConnect();
    }
  }

  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="landing-title">
          Connecting people who build with people who pay — in real time
        </h1>
        <p className="landing-subtitle">
          Stream salaries on Flare. Claim earnings instantly. Verify work on-chain.
        </p>
      </div>

      <div className="role-grid">
        <button
          className={`role-card${selectedRole === "employer" ? " role-card-selected" : ""}`}
          onClick={() => setSelectedRole("employer")}
        >
          <span className="role-emoji">🏢</span>
          <h2 className="role-title">I am an Employer</h2>
          <p className="role-desc">Create payment streams and pay your workers</p>

          {selectedRole === "employer" && (
            <div className="role-form" onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleContinue}
                disabled={!displayName.trim() || connecting}
              >
                {connecting ? (
                  <><span className="spinner" /> Connecting...</>
                ) : address ? (
                  "Continue"
                ) : (
                  "Connect Wallet & Continue"
                )}
              </button>
            </div>
          )}
        </button>

        <button
          className={`role-card${selectedRole === "worker" ? " role-card-selected" : ""}`}
          onClick={() => setSelectedRole("worker")}
        >
          <span className="role-emoji">👷</span>
          <h2 className="role-title">I am a Worker</h2>
          <p className="role-desc">Claim payments and verify your work</p>

          {selectedRole === "worker" && (
            <div className="role-form" onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  autoFocus
                />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleContinue}
                disabled={!displayName.trim() || connecting}
              >
                {connecting ? (
                  <><span className="spinner" /> Connecting...</>
                ) : address ? (
                  "Continue"
                ) : (
                  "Connect Wallet & Continue"
                )}
              </button>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
