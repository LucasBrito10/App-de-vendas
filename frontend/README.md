# Frontend — App de Vendas

React + TypeScript + Vite + React Router. O build vai para `app/src/main/assets/www`, que o `NanoServer` serve no app Android.

## Gerar o APK

Basta o build normal do Android (Android Studio ou `./gradlew assembleDebug`): a tarefa `buildFrontend`
roda `npm ci` + `npm run build` antes, e só refaz quando algo em `frontend/` mudou.
Requer **Node.js 18+** na máquina. Para pular o frontend: `./gradlew assembleDebug -PskipFrontend`.

```bash
npm install
npm run dev        # http://localhost:5173 (precisa da API; a galeria fica em /dev/galeria)
npm run build      # gera app/src/main/assets/www
npm test           # testes da camada service e hooks (Vitest)
```

## Telas (rotas)

| Rota | Tela |
| --- | --- |
| `/` | Início |
| `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar` | Clientes |
| `/vendas`, `/vendas/nova`, `/vendas/:id` | Vendas |
| `/atrasados` | Atrasados |
| `/produtos`, `/produtos/novo`, `/produtos/:id` | Produtos |
| `/exportar` | Exportar |

Os caminhos ficam em `src/pages/shared/paths.ts`; as rotas, em `src/router.tsx`.

## Arquitetura em 3 camadas

```
pages (telas)  →  usam hooks + components
  components   →  interface pura: recebem dados prontos e callbacks
  hooks        →  estado das telas, regras, validação, cache e montagem dos dados
  services     →  uma função por endpoint (HTTP), sem estado nem regra
```

- Uma tela nunca chama `services` direto: sempre por um hook.
- Os hooks de leitura compartilham um cache (`hooks/core/queryCache.ts`). Toda escrita invalida as
  listas afetadas e as telas abertas se atualizam sozinhas.
- Erros chegam prontos para os components: `error`/`saveError` → `<Alert>`, `errors.campo` → `<TextField error>`,
  `loading` → `<LoadingState>`, `saving`/`submitting` → `<Button loading>` / `<BottomSheet busy>`.

| Tela | Hook |
| --- | --- |
| Início | `useDashboard` |
| Clientes / Cliente / Novo e Editar cliente | `useClients`, `useClientDetail`, `useClientForm` |
| Produtos / Novo e Editar produto | `useProducts`, `useProductForm` |
| Vendas / Venda | `useSales`, `useSaleDetail` |
| Receber parcela (sheet) | `usePayment` |
| Atrasados | `useOverdue` |
| Nova venda + Adicionar item | `useNewSale` |
| Exportar | `useExport` |

## Estrutura

- `src/styles/tokens.css` — cores, tipografia, espaçamentos (use sempre as variáveis)
- `src/services/` — camada service: `http.ts` (fetch, erros, timeout) e um módulo por recurso
- `src/hooks/` — camada hooks (ver tabela acima); `hooks/model/` tem as funções puras
- `src/types/api.ts` — **contrato com o backend**: tipos idênticos ao JSON do backend e lista de endpoints
- `src/lib/format.ts` — formatação de moeda, datas, telefone, número da venda e leitura de valores digitados
- `src/lib/date.ts` — datas ISO sem erro de fuso (`todayIso`, `addDays`, `daysBetween`, `monthRange`)
- `src/lib/money.ts` — contas de dinheiro em centavos (sem erro de ponto flutuante)
- `src/lib/sale.ts` — regras espelhadas do `SaleService`: estado da venda/parcela, dias de atraso, prévia das parcelas
- `src/components/` — camada de componentes, exportada por `src/components/index.ts`
- `src/pages/` — as telas (juntam hooks + components) e `pages/shared/` (rotas, voltar, painel de pagamento)
- `src/dev/Gallery.tsx` — galeria de componentes com dados fixos, só no `npm run dev` em `/dev/galeria`

## Componentes

| Grupo | Componentes |
| --- | --- |
| Base | `Icon`, `Button` (primary, secondary, soft, link, ghost, danger, destructive, dashed), `LinkButton`, `IconButton`, `Fab` |
| Layout | `Page`, `PageHeader`, `TopBar`, `BottomNav`, `Section`, `StickyFooter` |
| Dados | `Card`, `List`/`ListItem`, `StatusText`, `StatCard`/`StatGrid`, `SummaryStats`, `AmountHeader`, `HelperText` |
| Formulário | `TextField`, `SearchField`, `PickerField`, `ChipGroup`, `Stepper`, `Checkbox`/`CheckboxListItem` |
| Estados de requisição | `LoadingState`, `EmptyState`, `Alert` |
| Sobreposição | `BottomSheet` (com `busy`), `ConfirmSheet`, `DangerZone` |
| Domínio | `OverdueCard` |

## Regras para a camada service

- Dinheiro chega como número (`342.5`); some com `lib/money.ts`, nunca com `+` direto.
- Datas são `"AAAA-MM-DD"`; "hoje" é `todayIso()`, não `new Date().toISOString()` (que é UTC).
- Erros vêm como `{ "error": "..." }`; mostre o texto em `Alert` ou no `error` do campo.
- `DELETE` responde 204 sem corpo.
- Atualizar cliente/produto é `POST /recurso/{id}`.
- Exportação CSV: navegue até a URL (`LinkButton`); `fetch` não salva o arquivo no Android.
