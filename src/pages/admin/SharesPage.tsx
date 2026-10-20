import { useMemo, useState } from 'react';
import { ShareDialog } from '../../components/share/ShareDialog';
import { Button, IconButton } from '../../components/ui/Button';
import { ConfirmDialog, EmptyState } from '../../components/ui/Feedback';
import { InlineSelect } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { formatLongDate, formatShortDate } from '../../lib/date';
import { shareStatus, shareUrl, type ShareStatus } from '../../lib/share';
import { normalize, plural } from '../../lib/text';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { DoctorShare } from '../../types/catalog';

const STATUS_STYLE: Record<ShareStatus, { label: string; cls: string }> = {
  active: { label: 'Actif', cls: 'bg-sky-50 text-[#0B3F5C]' },
  expired: { label: 'Expiré', cls: 'bg-[#EDEDED] text-ink-soft' },
  revoked: { label: 'Désactivé', cls: 'bg-danger-50 text-ember-ink' },
};

/** Suivi des fiches partagées aux médecins : consultations, copie du lien, désactivation. */
export function SharesPage() {
  useDocumentTitle('Partages médecins');
  const { data, revokeShare } = useCatalog();
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<DoctorShare | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const nameOf = (id: string) => data.medicines.find((m) => m.id === id)?.name ?? 'Fiche supprimée';

  const rows = useMemo(() => {
    const query = normalize(q.trim());
    return data.shares.filter(
      (s) =>
        (!status || shareStatus(s) === status) &&
        (!query || [s.recipientName, s.recipientEmail, s.specialty, nameOf(s.medicineId)].some((f) => normalize(f).includes(query))),
    );
  }, [data.shares, data.medicines, q, status]);

  const active = data.shares.filter((s) => shareStatus(s) === 'active').length;
  const totalViews = data.shares.reduce((sum, s) => sum + s.views, 0);
  const opened = data.shares.filter((s) => s.views > 0).length;

  async function copy(s: DoctorShare) {
    try {
      await navigator.clipboard.writeText(shareUrl(s.token));
      notify(`Lien de ${s.recipientName} copié.`);
    } catch {
      notify(`Copie impossible. Lien : ${shareUrl(s.token)}`, 'info');
    }
  }

  return (
    <>
      <AdminHeader
        title="Partages médecins"
        subtitle="Fiches transmises nominativement, avec leur suivi de consultation."
        actions={
          <Button icon="send" onClick={() => setDialogOpen(true)}>
            Partager une fiche
          </Button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Liens actifs', value: active, sub: plural(data.shares.length, 'partage au total', 'partages au total') },
          { label: 'Consultations', value: totalViews, sub: 'ouvertures des liens' },
          { label: 'Taux d’ouverture', value: `${data.shares.length ? Math.round((opened * 100) / data.shares.length) : 0} %`, sub: `${opened} médecin(s) ont consulté` },
        ].map((k) => (
          <div key={k.label} className="surface flex flex-col gap-1 px-6 py-5">
            <span className="text-[15px] font-semibold text-navy">{k.label}</span>
            <span className="mt-2 text-[48px] leading-none font-extrabold text-navy [font-stretch:68%]">{k.value}</span>
            <span className="text-[13.5px] text-muted">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div role="search" className="relative flex-[1_1_280px]">
          <label htmlFor="share-search" className="sr-only">
            Rechercher un partage
          </label>
          <Icon name="search" className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
          <input
            id="share-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Médecin, e-mail, spécialité, médicament…"
            className="field-control h-12 rounded-full pl-12"
          />
        </div>
        <InlineSelect
          label="Filtrer par statut"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'active', label: 'Actifs', swatch: '#669BBC' },
            { value: 'expired', label: 'Expirés', swatch: '#B8B8B8' },
            { value: 'revoked', label: 'Désactivés', swatch: '#C1121F' },
          ]}
        />
      </div>

      {data.shares.length === 0 ? (
        <EmptyState title="Aucune fiche partagée" action={<Button icon="send" onClick={() => setDialogOpen(true)}>Partager une fiche</Button>}>
          Envoyez à un médecin un lien personnel vers une fiche complète, avec sa vidéo et ses documents.
        </EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState title="Aucun partage ne correspond">Modifiez la recherche ou le filtre.</EmptyState>
      ) : (
        <div className="surface relative overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[14.5px]">
            <caption className="sr-only">Liste des partages ({rows.length})</caption>
            <thead>
              <tr className="bg-[#FFFBF3] text-left text-[11.5px] tracking-[0.12em] whitespace-nowrap text-muted uppercase">
                {['Médecin', 'Médicament', 'Envoyé le', 'Expire le', 'Consultations', 'Statut'].map((h) => (
                  <th key={h} scope="col" className="border-b border-sand-200 px-4 py-3.5 font-semibold">
                    {h}
                  </th>
                ))}
                <th scope="col" className="border-b border-sand-200 px-4 py-3.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const st = shareStatus(s);
                return (
                  <tr key={s.id} className="border-b border-[#F1E7D3] transition-colors last:border-0 hover:bg-[#FFFBF3]">
                    <td className="px-4 py-3">
                      <strong className="block font-semibold text-navy">{s.recipientName}</strong>
                      <small className="block text-[13px] text-muted">
                        {s.specialty ? `${s.specialty} · ` : ''}
                        {s.recipientEmail}
                      </small>
                    </td>
                    <td className="px-4 py-3">{nameOf(s.medicineId)}</td>
                    <td className="px-4 py-3 font-mono text-[13.5px]">{formatShortDate(s.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-[13.5px]">{formatShortDate(s.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-navy">{s.views}</span>
                      {s.lastViewedAt && <small className="block text-[12.5px] text-muted">dernière : {formatLongDate(s.lastViewedAt)}</small>}
                      {!s.lastViewedAt && <small className="block text-[12.5px] text-muted">pas encore ouvert</small>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ${STATUS_STYLE[st].cls}`}>{STATUS_STYLE[st].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton icon="copy" label={`Copier le lien de ${s.recipientName}`} onClick={() => copy(s)} disabled={st !== 'active'} />
                        <a
                          href={shareUrl(s.token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Voir la page de ${s.recipientName} (nouvel onglet)`}
                          title="Voir comme le médecin"
                          className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sand-100 hover:text-navy"
                        >
                          <Icon name="eye" size={19} />
                        </a>
                        {st === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => setToRevoke(s)}>
                            Désactiver
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ShareDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <ConfirmDialog
        open={!!toRevoke}
        icon="lock"
        title="Désactiver ce lien ?"
        confirmLabel="Désactiver le lien"
        onCancel={() => setToRevoke(null)}
        onConfirm={() => {
          if (toRevoke) {
            revokeShare(toRevoke.id);
            notify(`Le lien de ${toRevoke.recipientName} est désactivé.`);
          }
          setToRevoke(null);
        }}
      >
        {toRevoke?.recipientName} ne pourra plus consulter la fiche « {toRevoke ? nameOf(toRevoke.medicineId) : ''} ». Cette action est définitive ; vous
        pourrez créer un nouveau lien si besoin.
      </ConfirmDialog>
    </>
  );
}
