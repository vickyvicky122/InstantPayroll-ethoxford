import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { COSTON2_CHAIN_ID, COSTON2_NETWORK } from "../config";

export function useWallet() {
  const [address, setAddress] = useState<string>("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number>(0);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask");
      return;
    }
    setConnecting(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
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
  }, []);

  const switchToCoston2 = useCallback(async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: COSTON2_NETWORK.chainId }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [COSTON2_NETWORK],
        });
      }
    }
    // Reconnect after switch
    await connect();
  }, [connect]);

  useEffect(() => {
    if (!(window as any).ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress("");
        setSigner(null);
      } else {
        connect();
      }
    };
    const handleChainChanged = () => connect();

    (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
    (window as any).ethereum.on("chainChanged", handleChainChanged);
    return () => {
      (window as any).ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      (window as any).ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect]);

  const isCoston2 = chainId === COSTON2_CHAIN_ID;

  return { address, signer, chainId, isCoston2, connecting, connect, switchToCoston2 };
}
