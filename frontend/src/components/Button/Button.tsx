import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

export type ButtonVariant =
  | 'primary'   // Verde cheio: "Salvar venda", "Confirmar pagamento", "Receber" (atrasados)
  | 'secondary' // Branco com borda: "Ligar", "WhatsApp", "Cobrar"
  | 'soft'      // Verde claro: "Receber" nas parcelas, "Adicionar" no seletor de produto
  | 'link'      // Só texto verde: "Ver todas", "Novo cliente", "Editar", "Trocar"
  | 'ghost'     // Só texto neutro: "Cancelar"
  | 'danger'    // Texto vermelho: "Excluir venda", "Excluir cliente"
  | 'destructive' // Vermelho cheio: confirmação de exclusão
  | 'dashed';   // Borda tracejada: "Adicionar item"

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa toda a largura disponível. */
  block?: boolean;
  /** Mostra estado de carregamento e bloqueia cliques. */
  loading?: boolean;
  leadingIcon?: ReactNode;
}

/** Classes do botão, para reaproveitar o visual em outros elementos (ex.: LinkButton). */
export function buttonClassName(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', block = false): string {
  return cx(styles.button, styles[variant], styles[size], block && styles.block);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    leadingIcon,
    type = 'button',
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClassName(variant, size, block), className)}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : leadingIcon}
      <span>{children}</span>
    </button>
  );
});

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

/**
 * Link com aparência de botão. Use para os downloads de CSV (/api/v1/export/...):
 * o app Android só salva o arquivo quando a WebView NAVEGA até a URL; um fetch não dispara o download.
 */
export function LinkButton({ variant = 'primary', size = 'md', block = false, className, children, ...rest }: LinkButtonProps) {
  return (
    <a className={cx(buttonClassName(variant, size, block), styles.anchor, className)} {...rest}>
      <span>{children}</span>
    </a>
  );
}
