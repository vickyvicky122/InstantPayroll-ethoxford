import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  address: string;
  connecting: boolean;
  isCorrectNetwork: boolean;
  networkName: string;
  onConnect: () => void;
  onSwitchNetwork: () => void;
}

export function Header({ address, connecting, isCorrectNetwork, networkName, onConnect, onSwitchNetwork }: HeaderProps) {
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
          </nav>
        )}
      </div>
      {!isLanding && (
        <div className="header-right">
          {address && !isCorrectNetwork && (
            <button className="btn btn-warning" onClick={onSwitchNetwork}>
              Switch to {networkName}
            </button>
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
