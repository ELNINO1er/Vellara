import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { normalize } from '../../lib/text';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  /** Texte secondaire sous le libellé. */
  hint?: string;
  /** Pastille de couleur (ex. catégorie thérapeutique). */
  swatch?: string;
  /** Compteur affiché à droite (ex. nombre de fiches). */
  count?: number;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Option « vide » affichée en tête (valeur ''). */
  placeholder?: string;
  /** Nom accessible quand aucun <label> n'est relié (barres d'outils). */
  ariaLabel?: string;
  /** Ids des éléments qui nomment le contrôle (fournis par FieldShell). */
  labelledBy?: string;
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** Champ de recherche dans la liste ; activé d'office au-delà de 8 options. */
  searchable?: boolean;
  variant?: 'field' | 'toolbar';
  className?: string;
}

/**
 * Liste déroulante accessible (motif WAI-ARIA « listbox ») :
 * - clavier : ↑ ↓ Début Fin, Entrée/Espace pour choisir, Échap pour fermer,
 *   saisie de lettres pour atteindre une option ;
 * - recherche intégrée pour les longues listes ;
 * - s'ouvre vers le haut quand la place manque en bas.
 */
export function Select({
  value,
  onChange,
  options: rawOptions,
  placeholder,
  ariaLabel,
  labelledBy,
  id: idProp,
  describedBy,
  invalid,
  required,
  disabled,
  searchable,
  variant = 'field',
  className = '',
}: SelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listId = `${id}-list`;
  const valueId = `${id}-value`;

  const options = useMemo<SelectOption[]>(
    () => (placeholder !== undefined ? [{ value: '', label: placeholder }, ...rawOptions] : rawOptions),
    [placeholder, rawOptions],
  );
  const withSearch = searchable ?? rawOptions.length > 8;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return q ? options.filter((o) => normalize(o.label).includes(q) || normalize(o.hint).includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const openList = useCallback(
    (focusIndex?: number) => {
      if (disabled) return;
      const idx = focusIndex ?? Math.max(0, options.findIndex((o) => o.value === value));
      setQuery('');
      setActive(idx);
      setOpen(true);
    },
    [disabled, options, value],
  );

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) buttonRef.current?.focus();
  }, []);

  const choose = useCallback(
    (option: SelectOption | undefined) => {
      if (!option) return;
      if (option.value !== value) onChange(option.value);
      close();
    },
    [close, onChange, value],
  );

  // Placement (haut/bas) et focus à l'ouverture.
  useLayoutEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setDropUp(window.innerHeight - rect.bottom < 300 && rect.top > window.innerHeight - rect.bottom);
    (withSearch ? searchRef.current : listRef.current)?.focus({ preventScroll: true });
  }, [open, withSearch]);

  // Garde l'option active visible.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open, close]);

  function onTriggerKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      const current = Math.max(0, options.findIndex((o) => o.value === value));
      openList(e.key === 'ArrowUp' ? Math.max(0, current - 1) : current);
    }
  }

  function onListKey(e: KeyboardEvent<HTMLElement>) {
    const last = visible.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 1));
        return;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      case 'Home':
        e.preventDefault();
        setActive(0);
        return;
      case 'End':
        e.preventDefault();
        setActive(last);
        return;
      case 'PageDown':
        e.preventDefault();
        setActive((i) => Math.min(last, i + 6));
        return;
      case 'PageUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 6));
        return;
      case 'Enter':
        e.preventDefault();
        choose(visible[active]);
        return;
      case 'Escape':
        e.preventDefault();
        close();
        return;
      case 'Tab':
        close(false);
        return;
      case ' ':
        if (!withSearch) {
          e.preventDefault();
          choose(visible[active]);
        }
        return;
    }
    // Saisie de lettres : atteindre la première option correspondante.
    if (!withSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const t = typeahead.current;
      window.clearTimeout(t.timer);
      t.text += normalize(e.key);
      t.timer = window.setTimeout(() => (t.text = ''), 600);
      const idx = visible.findIndex((o) => normalize(o.label).startsWith(t.text));
      if (idx >= 0) setActive(idx);
    }
  }

  const triggerBase =
    variant === 'toolbar'
      ? 'h-[46px] min-w-[180px] rounded-xl'
      : 'min-h-[46px] w-full rounded-xl';

  const display: ReactNode = selected ? (
    <span className="flex min-w-0 items-center gap-2.5">
      {selected.swatch && <span className="size-2.5 shrink-0 rounded-full" style={{ background: selected.swatch }} aria-hidden="true" />}
      <span className={`truncate ${selected.value === '' && placeholder !== undefined ? 'text-muted' : ''}`}>{selected.label}</span>
    </span>
  ) : (
    <span className="truncate text-muted">{placeholder ?? 'Sélectionner…'}</span>
  );

  return (
    <div ref={rootRef} className={`relative ${variant === 'toolbar' ? 'inline-block' : 'block'} ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel ? `${ariaLabel} : ${selected?.label ?? ''}` : undefined}
        aria-labelledby={!ariaLabel && labelledBy ? `${labelledBy} ${valueId}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
        className={`group flex w-full items-center justify-between gap-3 border-[1.5px] bg-white px-3.5 text-left text-[15.5px] transition-[border-color,box-shadow] ${triggerBase} ${
          invalid ? 'border-ember bg-[#fff8f7]' : open ? 'border-navy shadow-[0_0_0_4px_rgba(102,155,188,.35)]' : 'border-sand-300 hover:border-[#BFA673]'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span id={valueId} className="min-w-0 flex-1">
          {display}
        </span>
        <span
          aria-hidden="true"
          className={`grid size-7 shrink-0 place-items-center rounded-lg transition-[transform,background] duration-200 ${open ? 'rotate-180 bg-sand-100' : 'group-hover:bg-sand-100'}`}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className={`animate-pop absolute z-50 min-w-full overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-[0_24px_48px_-20px_rgba(0,48,73,.45),0_2px_6px_rgba(0,48,73,.08)] ${
            dropUp ? 'bottom-[calc(100%+8px)] origin-bottom' : 'top-[calc(100%+8px)] origin-top'
          } ${variant === 'toolbar' ? 'right-0 w-max max-w-[min(360px,calc(100vw-32px))]' : 'left-0 w-full'}`}
        >
          {withSearch && (
            <div className="border-b border-sand-200 p-2">
              <div className="relative">
                <Icon name="search" size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={visible[active] ? `${id}-opt-${active}` : undefined}
                  aria-label="Filtrer la liste"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onListKey}
                  placeholder="Rechercher…"
                  className="h-10 w-full rounded-xl bg-sand-50 pr-3 pl-9 text-[15px] outline-none placeholder:text-[#6A7A86] focus:bg-sand-100"
                />
              </div>
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={withSearch ? -1 : 0}
            aria-labelledby={labelledBy}
            aria-label={ariaLabel}
            aria-activedescendant={!withSearch && visible[active] ? `${id}-opt-${active}` : undefined}
            onKeyDown={withSearch ? undefined : onListKey}
            className="max-h-[288px] overflow-y-auto overscroll-contain p-1.5 outline-none"
          >
            {visible.length === 0 && <li className="px-3 py-3 text-sm text-muted">Aucun résultat</li>}
            {visible.map((o, i) => {
              const isSelected = o.value === value;
              const isActive = i === active;
              return (
                <li
                  key={o.value || '__empty'}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[15px] transition-colors ${
                    isActive ? 'bg-sand-100' : ''
                  } ${isSelected ? 'font-semibold text-navy' : 'text-ink'}`}
                >
                  {o.swatch !== undefined && <span className="size-2.5 shrink-0 rounded-full" style={{ background: o.swatch }} aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${o.value === '' && placeholder !== undefined ? 'text-muted' : ''}`}>{o.label}</span>
                    {o.hint && <span className="block truncate text-[12.5px] font-normal text-muted">{o.hint}</span>}
                  </span>
                  {o.count !== undefined && <span className="font-mono text-[12.5px] font-normal text-muted">{o.count}</span>}
                  <Icon name="check" size={17} className={`text-bordeaux ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={2.4} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
