import { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { IconPlus, IconSearch, IconUsers, IconUserPlus, IconMail } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClock, gruss, namen } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { kursteilnehmer } = data;
  const crud = useEntityCrud(data);
  const clock = useClock();
  const [query, setQuery] = useState('');
  const [onlyRecent, setOnlyRecent] = useState(false);

  const sorted = useMemo(
    () => [...kursteilnehmer].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [kursteilnehmer],
  );

  const weekAgoKey = format(subDays(clock, 7), 'yyyy-MM-dd');
  const recent = useMemo(
    () => sorted.filter(r => (r.created_at ?? '').slice(0, 10) >= weekAgoKey),
    [sorted, weekAgoKey],
  );

  const rows = useMemo(() => {
    const base = onlyRecent ? recent : sorted;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(r =>
      [r.fields.vorname, r.fields.nachname, r.fields.email].some(v => (v ?? '').toLowerCase().includes(q)),
    );
  }, [sorted, recent, onlyRecent, query]);

  const fullName = (r: (typeof kursteilnehmer)[number]) =>
    `${r.fields.vorname ?? ''} ${r.fields.nachname ?? ''}`.trim();

  const contextLine =
    sorted.length === 0
      ? tx('Noch keine Anmeldungen — sobald sich jemand einträgt, erscheint er hier.')
      : recent.length > 0
        ? tx`Neu dabei: ${namen(recent.map(r => r.fields.vorname ?? ''))} — insgesamt ${sorted.length} Anmeldungen.`
        : tx`Zuletzt angemeldet: ${namen([sorted[0].fields.vorname ?? ''])} — insgesamt ${sorted.length} Anmeldungen.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{contextLine}</p>
        </div>
        {crud.kursteilnehmer.canWrite && (
          <Button onClick={() => crud.kursteilnehmer.openCreate({})}>
            <IconPlus size={16} className="shrink-0" />
            {tx('Teilnehmer hinzufügen')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        kpis={
          sorted.length > 0 ? (
            <StatStrip>
              <StatStripItem
                title={tx('Anmeldungen')}
                value={sorted.length}
                icon={<IconUsers size={18} className="text-muted-foreground" />}
                onClick={() => setOnlyRecent(false)}
                active={!onlyRecent}
              />
              <StatStripItem
                title={tx('Neu (7 Tage)')}
                value={recent.length}
                tone={recent.length > 0 ? 'primary' : 'default'}
                icon={<IconUserPlus size={18} className="text-muted-foreground" />}
                onClick={() => setOnlyRecent(v => !v)}
                active={onlyRecent}
              />
            </StatStrip>
          ) : undefined
        }
        primary={
          // widget-rejected: no widget covers a plain searchable participant list (no date/status/geo field)
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <h2 className="font-semibold">{appLabel('kursteilnehmer')}</h2>
              <div className="relative w-full sm:w-72">
                <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tx('Name oder E-Mail suchen')}
                  className="pl-9"
                />
              </div>
            </div>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <IconUsers size={48} className="text-muted-foreground" stroke={1.5} />
                <p className="text-sm text-muted-foreground">
                  {sorted.length === 0
                    ? tx('Noch keine Anmeldungen. Lege den ersten Teilnehmer an.')
                    : tx('Keine Treffer für diese Auswahl.')}
                </p>
                {sorted.length === 0 && crud.kursteilnehmer.canWrite && (
                  <Button onClick={() => crud.kursteilnehmer.openCreate({})}>
                    <IconPlus size={16} className="shrink-0" />
                    {tx('Ersten Teilnehmer erfassen')}
                  </Button>
                )}
              </div>
            ) : (
              <ul className="divide-y">
                {rows.map(r => (
                  <li key={r.record_id}>
                    <button
                      type="button"
                      onClick={() => crud.kursteilnehmer.openDetail(r)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {(r.fields.vorname?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{fullName(r) || '—'}</div>
                        <div className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                          <IconMail size={14} className="shrink-0" />
                          <span className="truncate">{r.fields.email ?? '—'}</span>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {r.created_at ? format(new Date(r.created_at), 'P', { locale: dateFnsLocale() }) : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      />
      {crud.surfaces}
    </div>
  );
}
