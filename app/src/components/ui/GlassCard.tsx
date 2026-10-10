import type { ReactNode } from 'react';

/**
 * Uiverse-inspired glassmorphism panel shell.
 */
export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-white/[0.045] shadow-[0_18px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

/** Section label used inside panels. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
      {children}
    </p>
  );
}
