InstantPayroll — Verified Payroll on Flare | ETH Oxford 2026

Money should move as fast as work does.

InstantPayroll is a real-time payroll system where payments stream continuously — but money only moves when work is cryptographically proven on-chain. Built on Flare and Plasma at ETH Oxford 2026.

How it works:
1. Employer deposits FLR into an escrow stream with a USD rate
2. Worker proves work (GitHub commits or Google Docs edits) via Flare's FDC attestation
3. Smart contract verifies the proof, converts USD to FLR using live FTSO pricing, rolls a bonus lottery via Secure Random, and pays the worker — all in one transaction
4. Every payment receipt is bridged to Plasma for free permanent storage

Three Flare enshrined protocols in one claim() transaction:
- FDC (Flare Data Connector) — verifies GitHub commits through ~100 independent attestation providers reaching consensus
- FTSO v2 — live FLR/USD price oracle for USD-denominated pay
- Secure Random v2 — provably fair 1-in-10 bonus lottery (2x payout)

Why two chains?
- Flare — computation, verification, and payment (FTSO + FDC + Secure Random)
- Plasma — zero-fee permanent receipt storage via a cross-chain relayer

No third-party oracles. No extra trust assumptions. No separate fees.

Links:
Live demo: https://flare-psi.vercel.app
GitHub: https://github.com/vickyvicky122/InstantPayroll-ethoxford
Flare Coston2 contract: https://coston2-explorer.flare.network/address/0xcdACc7626de63B86C63b4F97EA7AfbB3610D927e
Plasma Testnet contract: https://testnet.plasmascan.to/address/0xe8B2dBb78b7A29d3D9E52Cc7Fdf02828Fa02a9c4

Prerequisites to try the demo:
- Chrome with MetaMask extension
- Flare Coston2 testnet (Chain ID 114) added to MetaMask
- Testnet C2FLR from https://faucet.flare.network/coston2

Tech stack: Solidity, Hardhat, React, TypeScript, ethers.js v6, Vite, Flare Coston2, Plasma Testnet

Built at ETH Oxford 2026.

#Flare #ETHOxford #Web3 #DeFi #Payroll #Hackathon #FDC #FTSO #Plasma #SmartContracts #Ethereum
