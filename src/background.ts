/**
 * Veilo Wallet Background Service Worker
 * Handles communication between content script and popup
 */

console.log("[Veilo Background] Service worker initialized");

interface VeiloRequest {
  type: string;
  method: string;
  params: Record<string, unknown>;
  id: string;
}

interface PendingApproval {
  method: string;
  params: Record<string, unknown>;
  origin: string;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

// Store pending approval requests (key: request id)
const pendingApprovals: Map<string, PendingApproval> = new Map();

// Handle messages from content script
chrome.runtime.onMessage.addListener(
  (
    message:
      | VeiloRequest
      | {
          type: string;
          requestId: string;
          approved: boolean;
          response?: unknown;
          error?: string;
        },
    sender,
    sendResponse,
  ) => {
    console.log("[Veilo Background] Received message:", message);
    if (message.type === "VEILO_REQUEST") {
      handleWalletRequest(message as VeiloRequest, sender, sendResponse);
      return true; // Keep message channel open for async response
    }

    if (message.type === "POPUP_RESPONSE") {
      handlePopupResponse(
        message as {
          type: string;
          requestId: string;
          approved: boolean;
          response?: unknown;
          error?: string;
        },
      );
      return false;
    }

    return false;
  },
);

async function handleWalletRequest(
  message: VeiloRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  const { method, params, id } = message;
  const origin = sender.tab?.url ? new URL(sender.tab.url).origin : "unknown";

  try {
    switch (method) {
      case "connect": {
        // Check if already connected
        const result = await chrome.storage.local.get([
          "connectedSites",
          "walletPublicKey",
        ]);
        const connectedSites: string[] =
          (result.connectedSites as string[] | undefined) || [];
        const publicKeyArray: number[] | undefined = result.walletPublicKey as
          | number[]
          | undefined;

        if (publicKeyArray && connectedSites.includes(origin)) {
          // Already connected, return stored public key
          sendResponse({ publicKey: publicKeyArray });
        } else {
          // Need user approval - open popup
          await requestUserApproval(id, method, params, origin, sendResponse);
        }
        break;
      }

      case "disconnect": {
        // Remove site from connected sites
        const result = await chrome.storage.local.get(["connectedSites"]);
        const connectedSites: string[] =
          (result.connectedSites as string[] | undefined) || [];
        const updatedSites = connectedSites.filter((site) => site !== origin);
        await chrome.storage.local.set({ connectedSites: updatedSites });
        sendResponse({ success: true });
        break;
      }

      case "signTransaction":
      case "signMessage":
      case "signAndSendTransaction":
      case "sendPrivateTransaction": {
        // All signing operations require user approval
        await requestUserApproval(id, method, params, origin, sendResponse);
        break;
      }

      case "getPrivateBalance": {
        // Get private balance for a specific token
        try {
          const result = await chrome.storage.local.get(["tokenBalances"]);
          const balances = (result.tokenBalances as
            | { sol: number; usdc: number; usdt: number; veilo: number }
            | undefined) || {
            sol: 0,
            usdc: 0,
            usdt: 0,
            veilo: 0,
          };

          // For now, default to SOL if no mint specified
          const mintAddress = params.mintAddress as string | undefined;
          let balance = "0";
          let decimals = 9;
          let symbol = "SOL";

          if (
            !mintAddress ||
            mintAddress === "So11111111111111111111111111111111111111112"
          ) {
            balance = (balances.sol * 1e9).toString();
            decimals = 9;
            symbol = "SOL";
          } else if (
            mintAddress === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
          ) {
            balance = (balances.usdc * 1e6).toString();
            decimals = 6;
            symbol = "USDC";
          } else if (
            mintAddress === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
          ) {
            balance = (balances.usdt * 1e6).toString();
            decimals = 6;
            symbol = "USDT";
          }

          sendResponse({ balance, decimals, symbol });
        } catch (error) {
          sendResponse({
            error:
              error instanceof Error ? error.message : "Failed to get balance",
          });
        }
        break;
      }

      case "getAllPrivateBalances": {
        // Get all private token balances
        try {
          const result = await chrome.storage.local.get(["tokenBalances"]);
          const balances = (result.tokenBalances as
            | { sol: number; usdc: number; usdt: number; veilo: number }
            | undefined) || {
            sol: 0,
            usdc: 0,
            usdt: 0,
            veilo: 0,
          };

          sendResponse(balances);
        } catch (error) {
          sendResponse({
            error:
              error instanceof Error ? error.message : "Failed to get balances",
          });
        }
        break;
      }

      default:
        sendResponse({ error: `Unknown method: ${method}` });
    }
  } catch (error) {
    sendResponse({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function requestUserApproval(
  requestId: string,
  method: string,
  params: Record<string, unknown>,
  origin: string,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  // Store the pending request
  pendingApprovals.set(requestId, {
    method,
    params,
    origin,
    resolve: (value) => sendResponse(value),
    reject: (error) => sendResponse({ error: error.message }),
  });

  // Store request in chrome.storage for popup to access
  await chrome.storage.local.set({
    pendingRequest: {
      id: requestId,
      method,
      params,
      origin,
    },
  });

  // Open popup window for approval
  try {
    const popupUrl = chrome.runtime.getURL("index.html");

    // Get screen dimensions to position on right
    const displays = await chrome.system?.display?.getInfo();
    let left = 100;
    let top = 100;

    if (displays && displays.length > 0) {
      const primaryDisplay = displays[0];
      const screenWidth = primaryDisplay.bounds.width;
      const screenHeight = primaryDisplay.bounds.height;
      const popupWidth = 400;
      const popupHeight = 640;

      // Position on right side with some padding
      left = screenWidth - popupWidth - 20;
      top = Math.floor((screenHeight - popupHeight) / 2);
    }

    // Create a popup window
    await chrome.windows.create({
      url: popupUrl,
      type: "popup",
      width: 400,
      height: 640,
      left: left + 900,
      top: top,
      focused: true,
    });
  } catch (e) {
    console.error("Failed to open popup window:", e);
  }
}

function handlePopupResponse(message: {
  type: string;
  requestId: string;
  approved: boolean;
  response?: unknown;
  error?: string;
}): void {
  const pending = pendingApprovals.get(message.requestId);
  if (!pending) {
    console.error("No pending approval found for request:", message.requestId);
    return;
  }

  pendingApprovals.delete(message.requestId);

  // Clear pending request from storage
  chrome.storage.local.remove("pendingRequest");

  if (message.approved && message.response) {
    pending.resolve(message.response);
  } else {
    pending.reject(new Error(message.error || "User rejected the request"));
  }

  // Close the popup window after response
  chrome.windows.getCurrent((window) => {
    if (window?.id && window.type === "popup") {
      chrome.windows.remove(window.id);
    }
  });
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("Veilo Wallet extension installed/updated");
});
