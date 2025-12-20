import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CyberButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const CyberButton = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  fullWidth = false,
}: CyberButtonProps) => {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden px-6 py-3 font-medium tracking-wide
        transition-all duration-300 group
        ${fullWidth ? "w-full" : ""}
        ${
          isPrimary
            ? "bg-white text-black hover:bg-white/90"
            : "bg-transparent text-white border border-white/20 hover:border-white/40"
        }
        ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      {/* Scanline effect on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-neon-green/20"
          initial={{ y: "100%" }}
          whileHover={{ y: "-100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      )}

      {/* Corner accents */}
      {!disabled && (
        <>
          <motion.div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-green opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-green opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-green opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-green opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}

      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
