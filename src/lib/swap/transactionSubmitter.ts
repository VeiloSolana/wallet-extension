import { Connection, VersionedTransaction } from "@solana/web3.js";
import { USE_RELAYER_FOR_SUBMISSION, SWAP_CONFIG } from "./config";

// Response from relayer submission endpoint
interface RelayerSubmitResponse {
  success: boolean;
  txSignature?: string;
  message?: string;
  error?: string;
}

/**
 * Submit a signed swap transaction.
 * Routes to either relayer or direct RPC based on configuration.
 */
export async function submitSwapTransaction(
  signedTx: VersionedTransaction
): Promise<string> {
  if (USE_RELAYER_FOR_SUBMISSION) {
    return submitViaRelayer(signedTx);
  } else {
    return submitViaRPC(signedTx);
  }
}

/**
 * Submit transaction via the relayer endpoint.
 * Useful when you want the relayer to handle submission and confirmation.
 */
async function submitViaRelayer(
  signedTx: VersionedTransaction
): Promise<string> {
  const serialized = signedTx.serialize();
  const base64Tx = Buffer.from(serialized).toString("base64");

  const response = await fetch(
    `${SWAP_CONFIG.relayerEndpoint}/api/transact/submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: base64Tx,
      }),
    }
  );

  const result: RelayerSubmitResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || result.message || "Relayer submission failed"
    );
  }

  if (!result.txSignature) {
    throw new Error("Relayer did not return transaction signature");
  }

  return result.txSignature;
}

/**
 * Submit transaction directly to Solana RPC.
 * Uses sendTransaction with confirmation.
 */
async function submitViaRPC(signedTx: VersionedTransaction): Promise<string> {
  const connection = new Connection(SWAP_CONFIG.rpcEndpoint, "confirmed");

  // Send the transaction
  const signature = await connection.sendTransaction(signedTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
    maxRetries: 3,
  });

  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: signedTx.message.recentBlockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash())
        .lastValidBlockHeight,
    },
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }

  return signature;
}

/**
 * Get the current submission mode as a string.
 * Useful for displaying in UI.
 */
export function getSubmissionMode(): "relayer" | "direct" {
  return USE_RELAYER_FOR_SUBMISSION ? "relayer" : "direct";
}

/**
 * Check if the RPC endpoint is reachable.
 */
export async function checkRPCHealth(): Promise<boolean> {
  try {
    const connection = new Connection(SWAP_CONFIG.rpcEndpoint);
    await connection.getLatestBlockhash();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the relayer endpoint is reachable.
 */
export async function checkRelayerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SWAP_CONFIG.relayerEndpoint}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
