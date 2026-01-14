/**
 * Veilo Wallet Content Script
 * Bridges communication between injected script and extension background/popup
 */

// Inject the provider script into the page context
const injectScript = (): void => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "module";
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectScript);
} else {
  injectScript();
}

interface VeiloMessage {
  source: string;
  method: string;
  params: Record<string, unknown>;
  id: string;
}

interface VeiloResponse {
  source: string;
  id: string;
  result?: unknown;
  error?: string;
}

// Listen for messages from the injected script
window.addEventListener("message", async (event: MessageEvent) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  const data = event.data as VeiloMessage;
  
  if (data?.source === "veilo-injected") {
    const { method, params, id } = data;

    try {
      // Forward the request to the background/service worker
      const response = await chrome.runtime.sendMessage({
        type: "VEILO_REQUEST",
        method,
        params,
        id,
      });

      // Check if response contains an error (from rejection or failed operation)
      if (response && typeof response === 'object' && 'error' in response) {
        const responseMessage: VeiloResponse = {
          source: "veilo-content",
          id,
          error: (response as { error: string }).error,
        };
        window.postMessage(responseMessage, "*");
      } else {
        // Send success response back to the injected script
        const responseMessage: VeiloResponse = {
          source: "veilo-content",
          id,
          result: response,
        };
        window.postMessage(responseMessage, "*");
      }
    } catch (error) {
      const responseMessage: VeiloResponse = {
        source: "veilo-content",
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      window.postMessage(responseMessage, "*");
    }
  }
});

// Listen for messages from background script (for push notifications like account changes)
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === "VEILO_EVENT") {
    window.postMessage(
      {
        source: "veilo-content",
        event: message.event,
        data: message.data,
      },
      "*"
    );
  }
  return false;
});
