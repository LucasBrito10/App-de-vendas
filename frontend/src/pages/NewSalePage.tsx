import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  BottomSheet,
  Button,
  ConfirmSheet,
  EmptyState,
  List,
  ListItem,
  Page,
  PickerField,
  SearchField,
  Section,
  StatusText,
  Stepper,
  StickyFooter,
  TopBar,
} from '../components';
import { useNewSale } from '../hooks';
import { formatCurrency, formatDate, formatPhone } from '../lib/format';
import { DAYS_BETWEEN_INSTALLMENTS } from '../lib/sale';
import { useGoBack } from './shared/navigation';
import { paths } from './shared/paths';
import { ScreenState } from './shared/ScreenState';

export function NewSalePage() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams, setSearchParams] = useSearchParams();

  // ?nova=1 começa do zero; ?clienteId=N começa já com o cliente; sem nada continua o rascunho.
  const [startOptions] = useState(() => {
    const clientParam = Number(searchParams.get('clienteId'));
    return {
      fresh: searchParams.has('nova'),
      startWithClientId: Number.isInteger(clientParam) && clientParam > 0 ? clientParam : undefined,
    };
  });
  const sale = useNewSale(startOptions);

  // Tira os parâmetros da URL: ao voltar de "Novo produto", a tela continua o rascunho em vez de zerar.
  useEffect(() => {
    if (searchParams.has('nova') || searchParams.has('clienteId')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const [sheet, setSheet] = useState<'client' | 'product' | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function close() {
    if (sale.hasChanges) setConfirmDiscard(true);
    else {
      sale.discard();
      goBack(paths.sales);
    }
  }

  async function save() {
    const created = await sale.submit();
    if (created) navigate(paths.sale(created.sale.saleId), { replace: true });
  }

  const [first, ...rest] = sale.installments;
  const installmentsTitle = !first
    ? `${sale.installmentCount === 1 ? 'À vista' : `${sale.installmentCount} parcelas`}`
    : sale.installmentCount === 1
      ? `À vista: ${formatCurrency(first.amount)}`
      : rest.every((r) => r.amount === first.amount)
        ? `${sale.installmentCount}x de ${formatCurrency(first.amount)}`
        : `1ª de ${formatCurrency(first.amount)} e ${rest.length} de ${formatCurrency(rest[0].amount)}`;
  const installmentsSubtitle = !first
    ? 'Adicione itens para ver os valores.'
    : sale.installmentCount === 1
      ? `Vence em ${formatDate(first.dueDate)}.`
      : `1ª vence em ${formatDate(first.dueDate)}, as outras a cada ${DAYS_BETWEEN_INSTALLMENTS} dias.`;

  const clientOptions = sale.clientOptions;

  return (
    <>
      <Page withFooter>
        <TopBar navigation="close" title="Nova venda" onNavigate={close} />
        <ScreenState loading={sale.loading} error={sale.error} hasData={!sale.loading}>
          <PickerField
            label="Cliente"
            value={sale.client?.name}
            placeholder="Escolher cliente"
            onPick={() => setSheet('client')}
            error={sale.errors.client}
          />

          <Section title="Itens" footnote={sale.lines.length > 0 ? 'Para remover um item, diminua até zero.' : undefined}>
            {sale.lines.length > 0 && (
              <List>
                {sale.lines.map((line) => (
                  <ListItem
                    key={line.productId}
                    title={line.name}
                    subtitle={`${line.quantity} × ${formatCurrency(line.unitPrice)} = ${formatCurrency(line.subtotal)}`}
                    action={
                      <Stepper
                        label={`Quantidade de ${line.name}`}
                        value={line.quantity}
                        onChange={(q) => sale.setQuantity(line.productId, q)}
                      />
                    }
                  />
                ))}
              </List>
            )}
            <Button variant="dashed" block onClick={() => setSheet('product')}>
              Adicionar item
            </Button>
            {sale.errors.items && <Alert>{sale.errors.items}</Alert>}
          </Section>

          <Section title="Parcelas">
            <List>
              <ListItem
                title={installmentsTitle}
                subtitle={installmentsSubtitle}
                action={
                  <Stepper
                    label="Número de parcelas"
                    min={1}
                    max={sale.maxInstallments}
                    value={sale.installmentCount}
                    onChange={sale.setInstallmentCount}
                  />
                }
              />
            </List>
          </Section>

          {sale.submitError && <Alert>{sale.submitError}</Alert>}
        </ScreenState>
      </Page>

      <StickyFooter
        summaryLabel={`${sale.units} ${sale.units === 1 ? 'unidade' : 'unidades'}`}
        summaryValue={formatCurrency(sale.total)}
      >
        <Button block size="lg" onClick={() => void save()} loading={sale.submitting}>
          Salvar venda
        </Button>
      </StickyFooter>

      {/* Escolher cliente */}
      <BottomSheet
        open={sheet === 'client'}
        onClose={() => setSheet(null)}
        title="Escolher cliente"
        footer={
          <Button variant="link" block onClick={() => navigate(paths.newClient('venda'))}>
            Cadastrar novo cliente
          </Button>
        }
      >
        <SearchField placeholder="Buscar por nome ou telefone" value={sale.clientSearch} onChange={(e) => sale.setClientSearch(e.target.value)} />
        {clientOptions.length === 0 ? (
          <EmptyState title={sale.clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'} />
        ) : (
          <List>
            {clientOptions.map((c) => (
              <ListItem
                key={c.clientId}
                title={c.name}
                subtitle={c.phone ? formatPhone(c.phone) : 'Sem telefone'}
                valueCaption={c.clientId === sale.client?.clientId && <StatusText status="paid">Escolhido</StatusText>}
                onClick={() => {
                  sale.selectClient(c.clientId);
                  setSheet(null);
                }}
              />
            ))}
          </List>
        )}
      </BottomSheet>

      {/* Adicionar item */}
      <BottomSheet
        open={sheet === 'product'}
        onClose={() => setSheet(null)}
        title="Adicionar item"
        footer={
          <Button variant="link" block onClick={() => navigate(paths.newProduct('venda'))}>
            Cadastrar novo produto
          </Button>
        }
      >
        <SearchField placeholder="Buscar produto" value={sale.productSearch} onChange={(e) => sale.setProductSearch(e.target.value)} />
        {sale.productOptions.length === 0 ? (
          <EmptyState title="Nenhum produto encontrado" />
        ) : (
          <List>
            {sale.productOptions.map(({ product, inSale, disabled }) => (
              <ListItem
                key={product.id}
                title={product.name}
                subtitle={product.price == null ? 'Sem preço cadastrado' : formatCurrency(product.price)}
                valueCaption={
                  inSale ? <StatusText status="paid">Na venda</StatusText> : disabled ? <StatusText status="paid">Indisponível</StatusText> : undefined
                }
                action={
                  !inSale &&
                  !disabled && (
                    <Button variant="soft" size="sm" onClick={() => sale.addProduct(product.id)}>
                      Adicionar
                    </Button>
                  )
                }
              />
            ))}
          </List>
        )}
      </BottomSheet>

      <ConfirmSheet
        open={confirmDiscard}
        title="Descartar esta venda?"
        description="Os itens escolhidos serão perdidos."
        confirmLabel="Descartar"
        onConfirm={() => {
          setConfirmDiscard(false);
          sale.discard();
          goBack(paths.sales);
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
