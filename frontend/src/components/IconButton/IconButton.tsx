import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Obrigatório: descreve a ação para leitores de tela ("Voltar", "Fechar"...). */
  label: string;
  /** "plain" = só o ícone (voltar/fechar); "outlined" = círculo com borda (stepper). */
  variant?: 'plain' | 'outlined';
  size?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'plain', size = 24, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconButton, styles[variant], className)}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
});
