import { web3 } from "hardhat";
import {
    prepareAttestationRequestBase,
    submitAttestationRequest,
    retrieveDataAndProofWithRetry,
} from "./utils/fdc";

/**
 * Test FDC Web2Json with httpbin (deterministic static API)
 */

const {
    VERIFIER_URL_TESTNET = "https://fdc-verifiers-testnet.flare.network",
    VERIFIER_API_KEY_TESTNET = "00000000-0000-0000-0000-000000000000",
    COSTON2_DA_LAYER_URL = "https://ctn2-data-availability.flare.network",
} = process.env;

const attestationTypeBase = "Web2Json";
const sourceIdBase = "PublicWeb2";

async function main() {
    console.log("=== FDC Web2Json Test (httpbin.org) ===\n");

    const requestBody = {
        url: "https://httpbin.org/json",
        httpMethod: "GET",
        headers: "{}",
        queryParams: "{}",
        body: "{}",
        postProcessJq: "{commitCount: .slideshow.slides | length}",
        abiSignature: '{"components": [{"internalType": "uint256", "name": "commitCount", "type": "uint256"}], "name": "task", "type": "tuple"}',
    };

    const url = `${VERIFIER_URL_TESTNET}/verifier/web2/Web2Json/prepareRequest`;
    const data = await prepareAttestationRequestBase(url, VERIFIER_API_KEY_TESTNET, attestationTypeBase, sourceIdBase, requestBody);
    console.log("Prepared. Status:", data.status, "\n");

    if (!data.abiEncodedRequest) {
        throw new Error("No abiEncodedRequest returned");
    }

    console.log("Submitting to FDC...");
    const roundId = await submitAttestationRequest(data.abiEncodedRequest);
    console.log("Round ID:", roundId, "\n");

    console.log("Waiting for proof...");
    const daLayerUrl = `${COSTON2_DA_LAYER_URL}/api/v1/fdc/proof-by-request-round-raw`;
    const proof = await retrieveDataAndProofWithRetry(daLayerUrl, data.abiEncodedRequest, roundId, 5);
    console.log("SUCCESS! Proof retrieved.");
    console.log("response_hex exists:", !!proof.response_hex);
}

void main().then(() => process.exit(0));
