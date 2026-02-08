import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  address: string;
  connecting: boolean;
  isFlareNetwork: boolean;
  isPlasmaNetwork: boolean;
  activeNetwork: "flare" | "plasma" | "unknown";
  networkName: string;
  onConnect: () => void;
  onSwitchFlare: () => void;
  onSwitchPlasma: () => void;
}

export function Header({
  address, connecting, isFlareNetwork, isPlasmaNetwork, activeNetwork,
  onConnect, onSwitchFlare, onSwitchPlasma,
}: HeaderProps) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 className="logo"><span className="logo-mark" />InstantPayroll</h1>
        </Link>
        {!isLanding && (
          <nav className="nav">
            <Link to="/employer" className={location.pathname === "/employer" ? "active" : ""}>
              Employer
            </Link>
            <Link to="/worker" className={location.pathname === "/worker" ? "active" : ""}>
              Worker
            </Link>
            <Link to="/about" className={location.pathname === "/about" ? "active" : ""}>
              About
            </Link>
          </nav>
        )}
      </div>
      {!isLanding && (
        <div className="header-right">
          {address && (
            <div className="network-switcher">
              <button
                className={`network-btn ${isFlareNetwork ? "network-btn-active" : ""}`}
                onClick={onSwitchFlare}
              >
                Flare
              </button>
              <button
                className={`network-btn ${isPlasmaNetwork ? "network-btn-active" : ""}`}
                onClick={onSwitchPlasma}
              >
                Plasma
              </button>
              {activeNetwork === "unknown" && (
                <span className="network-btn" style={{ color: "var(--warning)", cursor: "default" }}>
                  Wrong Network
                </span>
              )}
            </div>
          )}
          {address ? (
            <span className="wallet-address">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          ) : (
            <button className="btn btn-primary" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
