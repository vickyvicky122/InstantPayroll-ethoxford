import { Link, useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
  address: string;
  connecting: boolean;
  isFlareNetwork: boolean;
  onConnect: () => void;
  onSwitchFlare: () => void;
}

export function Header({
  address, connecting, isFlareNetwork,
  onConnect, onSwitchFlare,
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("instantPayrollUser");
    navigate("/login");
  };
  const isHomepage = location.pathname === "/";
  const isLogin = location.pathname === "/login";
  const isDashboard = location.pathname === "/employer" || location.pathname === "/worker";

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 className="logo"><span className="logo-mark" />InstantPayroll</h1>
        </Link>
        {isDashboard && (
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
      <div className="header-right">
        <a
          href="https://github.com/vickyvicky122/InstantPayroll-ethoxford"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="View on GitHub"
        >
          <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
        {isHomepage && (
          <Link to="/login" className="btn btn-primary">
            Log In
          </Link>
        )}
        {isLogin && (
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        )}
        {isDashboard && (
          <>
            {address && !isFlareNetwork && (
              <button className="btn btn-warning btn-sm" onClick={onSwitchFlare}>
                Switch to Flare
              </button>
            )}
            {address && isFlareNetwork && (
              <span className="network-badge">Flare</span>
            )}
            {address ? (
              <>
                <span className="wallet-address">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={onConnect} disabled={connecting}>
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
