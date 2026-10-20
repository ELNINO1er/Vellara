import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { Select, type SelectOption } from './Select';

interface FieldShellProps {
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (ids: { id: string; labelId: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Libellé + aide + message d'erreur reliés au champ (aria-describedby). */
export function FieldShell({ label, required, hint, error, className = '', children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label id={`${id}-label`} htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
        {required && (
          <span className="text-ember-ink" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children({ id, labelId: `${id}-label`, describedBy, invalid: !!error })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13.5px] font-medium text-ember-ink">
      <Icon name="alert" size={16} className="mt-0.5" />
      {children}
    </p>
  );
}

type Common = { label: ReactNode; required?: boolean; hint?: ReactNode; error?: string; className?: string };

export function TextField({ label, required, hint, error, className, ...input }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} aria-required={required} className="field-control" {...input} />
      )}
    </FieldShell>
  );
}

export function TextAreaField({ label, required, hint, error, className, ...input }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          aria-required={required}
          className="field-control min-h-[120px] resize-y leading-relaxed"
          {...input}
        />
      )}
    </FieldShell>
  );
}

export type Option = SelectOption;

export function SelectField({
  label,
  required,
  hint,
  error,
  className,
  options,
  placeholder,
  value,
  onChange,
  searchable,
}: Common & { options: Option[]; placeholder?: string; value: string; onChange: (value: string) => void; searchable?: boolean }) {
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      {({ id, labelId, describedBy, invalid }) => (
        <Select
          id={id}
          labelledBy={labelId}
          describedBy={describedBy}
          invalid={invalid}
          required={required}
          options={options}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          searchable={searchable}
        />
      )}
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  error,
  className = '',
  ...input
}: { label: ReactNode; error?: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[14.5px] text-ink">
        <input
          id={id}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-bordeaux"
          {...input}
        />
        <span>{label}</span>
      </label>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

/** Liste déroulante compacte pour barres d'outils (nom accessible via `label`). */
export function InlineSelect({
  label,
  options,
  value,
  onChange,
  className = '',
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return <Select variant="toolbar" ariaLabel={label} options={options} value={value} onChange={onChange} className={className} searchable={false} />;
}
