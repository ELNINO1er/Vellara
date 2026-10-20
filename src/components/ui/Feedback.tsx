import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Capsule } from '../brand/Capsule';

/* ——— Statut de publication ——— */
export function StatusBadge({ status }: { status: 'published' | 'draft' | 'new' }) {
  const styles = {
    published: 'bg-sky-50 text-[#0B3F5C]',
    draft: 'bg-cream text-[#6E3300]',
    new: 'bg-[#EDEDED] text-ink-soft',
  }[status];
  const label = { published: 'Publiée', draft: 'Brouillon', new: 'Nouvelle fiche' }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold ${styles}`}>
      <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

/* ——— État vide ——— */
export function EmptyState({
  title,
  children,
  action,
  tone = 'navy',
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: 'navy' | 'bordeaux';
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-sand-300 bg-white px-6 py-14 text-center">
      <Capsule left={tone === 'navy' ? '#003049' : '#780000'} right={tone === 'navy' ? '#669BBC' : '#FDF0D5'} className="mb-4 h-8 w-20" />
      <h2 className="heading-card">{title}</h2>
      {children && <p className="max-w-[46ch] text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ——— Encadré d'information ——— */
export function Notice({ icon = 'info', children, tone = 'sky' }: { icon?: IconName; children: ReactNode; tone?: 'sky' | 'cream' }) {
  return (
    <div
      className={`flex items-start gap-3.5 rounded-[18px] px-5 py-4 text-[15px] leading-normal ${
        tone === 'sky' ? 'bg-sky-50 text-[#0B2A3D]' : 'bg-cream text-[#4A3A22]'
      }`}
    >
      <Icon name={icon} className="mt-px text-navy" />
      <div>{children}</div>
    </div>
  );
}

/* ——— Dialogue de confirmation (élément <dialog> natif : focus piégé, Échap) ——— */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  icon = 'trash',
}: {
  open: boolean;
  icon?: IconName;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      aria-labelledby="confirm-title"
      className="animate-pop m-auto w-[calc(100%-32px)] max-w-[480px] rounded-[26px] bg-white p-0 shadow-[0_40px_80px_-30px_rgba(0,0,0,.5)] backdrop:bg-[rgba(0,26,40,.58)]"
    >
      {open && (
        <div className="p-7">
          <span className="mb-[18px] grid size-[52px] place-items-center rounded-2xl bg-danger-50 text-ember-ink">
            <Icon name={icon} />
          </span>
          <h2 id="confirm-title" className="text-[26px] leading-tight font-bold text-navy [font-stretch:80%]">
            {title}
          </h2>
          <div className="mt-2.5 text-ink-soft">{children}</div>
          <div className="mt-7 flex flex-wrap justify-end gap-2.5">
            <Button variant="ghost" onClick={onCancel} autoFocus>
              Annuler
            </Button>
            <Button variant="accent" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
