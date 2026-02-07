import { web3 } from "hardhat";
import {
    prepareAttestationRequestBase,
    submitAttestationRequest,
    retrieveDataAndProofWithRetry,
} from "./utils/fdc";

/**
 * FDC GitHub Attestation Script
 *
 * Uses FDC Web2Json to verify GitHub commits for a repo.
 * The JQ filter counts commits since a given timestamp.
 *
 * Usage:
 *   GITHUB_REPO=owner/repo SINCE_TIMESTAMP=2026-02-07T00:00:00Z \
 *   npx hardhat run scripts/fdcGithub.ts --network coston2
 */

const {
    VERIFIER_URL_TESTNET = "https://fdc-verifiers-testnet.flare.network",
    VERIFIER_API_KEY_TESTNET = "00000000-0000-0000-0000-000000000000",
    COSTON2_DA_LAYER_URL = "https://ctn2-data-availability.flare.network",
    GITHUB_REPO = "",
    SINCE_TIMESTAMP = "",
} = process.env;

const INSTANT_PAYROLL_ADDRESS = process.env.INSTANT_PAYROLL_ADDRESS || "";
const STREAM_ID = process.env.STREAM_ID || "0";

// FDC configuration
const attestationTypeBase = "Web2Json";
const sourceIdBase = "PublicWeb2";

async function prepareGitHubAttestationRequest() {
    // GitHub API: get commits for repo, optionally since a timestamp
    const sinceParam = SINCE_TIMESTAMP ? `?since=${SINCE_TIMESTAMP}` : "";
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/commits${sinceParam}`;

    // JQ filter: count the number of commits returned
    // GitHub API returns an array of commit objects, we count them
    const postProcessJq = `{commitCount: . | length}`;

    // ABI signature: just a uint256 for the commit count
    const abiSignature = `{"components": [{"internalType": "uint256", "name": "commitCount", "type": "uint256"}], "name": "task", "type": "tuple"}`;

    const requestBody = {
        url: apiUrl,
        httpMethod: "GET",
        headers: "{}",
        queryParams: "{}",
        body: "{}",
        postProcessJq: postProcessJq,
        abiSignature: abiSignature,
    };

    const url = `${VERIFIER_URL_TESTNET}/verifier/web2/Web2Json/prepareRequest`;
    const apiKey = VERIFIER_API_KEY_TESTNET;

    return await prepareAttestationRequestBase(url, apiKey, attestationTypeBase, sourceIdBase, requestBody);
}

async function claimWithProof(proof: any) {
    if (!INSTANT_PAYROLL_ADDRESS) {
        console.log("No INSTANT_PAYROLL_ADDRESS set, skipping contract interaction.");
        console.log("Proof data (save for later use):");
        console.log(JSON.stringify(proof, null, 2));
        return;
    }

    const InstantPayroll = artifacts.require("InstantPayroll");
    const instantPayroll = await InstantPayroll.at(INSTANT_PAYROLL_ADDRESS);

    // Decode the proof response
    const IWeb2JsonVerification = await artifacts.require("IWeb2JsonVerification");
    const responseType = IWeb2JsonVerification._json.abi[0].inputs[0].components[1];
    const decodedResponse = web3.eth.abi.decodeParameter(responseType, proof.response_hex);

    console.log("Decoded proof:", decodedResponse, "\n");

    // Call claim on the contract
    const tx = await instantPayroll.claim(STREAM_ID, {
        merkleProof: proof.proof,
        data: decodedResponse,
    });

    console.log("Claim TX:", tx.tx);

    // Parse PaymentClaimed event
    const claimEvent = tx.logs.find((log: any) => log.event === "PaymentClaimed");
    if (claimEvent) {
        const args = claimEvent.args;
        console.log("\n--- Payment Claimed ---");
        console.log("  Stream ID:", args.streamId.toString());
        console.log("  Amount (FLR):", web3.utils.fromWei(args.amountFLR.toString(), "ether"));
        console.log("  FLR/USD Price:", args.flrUsdPrice.toString());
        console.log("  Bonus Triggered:", args.bonusTriggered);
        console.log("  Commit Count:", args.commitCount.toString());
    }
}

async function main() {
    if (!GITHUB_REPO) {
        throw new Error("Set GITHUB_REPO env var (e.g., 'owner/repo')");
    }

    console.log("=== InstantPayroll FDC GitHub Attestation ===\n");
    console.log("Repository:", GITHUB_REPO);
    console.log("Since:", SINCE_TIMESTAMP || "all time");
    console.log("");

    // Step 1: Prepare attestation request
    console.log("Step 1: Preparing attestation request...");
    const data = await prepareGitHubAttestationRequest();
    console.log("Attestation request prepared.\n");

    const abiEncodedRequest = data.abiEncodedRequest;

    // Step 2: Submit to FDC
    console.log("Step 2: Submitting attestation request to FDC...");
    const roundId = await submitAttestationRequest(abiEncodedRequest);
    console.log("Submitted. Round ID:", roundId, "\n");

    // Step 3: Wait for finalization and retrieve proof
    console.log("Step 3: Waiting for round finalization and proof...");
    const daLayerUrl = `${COSTON2_DA_LAYER_URL}/api/v1/fdc/proof-by-request-round-raw`;
    const proof = await retrieveDataAndProofWithRetry(daLayerUrl, abiEncodedRequest, roundId);
    console.log("Proof retrieved!\n");

    // Step 4: Claim payment with proof
    console.log("Step 4: Claiming payment with FDC proof...");
    await claimWithProof(proof);

    console.log("\n=== Done ===");
}

void main().then(() => {
    process.exit(0);
});
