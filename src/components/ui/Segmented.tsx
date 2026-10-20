import type { ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  className?: string;
}

/** Groupe de boutons bascule (aria-pressed), utilisable au clavier. */
export function Segmented<T extends string>({ label, value, options, onChange, className = '' }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={`flex gap-0.5 rounded-full bg-[#F3E8D2] p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink transition-colors aria-pressed:bg-white aria-pressed:text-bordeaux aria-pressed:shadow-[0_1px_3px_rgba(0,48,73,.2)]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
