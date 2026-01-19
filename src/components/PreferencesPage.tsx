import { CyberButton } from "./CyberButton";

interface PreferencesPageProps {
  address?: string;
  onLogout?: () => void;
}

export const PreferencesPage = ({
  address,
  onLogout,
}: PreferencesPageProps) => {
  const handleExportPrivateKey = () => {
    alert("Export functionality coming soon");
  };

  const handleViewSeedPhrase = () => {
    alert("View seed phrase functionality coming soon");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="space-y-4">
        {/* Account Section */}
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <h2 className="text-sm font-mono text-[#00FF00] mb-4 uppercase tracking-widest">
            Account
          </h2>

          <div className="space-y-3">
            {address && (
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-2 uppercase tracking-wider">
                  Wallet Address
                </label>
                <div className="bg-black/80 p-3">
                  <p className="text-xs font-mono text-white break-all">
                    {address}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleViewSeedPhrase}
              className="w-full text-left px-4 py-3 bg-black/80 hover:bg-black/60 transition-colors"
            >
              <p className="text-sm font-mono text-white">View Seed Phrase</p>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Show your secret recovery phrase
              </p>
            </button>

            <button
              onClick={handleExportPrivateKey}
              className="w-full text-left px-4 py-3 bg-black/80 hover:bg-black/60 transition-colors"
            >
              <p className="text-sm font-mono text-white">Export Private Key</p>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Export your wallet private key
              </p>
            </button>
          </div>
        </div>

        {/* Network Section */}
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <h2 className="text-sm font-mono text-[#00FF00] mb-4 uppercase tracking-widest">
            Network
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2 uppercase tracking-wider">
                Current Network
              </label>
              <div className="bg-black/80 p-3">
                <p className="text-sm font-mono text-white">Solana Devnet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <h2 className="text-sm font-mono text-[#00FF00] mb-4 uppercase tracking-widest">
            Privacy
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80">
              <div>
                <p className="text-sm font-mono text-white">Auto-lock</p>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Lock wallet after inactivity
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 accent-[#00FF00]"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-black/80">
              <div>
                <p className="text-sm font-mono text-white">Privacy Mode</p>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Hide balance and amounts
                </p>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-[#00FF00]" />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
          <h2 className="text-sm font-mono text-[#00FF00] mb-4 uppercase tracking-widest">
            About
          </h2>

          <div className="space-y-2 bg-black/80 p-3">
            <div className="flex justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Version
              </span>
              <span className="text-xs font-mono text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Build
              </span>
              <span className="text-xs font-mono text-white">Dev</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {onLogout && (
          <div className="border border-white/10 bg-black/40 backdrop-blur-md p-4">
            <h2 className="text-sm font-mono text-white mb-4 uppercase tracking-widest">
              Danger Zone
            </h2>

            <CyberButton onClick={onLogout}>Log Out</CyberButton>
          </div>
        )}
      </div>
    </div>
  );
};
