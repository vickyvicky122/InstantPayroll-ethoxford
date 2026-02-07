import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { COSTON2_CHAIN_ID, COSTON2_NETWORK } from "../config";

export function useWallet() {
  const [address, setAddress] = useState<string>("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [connecting, setConnecting] = useState(false);

  const getProvider = useCallback(() => {
    // Check standard window.ethereum
    if ((window as any).ethereum) return (window as any).ethereum;
    // Check for MetaMask-specific provider (when multiple wallets installed)
    if ((window as any).ethereum?.providers) {
      return (window as any).ethereum.providers.find((p: any) => p.isMetaMask) || null;
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    const eth = getProvider();
    if (!eth) {
      alert("No wallet detected. Please install MetaMask or another Web3 wallet and refresh the page.");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(eth);
      await provider.send("eth_requestAccounts", []);
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      const network = await provider.getNetwork();

      setAddress(addr);
      setSigner(s);
      setChainId(Number(network.chainId));
    } catch (e: any) {
      console.error("Connect error:", e);
    } finally {
      setConnecting(false);
    }
  }, [getProvider]);

  const switchToCoston2 = useCallback(async () => {
    const eth = getProvider();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: COSTON2_NETWORK.chainId }],
      });
      await connect();
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [COSTON2_NETWORK],
          });
          await connect();
        } catch (addErr: any) {
          console.error("Failed to add Coston2 network:", addErr);
        }
      } else {
        console.error("Failed to switch network:", err);
      }
    }
  }, [connect, getProvider]);

  // Auto-reconnect if wallet is already authorized (no popup)
  useEffect(() => {
    const eth = getProvider();
    if (!eth) return;
    eth.request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts.length > 0) connect();
      })
      .catch(() => {});
  }, [connect, getProvider]);

  // Listen for account/chain changes
  useEffect(() => {
    const eth = getProvider();
    if (!eth) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress("");
        setSigner(null);
      } else {
        connect();
      }
    };
    const handleChainChanged = () => connect();

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect, getProvider]);

  const isCoston2 = chainId === COSTON2_CHAIN_ID;

  return { address, signer, chainId, isCoston2, connecting, connect, switchToCoston2 };
}
