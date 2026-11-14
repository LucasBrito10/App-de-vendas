// Galeria de desenvolvimento: remonta telas do layout usando só a camada de componentes.
// Navegue com #inicio, #clientes, #cliente, #venda, #receber, #atrasados, #vendas,
// #editar-cliente, #nova-venda, #adicionar-item, #exportar, #produtos, #novo-produto, #estados.
// Remova este arquivo quando as páginas reais forem criadas.
import { useEffect, useState } from 'react';
import {
  Alert,
  AmountHeader,
  BottomNav,
  BottomSheet,
  Button,
  CheckboxListItem,
  ChipGroup,
  ConfirmSheet,
  DangerZone,
  EmptyState,
  Fab,
  HelperText,
  LinkButton,
  List,
  ListItem,
  LoadingState,
  OverdueCard,
  Page,
  PageHeader,
  PickerField,
  SearchField,
  Section,
  StatCard,
  StatGrid,
  StatusText,
  Stepper,
  StickyFooter,
  SummaryStats,
  TextField,
  TopBar,
} from '../components';
import { todayIso } from '../lib/date';
import { formatCurrency, formatDate, formatOrdinal } from '../lib/format';
import { multiplyMoney, sumMoney } from '../lib/money';
import { MAX_INSTALLMENTS, previewInstallments } from '../lib/sale';

const noop = () => {};
const go = (screen: string) => () => {
  window.location.hash = screen;
};
const hashLink = ({ href, ...props }: { href: string; className?: string; children: React.ReactNode }) => (
  <a href={`#${href === '/' ? 'inicio' : href.slice(1)}`} {...props} />
);

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || 'inicio');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1) || 'inicio');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

function Inicio() {
  return (
    <>
      <Page withBottomNav withFab>
        <PageHeader eyebrow="Dados de exemplo" title="Início" />
        <StatCard tone="highlight" size="lg" label="Vendido no mês" value={formatCurrency(3888.4)} caption="20 vendas registradas" />
        <StatGrid>
          <StatCard label="Clientes" value="6" />
          <StatCard tone="warning" label="Atrasados" value="2 clientes" caption="R$ 196,10 vencidos" onClick={go('atrasados')} />
        </StatGrid>
        <Section title="Últimas vendas" aside={<Button variant="link" size="sm" onClick={go('vendas')}>Ver todas</Button>}>
          <List>
            <ListItem title="Elisa Ramos" subtitle="Hoje · à vista" value="R$ 186,00" onClick={noop} />
            <ListItem title="Carla Menezes" subtitle="Ontem · 3 parcelas" value="R$ 342,50" valueCaption={<StatusText status="open" />} onClick={go('venda')} />
            <ListItem title="Ana Souza" subtitle="12/11 · à vista" value="R$ 129,90" onClick={noop} />
          </List>
        </Section>
      </Page>
      <Fab onClick={go('nova-venda')}>Nova venda</Fab>
      <BottomNav activeKey="inicio" linkComponent={hashLink} />
    </>
  );
}

function Clientes() {
  const clients = [
    ['Ana Souza', '(75) 99134-2207', false],
    ['Bruno Lima', '(75) 98820-5531', true],
    ['Carla Menezes', '(75) 99812-4410', false],
    ['Diego Santos', '(71) 99301-7782', true],
    ['Elisa Ramos', '(75) 99245-0918', false],
  ] as const;
  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Clientes" action={<Button variant="link" onClick={go('editar-cliente')}>Novo cliente</Button>} />
        <SearchField placeholder="Buscar por nome ou telefone" />
        <List>
          {clients.map(([name, phone, late]) => (
            <ListItem key={name} title={name} subtitle={phone} valueCaption={late && <StatusText status="overdue">Atrasado</StatusText>} onClick={go('cliente')} />
          ))}
        </List>
      </Page>
      <BottomNav activeKey="clientes" linkComponent={hashLink} />
    </>
  );
}

function Cliente() {
  return (
    <>
      <Page withFooter>
        <TopBar onNavigate={go('clientes')} action={<Button variant="link" onClick={go('editar-cliente')}>Editar</Button>} />
        <PageHeader title="Carla Menezes" description="(75) 99812-4410" />
        <StatGrid>
          <Button variant="secondary" block>Ligar</Button>
          <Button variant="secondary" block>WhatsApp</Button>
        </StatGrid>
        <SummaryStats
          items={[
            { label: 'Total comprado', value: 'R$ 792,40' },
            { label: 'Vendas', value: '4' },
            { label: 'Em aberto', value: 'R$ 342,50', tone: 'open' },
          ]}
        />
        <Section title="Vendas">
          <List>
            <ListItem title="13/11/2026" subtitle="#0019 · 3 parcelas" value="R$ 342,50" valueCaption={<StatusText status="open" />} onClick={go('venda')} />
            <ListItem title="28/10/2026" subtitle="#0013 · à vista" value="R$ 186,30" valueCaption={<StatusText status="paid" />} onClick={noop} />
          </List>
        </Section>
      </Page>
      <StickyFooter>
        <Button block size="lg" onClick={go('nova-venda')}>Nova venda para Carla</Button>
      </StickyFooter>
    </>
  );
}

function Venda({ sheetOpen }: { sheetOpen: boolean }) {
  return (
    <Page>
      <TopBar title="Venda #0019" onNavigate={go('inicio')} />
      <AmountHeader
        amount="R$ 342,50"
        status={<StatusText status="open" size="md" />}
        meta={<>13/11/2026 · <Button variant="link" size="sm" style={{ minHeight: 0, padding: 0 }}>Carla Menezes</Button></>}
      />
      <Section title="Parcelas" aside="0 de 3 pagas">
        <List>
          <ListItem title="1ª parcela · R$ 114,18" subtitle="Vence em 13/12/2026" action={<Button variant="soft" size="sm" onClick={go('receber')}>Receber</Button>} />
          <ListItem title="2ª parcela · R$ 114,16" subtitle="Vence em 12/01/2027" action={<Button variant="soft" size="sm">Receber</Button>} />
          <ListItem title="3ª parcela · R$ 114,16" subtitle="Vence em 11/02/2027" action={<Button variant="soft" size="sm">Receber</Button>} />
        </List>
      </Section>
      <Section title="Itens" aside="5 unidades">
        <List>
          <ListItem title="Camiseta básica" subtitle="2 × R$ 59,90" value="R$ 119,80" />
          <ListItem title="Boné aba reta" subtitle="1 × R$ 39,90" value="R$ 39,90" />
        </List>
      </Section>
      <DangerZone actionLabel="Excluir venda" onAction={noop} description="Uma venda registrada não pode ser editada. Para corrigir, exclua e registre de novo." />
      <BottomSheet
        open={sheetOpen}
        onClose={go('venda')}
        title="Receber 1ª parcela"
        subtitle="Venda #0019 · Carla Menezes · R$ 114,18"
        footer={
          <>
            <Button block size="lg">Confirmar pagamento</Button>
            <Button variant="ghost" block onClick={go('venda')}>Cancelar</Button>
          </>
        }
      >
        <TextField label="Valor recebido (R$)" defaultValue="114,18" inputMode="decimal" emphasized />
        <TextField label="Data do pagamento" type="date" defaultValue={todayIso()} max={todayIso()} hint="Não pode ser uma data futura." />
      </BottomSheet>
    </Page>
  );
}

function Atrasados() {
  return (
    <Page>
      <TopBar title="Atrasados" onNavigate={go('inicio')} />
      <StatCard tone="warning" label="Total vencido" value="R$ 196,10" caption="2 clientes · 2 parcelas" />
      <HelperText>Mais antigas primeiro</HelperText>
      <OverdueCard clientName="Bruno Lima" amount="R$ 106,20" details="Venda #0012 · 2ª de 2 · venceu 02/11" daysLate={12} onCharge={noop} onReceive={noop} />
      <OverdueCard clientName="Diego Santos" amount="R$ 89,90" details="Venda #0015 · à vista · venceu 09/11" daysLate={5} onCharge={noop} onReceive={noop} />
      <HelperText>Uma parcela entra aqui quando passa do vencimento sem pagamento registrado.</HelperText>
    </Page>
  );
}

function Vendas() {
  const [filter, setFilter] = useState<'todas' | 'abertas' | 'atrasadas' | 'pagas'>('todas');
  return (
    <>
      <Page withBottomNav withFab>
        <PageHeader title="Vendas" />
        <ChipGroup
          label="Filtrar vendas"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todas', label: 'Todas' },
            { value: 'abertas', label: 'Em aberto' },
            { value: 'atrasadas', label: 'Atrasadas' },
            { value: 'pagas', label: 'Pagas' },
          ]}
        />
        <List>
          <ListItem title="Elisa Ramos" subtitle="#0020 · 14/11 · à vista" value="R$ 186,00" valueCaption={<StatusText status="paid" />} onClick={noop} />
          <ListItem title="Carla Menezes" subtitle="#0019 · 13/11 · 3 parcelas" value="R$ 342,50" valueCaption={<StatusText status="open" />} onClick={go('venda')} />
          <ListItem title="Diego Santos" subtitle="#0015 · 10/10 · à vista" value="R$ 89,90" valueCaption={<StatusText status="overdue" />} onClick={noop} />
        </List>
      </Page>
      <Fab onClick={go('nova-venda')}>Nova venda</Fab>
      <BottomNav activeKey="vendas" linkComponent={hashLink} />
    </>
  );
}

function EditarCliente() {
  const [confirming, setConfirming] = useState(false);
  return (
    <Page>
      <TopBar navigation="close" title="Editar cliente" onNavigate={go('cliente')} action={<Button size="sm">Salvar</Button>} />
      <TextField label="Nome" defaultValue="Carla Menezes" autoComplete="name" />
      <TextField label="Telefone" defaultValue="(75) 99812-441" type="tel" inputMode="tel" error="Telefone incompleto." />
      <DangerZone pushToBottom actionLabel="Excluir cliente" onAction={() => setConfirming(true)} description="Apaga também as 4 vendas e as parcelas desta cliente." />
      <ConfirmSheet
        open={confirming}
        title="Excluir Carla Menezes?"
        description="As 4 vendas e as parcelas desta cliente também serão apagadas. Não dá para desfazer."
        confirmLabel="Excluir cliente"
        onConfirm={noop}
        onCancel={() => setConfirming(false)}
        error="Não foi possível excluir. Tente de novo."
      />
    </Page>
  );
}

const CATALOG = [
  { id: 4, name: 'Camiseta básica', price: 59.9 },
  { id: 2, name: 'Boné aba reta', price: 39.9 },
  { id: 6, name: 'Meia esportiva (par)', price: 14.5 },
];

function NovaVenda({ sheetOpen }: { sheetOpen: boolean }) {
  const [qty, setQty] = useState<Record<number, number>>({ 4: 2, 2: 1, 6: 3 });
  const [parcelas, setParcelas] = useState(3);
  const lines = CATALOG.filter((p) => (qty[p.id] ?? 0) > 0);
  const total = sumMoney(lines.map((p) => multiplyMoney(p.price, qty[p.id])));
  const units = lines.reduce((acc, p) => acc + qty[p.id], 0);
  const preview = previewInstallments(total, parcelas, todayIso());
  const first = preview[0];
  const rest = preview.slice(1);
  const parcelasTitle = parcelas === 1
    ? `À vista: ${formatCurrency(total)}`
    : first.amount === rest[0].amount
      ? `${parcelas}x de ${formatCurrency(first.amount)}`
      : `1ª de ${formatCurrency(first.amount)} e ${rest.length} de ${formatCurrency(rest[0].amount)}`;
  // Corpo que a camada service vai enviar no POST /api/v1/sales:
  // { clientId, installmentCount: parcelas, items: lines.map(p => ({ productId: p.id, quantity: qty[p.id] })) }
  return (
    <>
      <Page withFooter>
        <TopBar navigation="close" title="Nova venda" onNavigate={go('inicio')} />
        <PickerField label="Cliente" value="Carla Menezes" onPick={noop} />
        <Section title="Itens" footnote="Para remover um item, diminua até zero.">
          <List>
            {lines.map((p) => (
              <ListItem
                key={p.id}
                title={p.name}
                subtitle={`${qty[p.id]} × ${formatCurrency(p.price)} = ${formatCurrency(multiplyMoney(p.price, qty[p.id]))}`}
                action={<Stepper label={`Quantidade de ${p.name}`} value={qty[p.id]} onChange={(v) => setQty({ ...qty, [p.id]: v })} />}
              />
            ))}
          </List>
          <Button variant="dashed" block onClick={go('adicionar-item')}>Adicionar item</Button>
        </Section>
        <Section title="Parcelas">
          <List>
            <ListItem
              title={parcelasTitle}
              subtitle={parcelas === 1 ? `Vence em ${formatDate(first.dueDate)}.` : `${formatOrdinal(1)} vence em ${formatDate(first.dueDate)}, as outras a cada 30 dias.`}
              action={<Stepper label="Número de parcelas" min={1} max={MAX_INSTALLMENTS} value={parcelas} onChange={setParcelas} />}
            />
          </List>
        </Section>
      </Page>
      <StickyFooter summaryLabel={`${units} unidades`} summaryValue={formatCurrency(total)}>
        <Button block size="lg" disabled={lines.length === 0}>Salvar venda</Button>
      </StickyFooter>
      <BottomSheet open={sheetOpen} onClose={go('nova-venda')} title="Adicionar item" footer={<Button variant="link" block>Cadastrar novo produto</Button>}>
        <SearchField placeholder="Buscar produto" />
        <List>
          <ListItem title="Bermuda moletom" subtitle="R$ 89,90" action={<Button variant="soft" size="sm">Adicionar</Button>} />
          <ListItem title="Boné aba reta" subtitle="R$ 39,90" valueCaption={<StatusText status="paid">Na venda</StatusText>} />
          <ListItem title="Calça jogger" subtitle="R$ 168,30" action={<Button variant="soft" size="sm">Adicionar</Button>} />
        </List>
      </BottomSheet>
    </>
  );
}

function Exportar() {
  const [period, setPeriod] = useState<'este' | 'passado' | 'outro'>('este');
  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Exportar" description="Gera uma planilha CSV para abrir no Excel ou no Google Planilhas." />
        <Section title="Período" footnote="01/11/2026 a 14/11/2026">
          <ChipGroup
            label="Período"
            layout="fill"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'este', label: 'Este mês' },
              { value: 'passado', label: 'Mês passado' },
              { value: 'outro', label: 'Outro período' },
            ]}
          />
        </Section>
        <Section title="Incluir">
          <List>
            <CheckboxListItem title="Vendas" description="Número, data, cliente e total" defaultChecked />
            <CheckboxListItem title="Itens das vendas" description="Produto, quantidade e preço" defaultChecked />
            <CheckboxListItem title="Parcelas" description="Vencimento, valor e pagamento" />
          </List>
        </Section>
        {/* Download por navegação: é o que aciona o DownloadListener do app Android. */}
        <LinkButton block size="lg" href="/api/v1/export/sales?startDate=2026-11-01&endDate=2026-11-30" download>
          Exportar CSV
        </LinkButton>
      </Page>
      <BottomNav activeKey="exportar" linkComponent={hashLink} />
    </>
  );
}

function Produtos() {
  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Produtos" action={<Button variant="link" onClick={go('novo-produto')}>Novo produto</Button>} />
        <SearchField placeholder="Buscar pelo nome" />
        <List>
          <ListItem compact title="Bermuda moletom" value="R$ 89,90" mutedValue onClick={go('novo-produto')} />
          <ListItem compact title="Boné aba reta" value="R$ 39,90" mutedValue onClick={noop} />
          <ListItem compact title="Jaqueta corta-vento" value="R$ 219,00" mutedValue onClick={noop} />
        </List>
        <HelperText>3 produtos</HelperText>
      </Page>
      <BottomNav activeKey="produtos" linkComponent={hashLink} />
    </>
  );
}

function NovoProduto() {
  return (
    <Page>
      <TopBar navigation="close" title="Novo produto" onNavigate={go('produtos')} action={<Button size="sm">Salvar</Button>} />
      <TextField label="Nome" placeholder="Ex.: Camiseta básica" />
      <TextField label="Preço (R$)" placeholder="0,00" inputMode="decimal" emphasized />
    </Page>
  );
}

function Estados() {
  return (
    <Page>
      <TopBar title="Estados de requisição" onNavigate={go('inicio')} />
      <Section title="Carregando">
        <LoadingState rows={3} />
      </Section>
      <Section title="Vazio">
        <EmptyState title="Nenhuma venda atrasada" description="Quando uma parcela passar do vencimento sem pagamento, ela aparece aqui." />
      </Section>
      <Section title="Erro">
        <Alert action={<Button variant="link" size="sm">Tentar de novo</Button>}>Esta parcela já está paga.</Alert>
      </Section>
    </Page>
  );
}

export function Gallery() {
  const screen = useHash();
  switch (screen) {
    case 'clientes': return <Clientes />;
    case 'cliente': return <Cliente />;
    case 'venda': return <Venda sheetOpen={false} />;
    case 'receber': return <Venda sheetOpen />;
    case 'atrasados': return <Atrasados />;
    case 'vendas': return <Vendas />;
    case 'editar-cliente': return <EditarCliente />;
    case 'nova-venda': return <NovaVenda sheetOpen={false} />;
    case 'adicionar-item': return <NovaVenda sheetOpen />;
    case 'exportar': return <Exportar />;
    case 'produtos': return <Produtos />;
    case 'novo-produto': return <NovoProduto />;
    case 'estados': return <Estados />;
    default: return <Inicio />;
  }
}
