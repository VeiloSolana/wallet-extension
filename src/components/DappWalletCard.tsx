interface DappWalletCardProps {
  name: string;
  publicKey: string;
  balance: number;
  onSelect: () => void;
  onDelete: () => void;
}

export const DappWalletCard = ({
  name,
  publicKey,
  balance,
  onSelect,
  onDelete,
}: DappWalletCardProps) => {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div onClick={onSelect} className="relative group cursor-pointer">
      {/* Card Background & Border */}
      <div className="absolute inset-0 bg-zinc-900/40 border border-white/10 group-hover:border-neon-green/30 transition-all duration-300" />

      {/* Tech Corners */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-white/20 group-hover:border-neon-green/60 transition-colors duration-300" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-white/20 group-hover:border-neon-green/60 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-white/20 group-hover:border-neon-green/60 transition-colors duration-300" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-white/20 group-hover:border-neon-green/60 transition-colors duration-300" />

      {/* Content */}
      <div className="relative p-4 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-mono text-white font-bold tracking-wider group-hover:text-neon-green transition-colors duration-300">
              {name}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green/50 animate-pulse" />
              <p className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                {truncateAddress(publicKey)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-zinc-600 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            title="Delete Wallet"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-end justify-between border-t border-white/5 pt-3 mt-1">
          <div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-0.5">
              Total Balance
            </p>
            <p className="text-xl font-mono text-white tracking-tight">
              {balance.toFixed(4)}{" "}
              <span className="text-sm text-zinc-600 font-normal">SOL</span>
            </p>
          </div>

          <div className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center group-hover:bg-neon-green/10 group-hover:border-neon-green/30 transition-all">
            <svg
              className="w-4 h-4 text-zinc-500 group-hover:text-neon-green transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
