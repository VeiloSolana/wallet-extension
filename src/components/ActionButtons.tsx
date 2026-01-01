interface ActionButtonsProps {
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onSettings: () => void;
}

export const ActionButtons = ({
  onSend,
  onReceive,
  onSwap,
  onDeposit,
  onWithdraw,
  onSettings,
}: ActionButtonsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 p-4 border-b border-white/10">
      <button
        onClick={onSend}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">SEND</span>
      </button>

      <button
        onClick={onReceive}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">RECEIVE</span>
      </button>

      <button
        onClick={onDeposit}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">SHIELD</span>
      </button>

      <button
        onClick={onWithdraw}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
         <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">UNSHIELD</span>
      </button>

      <button
        onClick={onSwap}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">SWAP</span>
      </button>

      <button
        onClick={onSettings}
        className="flex flex-col items-center gap-2 p-3 bg-zinc-900/40 border border-white/10 hover:border-neon-green/50 transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:bg-neon-green/20 transition-colors">
          <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors">SETTINGS</span>
      </button>
    </div>
  );
};
