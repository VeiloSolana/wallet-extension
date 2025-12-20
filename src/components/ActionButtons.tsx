interface ActionButtonsProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
}

export const ActionButtons = ({
  onSend,
  onReceive,
  onSwap,
}: ActionButtonsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/10">
      <button
        onClick={onSend}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-5 h-5 text-neon-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </div>
        <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
          SEND
        </span>
      </button>

      <button
        onClick={onReceive}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-5 h-5 text-neon-green"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
        <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
          RECEIVE
        </span>
      </button>

      <button
        onClick={onSwap}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg
            className="w-5 h-5 text-neon-green"
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
        <span className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
          SWAP
        </span>
      </button>
    </div>
  );
};
