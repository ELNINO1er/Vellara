import { Capsule } from './Capsule';

export function Logo({ name, subtitle, inverted = false }: { name: string; subtitle: string; inverted?: boolean }) {
  return (
    <span className="flex items-center gap-3.5 text-left">
      <Capsule
        left={inverted ? '#FDF0D5' : '#780000'}
        right="#C1121F"
        className={`h-5 w-[42px] ${inverted ? 'ring-1 ring-cream/30 ring-offset-2 ring-offset-navy' : 'ring-1 ring-sand-300 ring-offset-2 ring-offset-ivory'}`}
      />
      <span>
        <span className={`block text-[22px] leading-[1.05] font-bold tracking-[-0.01em] [font-stretch:78%] ${inverted ? 'text-white' : 'text-navy'}`}>
          {name}
        </span>
        <span className={`mt-0.5 block text-[10.5px] tracking-[0.16em] uppercase ${inverted ? 'text-sky-300' : 'text-muted'}`}>{subtitle}</span>
      </span>
    </span>
  );
}
