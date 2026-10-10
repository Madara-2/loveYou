'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Uiverse-inspired custom range slider: glowing track fill, animated thumb.
 * Fully keyboard accessible (native input[type=range]).
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  accent = '#E60D24',
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  accent?: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : `${Math.round(value * 100) / 100}${unit}`;

  return (
    <div className="group/slider">
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-white/70">
          {label}
        </label>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums transition-colors ${
            dragging ? 'bg-white/10 text-white' : 'text-white/45'
          }`}
        >
          {display}
        </span>
      </div>
      <div className="relative h-6">
        {/* track */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}55, ${accent})`,
              boxShadow: `0 0 12px ${accent}88`,
            }}
          />
        </div>
        {/* thumb glow */}
        <div
          aria-hidden
          className={`pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 ${
            dragging ? 'scale-[2.2] opacity-40' : 'scale-[1.6] opacity-0 group-hover/slider:scale-[1.8] group-hover/slider:opacity-25'
          }`}
          style={{ left: `${pct}%`, backgroundColor: accent }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="love-range absolute inset-0 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

/**
 * Uiverse-style pill toggle switch with springy knob.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  accent = '#E60D24',
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}) {
  const id = useId();
  // Avoid SSR/hydration mismatch by rendering the true state only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const visualChecked = mounted ? checked : false;

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[13px] font-medium text-white/70">{label}</span>
        {description && <span className="block text-[11px] text-white/35">{description}</span>}
      </label>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        style={{
          borderColor: visualChecked ? accent : 'rgba(255,255,255,0.14)',
          backgroundColor: visualChecked ? `${accent}cc` : 'rgba(255,255,255,0.06)',
          boxShadow: visualChecked ? `0 0 14px ${accent}55` : 'none',
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: visualChecked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
