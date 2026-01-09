interface ActionButtonsProps {
  onTransfer: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export const ActionButtons = ({
  onTransfer,
  onDeposit,
  onWithdraw,
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-center gap-2 px-4 py-3 border-b border-white/10">
      <button
        onClick={onDeposit}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
      >
        <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-3.5 h-3.5 text-neon-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8"
            />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
          DEPOSIT
        </span>
      </button>

      <button
        onClick={onWithdraw}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
      >
        <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-3.5 h-3.5 text-neon-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3-3m0 0l3 3m-3-3v12"
            />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
          WITHDRAW
        </span>
      </button>

      <button
        onClick={onTransfer}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group rounded"
      >
        <div className="w-6 h-6 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-3.5 h-3.5 text-neon-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">
          TRANSFER
        </span>
      </button>
    </div>
  );
};
