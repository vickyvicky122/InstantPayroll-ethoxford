import { ethers } from "hardhat";
import { toUtf8HexString, sleep } from "./core";
import { getContractAddressByName, getFlareSystemsManager, getFdcHub, getRelay, getFdcVerification } from "./getters";

const FdcRequestFeeConfigurations = artifacts.require("IFdcRequestFeeConfigurations");

export async function getFdcRequestFee(abiEncodedRequest: string) {
    const fdcRequestFeeConfigurationsAddress: string = await getContractAddressByName("FdcRequestFeeConfigurations");
    const fdcRequestFeeConfigurations = await FdcRequestFeeConfigurations.at(fdcRequestFeeConfigurationsAddress);
    return await fdcRequestFeeConfigurations.getRequestFee(abiEncodedRequest);
}

export async function prepareAttestationRequestBase(
    url: string,
    apiKey: string,
    attestationTypeBase: string,
    sourceIdBase: string,
    requestBody: any
) {
    console.log("Url:", url, "\n");
    const attestationType = toUtf8HexString(attestationTypeBase);
    const sourceId = toUtf8HexString(sourceIdBase);

    const request = {
        attestationType: attestationType,
        sourceId: sourceId,
        requestBody: requestBody,
    };
    console.log("Prepared request:\n", request, "\n");

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });
    if (response.status !== 200) {
        throw new Error(`Response status is not OK, status ${response.status} ${response.statusText}\n`);
    }
    console.log("Response status is OK\n");

    return await response.json();
}

export async function calculateRoundId(transaction: any) {
    const blockNumber = transaction.receipt.blockNumber;
    const block = await ethers.provider.getBlock(blockNumber);
    const blockTimestamp = BigInt(block!.timestamp);

    const flareSystemsManager = await getFlareSystemsManager();
    const firstVotingRoundStartTs = BigInt(await flareSystemsManager.firstVotingRoundStartTs());
    const votingEpochDurationSeconds = BigInt(await flareSystemsManager.votingEpochDurationSeconds());

    const roundId = Number((blockTimestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds);
    console.log("Calculated round id:", roundId, "\n");
    return roundId;
}

export async function submitAttestationRequest(abiEncodedRequest: string) {
    const fdcHub = await getFdcHub();
    const requestFee = await getFdcRequestFee(abiEncodedRequest);

    const transaction = await fdcHub.requestAttestation(abiEncodedRequest, {
        value: requestFee,
    });
    console.log("Submitted request:", transaction.tx, "\n");

    const roundId = await calculateRoundId(transaction);
    return roundId;
}

export async function postRequestToDALayer(url: string, request: any, watchStatus: boolean = false) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });
    if (watchStatus && response.status !== 200) {
        throw new Error(`Response status is not OK, status ${response.status} ${response.statusText}\n`);
    }
    return await response.json();
}

export async function retrieveDataAndProof(url: string, abiEncodedRequest: string, roundId: number) {
    console.log("Waiting for the round to finalize...");
    const relay = await getRelay();
    const fdcVerification = await getFdcVerification();
    const protocolId = await fdcVerification.fdcProtocolId();

    while (!(await relay.isFinalized(protocolId, roundId))) {
        await sleep(30000);
        console.log("Still waiting...");
    }
    console.log("Round finalized!\n");

    const request = {
        votingRoundId: roundId,
        requestBytes: abiEncodedRequest,
    };

    await sleep(10000);
    let proof = await postRequestToDALayer(url, request, true);
    console.log("Waiting for the DA Layer to generate the proof...");
    while (proof.response_hex === undefined) {
        await sleep(10000);
        proof = await postRequestToDALayer(url, request, false);
    }
    console.log("Proof generated!\n");
    return proof;
}
