import type { ReactNode } from 'react';
import { Button, LinkButton } from '../Button';
import { StatusText } from '../StatusText';
import styles from './OverdueCard.module.css';

export interface OverdueCardProps {
  clientName: ReactNode;
  /** Valor da parcela vencida ("R$ 106,20"). */
  amount: ReactNode;
  /** Detalhes da parcela ("Venda #0012 · 2ª de 2 · venceu 02/11"). */
  details: ReactNode;
  daysLate: number;
  /**
   * Link de cobrança (WhatsApp com mensagem pronta). null = cliente sem telefone: botão desativado.
   * Use isto OU onCharge.
   */
  chargeHref?: string | null;
  /** Ação de cobrar personalizada, no lugar de chargeHref. */
  onCharge?: () => void;
  /** Abre o BottomSheet de recebimento. */
  onReceive: () => void;
}

/** Cartão de parcela atrasada na tela "Atrasados", com ações Cobrar / Receber. */
export function OverdueCard({ clientName, amount, details, daysLate, chargeHref, onCharge, onReceive }: OverdueCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.info}>
          <h3 className={styles.name}>{clientName}</h3>
          <p className={styles.details}>{details}</p>
        </div>
        <div className={styles.amounts}>
          <span className={styles.amount}>{amount}</span>
          <StatusText status="overdue">
            {daysLate === 1 ? '1 dia de atraso' : `${daysLate} dias de atraso`}
          </StatusText>
        </div>
      </div>
      <div className={styles.actions}>
        {chargeHref ? (
          <LinkButton variant="secondary" block href={chargeHref}>
            Cobrar
          </LinkButton>
        ) : (
          <Button variant="secondary" block onClick={onCharge} disabled={!onCharge} title={onCharge ? undefined : 'Cliente sem telefone'}>
            Cobrar
          </Button>
        )}
        <Button variant="primary" block onClick={onReceive}>
          Receber
        </Button>
      </div>
    </article>
  );
}
