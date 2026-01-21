import { motion, AnimatePresence } from "framer-motion";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: "alert" | "confirm" | "loading";
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
}

export const CustomModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = "OK",
  cancelText = "Cancel",
  variant = "default",
}: CustomModalProps) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          accent: "#ef4444",
          glow: "shadow-[0_0_8px_rgba(239,68,68,0.15)]",
        };
      case "warning":
        return {
          accent: "#f59e0b",
          glow: "shadow-[0_0_8px_rgba(245,158,11,0.15)]",
        };
      default:
        return {
          accent: "#00FF00",
          glow: "shadow-[0_0_8px_rgba(0,255,0,0.1)]",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={type === "alert" && !type ? onClose : undefined}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-black border border-white/10 z-50 ${styles.glow}`}
          >
            {/* Corner brackets */}
            <svg
              className="absolute -top-px -left-px w-3 h-3"
              style={{ color: styles.accent }}
              viewBox="0 0 12 12"
            >
              <path
                d="M0 0 L0 8 M0 0 L8 0"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -top-px -right-px w-3 h-3"
              style={{ color: styles.accent }}
              viewBox="0 0 12 12"
            >
              <path
                d="M12 0 L12 8 M12 0 L4 0"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -bottom-px -left-px w-3 h-3"
              style={{ color: styles.accent }}
              viewBox="0 0 12 12"
            >
              <path
                d="M0 12 L0 4 M0 12 L8 12"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <svg
              className="absolute -bottom-px -right-px w-3 h-3"
              style={{ color: styles.accent }}
              viewBox="0 0 12 12"
            >
              <path
                d="M12 12 L12 4 M12 12 L4 12"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>

            <div className="p-4">
              {/* Title */}
              <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                {type === "loading" ? (
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    style={{ color: styles.accent }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: styles.accent }}
                  />
                )}
                <h3
                  className="text-xs font-mono font-bold uppercase tracking-widest"
                  style={{ color: styles.accent }}
                >
                  {title}
                </h3>
              </div>

              {/* Message */}
              <p className="text-xs font-mono text-zinc-400 mb-4 leading-relaxed">
                {message}
              </p>

              {/* Buttons */}
              {type !== "loading" && (
                <div className="flex gap-2">
                  {type === "confirm" && (
                    <button
                      onClick={onClose}
                      className="flex-1 px-3 py-1.5 bg-zinc-900/60 border border-white/10 text-white font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800/60 hover:border-white/20 transition-all"
                    >
                      {cancelText}
                    </button>
                  )}
                  <button
                    onClick={handleConfirm}
                    className={`${type === "confirm" ? "flex-1" : "w-full"} px-3 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-all hover:brightness-110`}
                    style={{
                      backgroundColor:
                        variant === "default" ? styles.accent : "transparent",
                      borderColor: styles.accent,
                      color: variant === "default" ? "#000000" : styles.accent,
                    }}
                  >
                    {confirmText}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
