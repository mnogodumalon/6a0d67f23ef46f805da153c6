import { useDashboardData } from '@/hooks/useDashboardData';
import type { Testererfassung } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TestererfassungDialog } from '@/components/dialogs/TestererfassungDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconSearch, IconUsers,
  IconMail, IconPhone, IconCalendar, IconCategory, IconX,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a0d67f23ef46f805da153c6';
const REPAIR_ENDPOINT = '/claude/build/repair';

const KATEGORIE_COLORS: Record<string, string> = {
  option_a: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  option_b: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  option_c: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function DashboardOverview() {
  const { testererfassung, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [filterKat, setFilterKat] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Testererfassung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testererfassung | null>(null);

  const kategorieOptions = LOOKUP_OPTIONS['testererfassung']?.['kategorie'] ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return testererfassung.filter(r => {
      if (filterKat && r.fields.kategorie?.key !== filterKat) return false;
      if (!q) return true;
      const haystack = [
        r.fields.vorname,
        r.fields.nachname,
        r.fields.email,
        r.fields.telefon,
        r.fields.bemerkungen,
        r.fields.kategorie?.label,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [testererfassung, search, filterKat]);

  const totalCount = testererfassung.length;
  const countByKat = useMemo(() => {
    const m: Record<string, number> = {};
    testererfassung.forEach(r => {
      const k = r.fields.kategorie?.key ?? 'unbekannt';
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [testererfassung]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTestererfassungEntry(deleteTarget.record_id);
    fetchAll();
    setDeleteTarget(null);
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Testererfassung</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle erfassten Personen verwalten</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <IconPlus size={16} className="mr-2 shrink-0" />
          Neue Person
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gesamt"
          value={String(totalCount)}
          description="Einträge insgesamt"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        {kategorieOptions.map(opt => (
          <StatCard
            key={opt.key}
            title={opt.label}
            value={String(countByKat[opt.key] ?? 0)}
            description="in dieser Kategorie"
            icon={<IconCategory size={18} className="text-muted-foreground" />}
          />
        ))}
      </div>

      {/* Filter + Search Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen nach Name, E-Mail, Telefon…"
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterKat('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filterKat === '' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            Alle
          </button>
          {kategorieOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilterKat(filterKat === opt.key ? '' : opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filterKat === opt.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(search || filterKat) && (
          <button
            onClick={() => { setSearch(''); setFilterKat(''); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconX size={14} />
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-dashed bg-muted/30">
          <IconUsers size={48} stroke={1.5} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {testererfassung.length === 0 ? 'Noch keine Personen erfasst.' : 'Keine Einträge gefunden.'}
          </p>
          {testererfassung.length === 0 && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <IconPlus size={14} className="mr-1" /> Erste Person anlegen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => (
            <PersonCard
              key={r.record_id}
              record={r}
              onEdit={() => setEditRecord(r)}
              onDelete={() => setDeleteTarget(r)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TestererfassungDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createTestererfassungEntry(fields);
          fetchAll();
        }}
        enablePhotoScan={AI_PHOTO_SCAN['Testererfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Testererfassung']}
      />

      {editRecord && (
        <TestererfassungDialog
          open={!!editRecord}
          onClose={() => setEditRecord(null)}
          onSubmit={async (fields) => {
            await LivingAppsService.updateTestererfassungEntry(editRecord.record_id, fields);
            fetchAll();
          }}
          defaultValues={editRecord.fields}
          enablePhotoScan={AI_PHOTO_SCAN['Testererfassung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Testererfassung']}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Person löschen"
        description={`Soll "${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''}" wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function PersonCard({
  record,
  onEdit,
  onDelete,
}: {
  record: Testererfassung;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { vorname, nachname, email, telefon, geburtsdatum, kategorie, bemerkungen } = record.fields;
  const initials = `${(vorname ?? '?')[0]}${(nachname ?? '')[0] ?? ''}`.toUpperCase();
  const katColorClass = KATEGORIE_COLORS[kategorie?.key ?? ''] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {[vorname, nachname].filter(Boolean).join(' ') || '—'}
          </p>
          {kategorie && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border mt-1 ${katColorClass}`}>
              {kategorie.label}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 pb-3 space-y-1.5 flex-1">
        {email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <IconMail size={14} className="shrink-0" />
            <a href={`mailto:${email}`} className="truncate hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
              {email}
            </a>
          </div>
        )}
        {telefon && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <IconPhone size={14} className="shrink-0" />
            <a href={`tel:${telefon}`} className="truncate hover:text-foreground transition-colors" onClick={e => e.stopPropagation()}>
              {telefon}
            </a>
          </div>
        )}
        {geburtsdatum && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconCalendar size={14} className="shrink-0" />
            <span>{formatDate(geburtsdatum)}</span>
          </div>
        )}
        {bemerkungen && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{bemerkungen}</p>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-border mt-auto">
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
          <IconPencil size={14} className="mr-1.5 shrink-0" />
          Bearbeiten
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
          <IconTrash size={16} />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet…');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte Seite neu laden.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" /> Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Repariere…' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte Support kontaktieren.</p>}
    </div>
  );
}
