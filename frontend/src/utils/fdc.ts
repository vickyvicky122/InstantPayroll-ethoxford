import { ethers } from "ethers";

// --- Constants ---

const VERIFIER_URL = "/api/fdc-verifier";
const VERIFIER_API_KEY = "00000000-0000-0000-0000-000000000000";
const DA_LAYER_URL = "/api/da-layer";

const FLARE_CONTRACT_REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

// Minimal ABIs (human-readable)
const REGISTRY_ABI = ["function getContractAddressByName(string) view returns (address)"];
const FDC_HUB_ABI = ["function requestAttestation(bytes) payable"];
const FEE_CONFIG_ABI = ["function getRequestFee(bytes) view returns (uint256)"];
const SYSTEMS_MANAGER_ABI = [
  "function firstVotingRoundStartTs() view returns (uint64)",
  "function votingEpochDurationSeconds() view returns (uint64)",
];
const RELAY_ABI = ["function isFinalized(uint256, uint256) view returns (bool)"];
const FDC_VERIFICATION_ABI = ["function fdcProtocolId() view returns (uint256)"];

// --- Helpers ---

function toHex(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += data.charCodeAt(i).toString(16);
  }
  return result.padEnd(64, "0");
}

function toUtf8HexString(data: string): string {
  return "0x" + toHex(data);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Contract helpers ---

async function getContractAddress(
  provider: ethers.Provider,
  name: string
): Promise<string> {
  const registry = new ethers.Contract(FLARE_CONTRACT_REGISTRY_ADDRESS, REGISTRY_ABI, provider);
  return await registry.getContractAddressByName(name);
}

// --- FDC Flow ---

export type FdcProgressCallback = (message: string) => void;

/**
 * Step 1: Prepare a GitHub attestation request via the FDC verifier API.
 */
export async function prepareGitHubAttestationRequest(
  repo: string,
  since?: string
): Promise<{ abiEncodedRequest: string }> {
  const sinceParam = since ? `?since=${since}` : "";
  const apiUrl = `https://api.github.com/repos/${repo}/commits${sinceParam}`;

  const postProcessJq = `{commitCount: . | length}`;
  const abiSignature = `{"components": [{"internalType": "uint256", "name": "commitCount", "type": "uint256"}], "name": "task", "type": "tuple"}`;

  const attestationType = toUtf8HexString("Web2Json");
  const sourceId = toUtf8HexString("PublicWeb2");

  const request = {
    attestationType,
    sourceId,
    requestBody: {
      url: apiUrl,
      httpMethod: "GET",
      headers: "{}",
      queryParams: "{}",
      body: "{}",
      postProcessJq,
      abiSignature,
    },
  };

  const url = `${VERIFIER_URL}/verifier/web2/Web2Json/prepareRequest`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": VERIFIER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Verifier error: ${response.status} ${response.statusText} — ${text}`);
  }

  return await response.json();
}

/**
 * Step 2: Submit the attestation request to FdcHub and return the roundId.
 */
export async function submitAttestationRequest(
  signer: ethers.Signer,
  abiEncodedRequest: string
): Promise<number> {
  const provider = signer.provider!;

  // Resolve contract addresses
  const [fdcHubAddress, feeConfigAddress, systemsManagerAddress] = await Promise.all([
    getContractAddress(provider, "FdcHub"),
    getContractAddress(provider, "FdcRequestFeeConfigurations"),
    getContractAddress(provider, "FlareSystemsManager"),
  ]);

  // Get request fee
  const feeConfig = new ethers.Contract(feeConfigAddress, FEE_CONFIG_ABI, provider);
  const requestFee: bigint = await feeConfig.getRequestFee(abiEncodedRequest);

  // Submit attestation
  const fdcHub = new ethers.Contract(fdcHubAddress, FDC_HUB_ABI, signer);
  const tx = await fdcHub.requestAttestation(abiEncodedRequest, { value: requestFee });
  const receipt = await tx.wait();

  // Calculate roundId from block timestamp
  const block = await provider.getBlock(receipt!.blockNumber);
  const blockTimestamp = BigInt(block!.timestamp);

  const systemsManager = new ethers.Contract(systemsManagerAddress, SYSTEMS_MANAGER_ABI, provider);
  const firstVotingRoundStartTs = BigInt(await systemsManager.firstVotingRoundStartTs());
  const votingEpochDurationSeconds = BigInt(await systemsManager.votingEpochDurationSeconds());

  const roundId = Number((blockTimestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds);
  return roundId;
}

/**
 * Step 3: Wait for the voting round to be finalized on-chain.
 */
export async function waitForFinalization(
  provider: ethers.Provider,
  roundId: number,
  onProgress?: FdcProgressCallback
): Promise<void> {
  const [relayAddress, fdcVerificationAddress] = await Promise.all([
    getContractAddress(provider, "Relay"),
    getContractAddress(provider, "FdcVerification"),
  ]);

  const relay = new ethers.Contract(relayAddress, RELAY_ABI, provider);
  const fdcVerification = new ethers.Contract(fdcVerificationAddress, FDC_VERIFICATION_ABI, provider);
  const protocolId: bigint = await fdcVerification.fdcProtocolId();

  const startTime = Date.now();
  while (true) {
    const finalized = await relay.isFinalized(protocolId, roundId);
    if (finalized) break;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onProgress?.(`Waiting for round finalization... (${elapsed}s elapsed)`);
    await sleep(10000);
  }
}

/**
 * Step 4: Retrieve the proof from the DA layer.
 */
export async function retrieveProof(
  abiEncodedRequest: string,
  roundId: number,
  onProgress?: FdcProgressCallback
): Promise<{ proof: string[]; response_hex: string }> {
  const url = `${DA_LAYER_URL}/api/v1/fdc/proof-by-request-round-raw`;

  const request = {
    votingRoundId: roundId,
    requestBytes: abiEncodedRequest,
  };

  // Initial wait for DA layer to process
  await sleep(10000);

  let proof = await postToDALayer(url, request);
  while (proof.response_hex === undefined) {
    onProgress?.("Waiting for DA layer to generate proof...");
    await sleep(10000);
    proof = await postToDALayer(url, request);
  }

  return proof;
}

async function postToDALayer(url: string, request: object): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return await response.json();
}

/**
 * Step 5: Decode the proof response_hex into the struct needed by claim().
 */
export function decodeProof(responseHex: string): object {
  // The response_hex encodes an IWeb2Json.Response struct.
  // We decode it using the ABI types matching the contract's expected Proof.data structure.
  const responseType =
    "tuple(bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, " +
    "tuple(string url, string httpMethod, string headers, string queryParams, string body, string postProcessJq, string abiSignature) requestBody, " +
    "tuple(bytes abiEncodedData) responseBody)";

  const coder = ethers.AbiCoder.defaultAbiCoder();
  const decoded = coder.decode([responseType], responseHex);
  return decoded[0];
}

/**
 * Build the full proof object for the claim() contract call.
 */
export function buildClaimProof(
  merkleProof: string[],
  responseHex: string
): { merkleProof: string[]; data: object } {
  const data = decodeProof(responseHex);
  return { merkleProof, data };
}

/**
 * Step 1 (Google Docs variant): Prepare an attestation request using Google Drive Revisions API.
 * Counts document revisions as the commitCount for FDC proof.
 */
export async function prepareGoogleDocsAttestationRequest(
  fileId: string,
  accessToken: string
): Promise<{ abiEncodedRequest: string }> {
  const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id)`;

  const postProcessJq = `{commitCount: .revisions | length}`;
  const abiSignature = `{"components": [{"internalType": "uint256", "name": "commitCount", "type": "uint256"}], "name": "task", "type": "tuple"}`;

  const attestationType = toUtf8HexString("Web2Json");
  const sourceId = toUtf8HexString("PublicWeb2");

  const request = {
    attestationType,
    sourceId,
    requestBody: {
      url: apiUrl,
      httpMethod: "GET",
      headers: JSON.stringify({ Authorization: "Bearer " + accessToken }),
      queryParams: "{}",
      body: "{}",
      postProcessJq,
      abiSignature,
    },
  };

  const url = `${VERIFIER_URL}/verifier/web2/Web2Json/prepareRequest`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": VERIFIER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Verifier error: ${response.status} ${response.statusText} — ${text}`);
  }

  return await response.json();
}
