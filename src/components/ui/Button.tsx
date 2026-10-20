import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'accent' | 'navy' | 'ghost' | 'quiet' | 'danger' | 'light' | 'cream';
export type ButtonSize = 'md' | 'lg' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-bordeaux text-white hover:bg-bordeaux-dark',
  accent: 'bg-ember text-white hover:bg-ember-dark',
  navy: 'bg-navy text-white hover:bg-navy-deep',
  ghost: 'border-sand-300 text-navy hover:border-navy hover:bg-white',
  quiet: 'text-navy hover:bg-sand-100',
  danger: 'border-[#E9B9B3] bg-white text-ember-ink hover:border-ember hover:bg-ember hover:text-white',
  light: 'border-white/40 text-white hover:border-white hover:bg-white/10',
  cream: 'bg-cream text-bordeaux hover:bg-white',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3.5 text-[13.5px]',
  md: 'min-h-11 px-[18px] text-[15px]',
  lg: 'min-h-[54px] px-[26px] text-[16.5px]',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', block = false) {
  return [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-transparent font-semibold',
    'transition-[background,border-color,color,transform] duration-150 active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    block ? 'w-full' : '',
  ].join(' ');
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  block,
  icon,
  iconRight,
  children,
  className = '',
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${buttonClasses(variant, size, block)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}

export function ButtonLink({ variant, size, block, icon, iconRight, children, className = '', ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={`${buttonClasses(variant, size, block)} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </Link>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  tone?: 'default' | 'danger';
}

/** Bouton icône 44×44, toujours étiqueté pour l'accessibilité. */
export function IconButton({ icon, label, tone = 'default', className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-11 place-items-center rounded-xl text-ink transition-colors ${
        tone === 'danger' ? 'hover:bg-danger-50 hover:text-ember-ink' : 'hover:bg-sand-100 hover:text-navy'
      } ${className}`}
      {...rest}
    >
      <Icon name={icon} size={19} />
    </button>
  );
}
