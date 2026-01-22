import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const CyberCard = ({
  children,
  className = "",
  hoverable = true,
}: CyberCardProps) => {
  return (
    <motion.div
      className={`
        relative bg-zinc-900/40 backdrop-blur-sm border border-white/10
        transition-all duration-300 overflow-hidden
        ${hoverable ? "hover:border-white/40" : ""}
        ${className}
      `}
      whileHover={hoverable ? { scale: 1.01 } : {}}
    >
      {/* Corner brackets */}
      <svg
        className="absolute top-0 left-0 w-4 h-4 text-white/40"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 0 L0 8 M0 0 L8 0"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>
      <svg
        className="absolute top-0 right-0 w-4 h-4 text-white/40"
        viewBox="0 0 16 16"
      >
        <path
          d="M16 0 L16 8 M16 0 L8 0"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-4 h-4 text-white/40"
        viewBox="0 0 16 16"
      >
        <path
          d="M0 16 L0 8 M0 16 L8 16"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>
      <svg
        className="absolute bottom-0 right-0 w-4 h-4 text-white/40"
        viewBox="0 0 16 16"
      >
        <path
          d="M16 16 L16 8 M16 16 L8 16"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Scanning beam on hover */}
      {hoverable && (
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-0 group-hover:opacity-100"
          initial={{ top: "-2px" }}
          whileHover={{ top: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 p-4">{children}</div>
    </motion.div>
  );
};
