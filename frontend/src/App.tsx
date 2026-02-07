import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { EmployerPage } from "./components/EmployerPage";
import { WorkerPage } from "./components/WorkerPage";
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

function App() {
  const { address, signer, isCorrectNetwork, connecting, connect, switchToFlare, networkName } = useWallet();

  return (
    <BrowserRouter>
      <div className="app">
        <Header
          address={address}
          connecting={connecting}
          isCorrectNetwork={isCorrectNetwork}
          networkName={networkName}
          onConnect={connect}
          onSwitchNetwork={switchToFlare}
        />
        <main className="main">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={<LandingPage onConnect={connect} connecting={connecting} address={address} />}
              />
              <Route
                path="/employer"
                element={<EmployerPage address={address} signer={signer} isCorrectNetwork={isCorrectNetwork} />}
              />
              <Route
                path="/worker"
                element={<WorkerPage address={address} signer={signer} isCorrectNetwork={isCorrectNetwork} />}
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
