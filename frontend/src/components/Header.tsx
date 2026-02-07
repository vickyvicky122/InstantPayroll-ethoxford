import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  address: string;
  connecting: boolean;
  isCoston2: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
}

export function Header({ address, connecting, isCoston2, onConnect, onSwitchNetwork }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">InstantPayroll</h1>
        <nav className="nav">
          <Link to="/" className={location.pathname === "/" ? "active" : ""}>
            Employer
          </Link>
          <Link to="/worker" className={location.pathname === "/worker" ? "active" : ""}>
            Worker
          </Link>
        </nav>
      </div>
      <div className="header-right">
        {address && !isCoston2 && (
          <button className="btn btn-warning" onClick={onSwitchNetwork}>
            Switch to Coston2
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
    </header>
  );
}
