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
    <div
      onClick={onSelect}
      className="border border-white/10 bg-black/40 backdrop-blur-md p-4 hover:border-white/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-mono text-white mb-1">{name}</h3>
          <p className="text-xs font-mono text-zinc-400">
            {truncateAddress(publicKey)}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
            Balance
          </p>
          <p className="text-sm font-mono text-white">
            {balance.toFixed(4)} SOL
          </p>
        </div>
        <svg
          className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};
