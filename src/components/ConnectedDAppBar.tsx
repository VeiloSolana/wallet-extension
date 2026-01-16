import { useEffect, useState } from "react";

export const ConnectedDAppBar = () => {
  const [connectedOrigin, setConnectedOrigin] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof chrome === "undefined" || !chrome.tabs) return;

        // Get current active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!tab?.url) return;

        const url = new URL(tab.url);
        const origin = url.origin;

        // Get connected sites
        const result = await chrome.storage.local.get(["connectedSites"]);
        const connectedSites: string[] = (result.connectedSites as string[]) || [];

        if (connectedSites.includes(origin)) {
          setConnectedOrigin(origin);
          setFaviconUrl(tab.favIconUrl || null);
        } else {
          setConnectedOrigin(null);
        }
      } catch (error) {
        console.error("Failed to check connection status:", error);
      }
    };

    checkConnection();
  }, []);

  const handleDisconnect = async () => {
    if (!connectedOrigin) return;
    try {
      const result = await chrome.storage.local.get(["connectedSites"]);
      const connectedSites: string[] = (result.connectedSites as string[]) || [];
      const updatedSites = connectedSites.filter(
        (site) => site !== connectedOrigin
      );
      await chrome.storage.local.set({ connectedSites: updatedSites });
      setConnectedOrigin(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  if (!connectedOrigin) return null;

  // strip protocol for cleaner display
  const displayUrl = connectedOrigin.replace(/^https?:\/\//, "");

  return (
    <div className="bg-zinc-900 border-b border-white/5 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 animate-pulse" />
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt="dApp icon"
            className="w-4 h-4 rounded-full"
          />
        ) : (
          <svg
            className="w-3.5 h-3.5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <span className="text-xs text-white/90 truncate font-medium">
          {displayUrl}
        </span>
      </div>
      <button
        onClick={handleDisconnect}
        className="text-[10px] text-zinc-500 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1"
      >
        <span className="w-1 h-1 rounded-full bg-zinc-500" />
        Disconnect
      </button>
    </div>
  );
};
