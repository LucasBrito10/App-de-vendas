import { Alert, Button, CheckboxListItem, ChipGroup, List, Page, PageHeader, Section, TextField } from '../components';
import { useExport } from '../hooks';
import { formatDate } from '../lib/format';
import { MainNav } from './shared/MainNav';

export function ExportPage() {
  const e = useExport();
  const count = e.urls.length;

  return (
    <>
      <Page withBottomNav>
        <PageHeader title="Exportar" description="Gera uma planilha CSV para abrir no Excel ou no Google Planilhas." />

        <Section
          title="Período"
          footnote={e.period ? `${formatDate(e.period.startDate)} a ${formatDate(e.period.endDate)}` : undefined}
        >
          <ChipGroup label="Período" layout="fill" options={e.periodOptions} value={e.preset} onChange={e.setPreset} />
          {e.preset === 'custom' && (
            <>
              <TextField label="De" type="date" max={e.maxDate} value={e.custom.startDate ?? ''} onChange={(ev) => e.setCustomStart(ev.target.value)} />
              <TextField
                label="Até"
                type="date"
                max={e.maxDate}
                value={e.custom.endDate ?? ''}
                onChange={(ev) => e.setCustomEnd(ev.target.value)}
                error={e.periodError ?? undefined}
              />
            </>
          )}
        </Section>

        <Section title="Incluir">
          <List>
            {e.options.map((option) => (
              <CheckboxListItem
                key={option.kind}
                title={option.title}
                description={option.description}
                checked={e.selected[option.kind]}
                onChange={(ev) => e.toggle(option.kind, ev.target.checked)}
              />
            ))}
          </List>
        </Section>

        {count > 1 && (
          <Alert tone="info">Serão gerados {count} arquivos. O app vai perguntar onde salvar cada um, um de cada vez.</Alert>
        )}

        <Button block size="lg" disabled={!e.canExport} loading={e.downloading} onClick={() => void e.download()}>
          {count > 1 ? `Exportar ${count} CSVs` : 'Exportar CSV'}
        </Button>
      </Page>
      <MainNav />
    </>
  );
}
