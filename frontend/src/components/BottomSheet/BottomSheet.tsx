import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../IconButton';
import styles from './BottomSheet.module.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Linha abaixo do título ("Venda #0019 · Carla Menezes · R$ 114,18"). */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Ações fixas no fim (ex.: "Confirmar pagamento" + "Cancelar"). */
  footer?: ReactNode;
  /**
   * Enquanto true (ex.: pagamento sendo enviado), o painel não fecha por X, Esc ou toque fora,
   * para a pessoa não perder o retorno da requisição.
   */
  busy?: boolean;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Painel que sobe de baixo sobre a tela (Receber parcela, Adicionar item). */
export function BottomSheet({ open, onClose, title, subtitle, children, footer, busy = false }: BottomSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;
  const requestClose = () => {
    if (!busyRef.current) onCloseRef.current();
  };

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foca o primeiro campo; se não houver, o próprio painel.
    const sheet = sheetRef.current;
    const firstField = sheet?.querySelector<HTMLElement>('input, select, textarea');
    (firstField ?? sheet)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!busyRef.current) onCloseRef.current();
        return;
      }
      // Mantém o Tab dentro do painel.
      if (event.key === 'Tab' && sheet) {
        const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => !el.hasAttribute('disabled'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.root}>
      <div className={styles.overlay} onClick={requestClose} aria-hidden />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        tabIndex={-1}
      >
        <div className={styles.handle} aria-hidden />
        <header className={styles.header}>
          <div className={styles.headings}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <IconButton icon="close" label="Fechar" onClick={requestClose} disabled={busy} className={styles.close} />
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
