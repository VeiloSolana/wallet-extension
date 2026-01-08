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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
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
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
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
