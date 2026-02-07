import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { EmployerPage } from "./components/EmployerPage";
import { WorkerPage } from "./components/WorkerPage";
import { useWallet } from "./hooks/useWallet";
import "./App.css";

function App() {
  const { address, signer, isCoston2, connecting, connect, switchToCoston2 } = useWallet();

  return (
    <BrowserRouter>
      <div className="app">
        <Header
          address={address}
          connecting={connecting}
          isCoston2={isCoston2}
          onConnect={connect}
          onSwitchNetwork={switchToCoston2}
        />
        <main className="main">
          <Routes>
            <Route
              path="/"
              element={<EmployerPage address={address} signer={signer} isCoston2={isCoston2} />}
            />
            <Route
              path="/worker"
              element={<WorkerPage address={address} signer={signer} isCoston2={isCoston2} />}
            />
          </Routes>
        </main>
        <footer className="footer">
          <span>InstantPayroll | Flare + Plasma | ETH Oxford 2026</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
