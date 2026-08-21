"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useEditor } from "./editor-context";
import { Button } from "@/components/ui/button";

export function AuthDialog() {
  const { isAuthModalOpen, setIsAuthModalOpen, unlockWithPassword } = useEditor();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError(null);

    const result = await unlockWithPassword(password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Incorrect passphrase");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } else {
      setPassword("");
    }
  };

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setError(null);
    setPassword("");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: shake ? [-8, 8, -6, 6, -3, 3, 0] : 0,
          }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-neutral-950/95 p-6 shadow-2xl shadow-black/80 ring-1 ring-white/10 backdrop-blur-xl sm:p-8"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-neutral-800 hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-signal/30 bg-signal/10 text-signal">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                Visual Editor Access
              </h2>
              <p className="font-mono text-[11px] text-muted-foreground">
                Enter your admin passphrase to unlock in-place editing
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
              >
                Passphrase
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password…"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3.5 py-2.5 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 font-mono text-[11px] text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] text-muted-foreground/70">
                Default: <code className="text-signal/80">admin</code>
              </span>
              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="gap-2 bg-signal px-5 text-white hover:bg-signal/90"
              >
                {isLoading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Lock className="size-4" />
                )}
                Unlock Editor
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
