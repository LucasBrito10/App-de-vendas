import type { ReactNode } from 'react';
import { Alert } from '../Alert';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';

export interface ConfirmSheetProps {
  open: boolean;
  title: ReactNode;
  /** O que vai acontecer ("Apaga também as 4 vendas e as parcelas desta cliente."). */
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Requisição em andamento: bloqueia o fechamento e mostra carregando no botão. */
  loading?: boolean;
  /** Mensagem de erro da API, se a exclusão falhar. */
  error?: ReactNode;
}

/** Confirmação de ação destrutiva (excluir venda, cliente, produto, desfazer pagamento). */
export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  error,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      title={title}
      subtitle={description}
      busy={loading}
      footer={
        <>
          <Button variant="destructive" block size="lg" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" block onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
    </BottomSheet>
  );
}
