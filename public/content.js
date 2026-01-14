/**
 * Veilo Wallet Content Script
 * This script injects the Veilo provider into web pages to enable dApp interactions
 */

// Inject the provider script into the page context
const injectScript = () => {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
};

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectScript);
} else {
  injectScript();
}

// Listen for messages from the injected script
window.addEventListener("message", async (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data?.source === "veilo-injected") {
    const { method, params, id } = event.data;

    try {
      // Forward the request to the background/service worker or popup
      const response = await chrome.runtime.sendMessage({
        type: "VEILO_REQUEST",
        method,
        params,
        id,
      });

      // Send response back to the injected script
      window.postMessage(
        {
          source: "veilo-content",
          id,
          result: response,
        },
        "*"
      );
    } catch (error) {
      window.postMessage(
        {
          source: "veilo-content",
          id,
          error: error.message || "Unknown error",
        },
        "*"
      );
    }
  }
});
