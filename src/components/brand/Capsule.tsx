/** Gélule bicolore : motif signature issu de la palette. Purement décorative. */
export function Capsule({
  left = '#780000',
  right = '#C1121F',
  className = 'h-5 w-11',
  angle = -30,
}: {
  left?: string;
  right?: string;
  className?: string;
  angle?: number;
}) {
  return (
    <span aria-hidden="true" className={`inline-flex overflow-hidden rounded-full ${className}`} style={{ transform: `rotate(${angle}deg)` }}>
      <span className="flex-1" style={{ background: left }} />
      <span className="flex-1" style={{ background: right }} />
    </span>
  );
}
