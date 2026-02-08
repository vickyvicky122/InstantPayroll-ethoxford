import { Component, useEffect, useRef } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { EmployerPage } from "./components/EmployerPage";
import { WorkerPage } from "./components/WorkerPage";
import { AboutPage } from "./components/AboutPage";
import { useWallet } from "./hooks/useWallet";
import "./App.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("App error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <div className="card" style={{ textAlign: "center", marginTop: 80 }}>
            <h2>Something went wrong</h2>
            <p className="muted">Please refresh the page and try again.</p>
            <button className="btn btn-primary" onClick={() => this.setState({ hasError: false })} style={{ marginTop: 16 }}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STORAGE_KEY = "instantPayrollUser";

function AutoRedirect({ address }: { address: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current || !address) return;
    // Only auto-redirect from homepage, not from /login (user may be switching roles)
    if (location.pathname !== "/") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { role } = JSON.parse(saved);
        if (role === "employer" || role === "worker") {
          hasRedirected.current = true;
          navigate(`/${role}`);
        }
      }
    } catch {
      // ignore invalid localStorage data
    }
  }, [address, navigate, location.pathname]);

  return null;
}

function App() {
  const {
    address, signer, isFlareNetwork,
    connecting, connect, switchToFlare,
  } = useWallet();

  return (
    <BrowserRouter>
      <div className="app">
        <AutoRedirect address={address} />
        <Header
          address={address}
          connecting={connecting}
          isFlareNetwork={isFlareNetwork}
          onConnect={connect}
          onSwitchFlare={switchToFlare}
        />
        <main className="main">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<AboutPage />} />
              <Route
                path="/login"
                element={<LandingPage onConnect={connect} connecting={connecting} address={address} />}
              />
              <Route
                path="/employer"
                element={
                  <EmployerPage
                    address={address}
                    signer={signer}
                    isFlareNetwork={isFlareNetwork}
                    switchToFlare={switchToFlare}
                  />
                }
              />
              <Route
                path="/worker"
                element={
                  <WorkerPage
                    address={address}
                    signer={signer}
                    isFlareNetwork={isFlareNetwork}
                    switchToFlare={switchToFlare}
                  />
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
        <footer className="footer">
          <span>InstantPayroll | Flare + Plasma | ETH Oxford 2026</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
