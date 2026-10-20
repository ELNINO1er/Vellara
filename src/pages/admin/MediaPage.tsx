import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '../../components/ui/Feedback';
import { Icon } from '../../components/ui/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { formatLongDate } from '../../lib/date';
import { plural } from '../../lib/text';
import { describeVideoKind, parseVideoUrl } from '../../lib/video';
import { useCatalog } from '../../store/CatalogContext';

/** Vue d'ensemble des vidéos, documents et demandes de contact. */
export function MediaPage() {
  useDocumentTitle('Documents et vidéos');
  const { data } = useCatalog();

  const videos = data.medicines.flatMap((m) => {
    const info = parseVideoUrl(m.videoUrl);
    return info ? [{ medicine: m, info }] : [];
  });
  const documents = data.medicines.flatMap((m) =>
    (
      [
        ['Notice', m.leaflet],
        ['Brochure', m.brochure],
      ] as const
    ).flatMap(([type, doc]) => (doc ? [{ medicine: m, type, doc }] : [])),
  );
  const withoutVideo = data.medicines.length - videos.length;
  const withoutDocs = data.medicines.filter((m) => !m.leaflet && !m.brochure).length;
  const nameOf = (id: string) => data.medicines.find((m) => m.id === id)?.name ?? '—';

  return (
    <>
      <AdminHeader title="Documents et vidéos" subtitle="Vue d’ensemble des ressources rattachées aux fiches. L’ajout et la modification se font depuis chaque fiche." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Stat label="Vidéos" value={videos.length} sub={withoutVideo ? plural(withoutVideo, 'fiche sans vidéo', 'fiches sans vidéo') : 'toutes les fiches ont une vidéo'} />
        <Stat label="Documents" value={documents.length} sub={withoutDocs ? plural(withoutDocs, 'fiche sans document', 'fiches sans document') : 'toutes les fiches sont documentées'} />
      </div>

      <Panel title="Vidéos de présentation" empty={videos.length === 0 ? 'Aucune vidéo renseignée.' : null}>
        <Table head={['Produit', 'Hébergement', 'Affichage sur la fiche', 'Statut', '']}>
          {videos.map(({ medicine: m, info }) => (
            <tr key={m.id} className="border-b border-[#F1E7D3] last:border-0">
              <td className="px-4 py-3 font-semibold text-navy">{m.name}</td>
              <td className="px-4 py-3">{info.provider}</td>
              <td className="px-4 py-3">{describeVideoKind(info.kind)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={m.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ouvrir la vidéo de ${m.name} (nouvel onglet)`}
                    className="grid size-11 place-items-center rounded-xl hover:bg-sand-100"
                  >
                    <Icon name="external" size={19} />
                  </a>
                  <EditLink id={m.id} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel title="Notices et brochures" empty={documents.length === 0 ? 'Aucun document rattaché.' : null}>
        <Table head={['Produit', 'Type', 'Fichier', 'Origine', '']}>
          {documents.map(({ medicine: m, type, doc }) => (
            <tr key={`${m.id}-${type}`} className="border-b border-[#F1E7D3] last:border-0">
              <td className="px-4 py-3 font-semibold text-navy">{m.name}</td>
              <td className="px-4 py-3">{type}</td>
              <td className="max-w-[280px] truncate px-4 py-3">{doc.name}</td>
              <td className="px-4 py-3">{doc.type === 'file' ? 'Fichier importé' : doc.type === 'url' ? 'Lien externe' : 'Démonstration'}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <EditLink id={m.id} />
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>

      <div id="demandes" className="scroll-mt-6">
        <Panel title="Demandes de contact" empty={data.contactRequests.length === 0 ? 'Aucune demande reçue pour le moment.' : null}>
          <Table head={['Date', 'Contact', 'Profession', 'Produit', 'Message']}>
            {data.contactRequests.map((r) => (
              <tr key={r.id} className="border-b border-[#F1E7D3] align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{formatLongDate(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <strong className="block text-navy">{r.name}</strong>
                  <span className="text-[13px] text-muted">
                    {r.organization} · {r.email}
                  </span>
                </td>
                <td className="px-4 py-3">{r.profession}</td>
                <td className="px-4 py-3">{r.medicineId ? nameOf(r.medicineId) : '—'}</td>
                <td className="max-w-[340px] px-4 py-3 text-[13.5px] whitespace-pre-line">{r.message}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="surface flex flex-col gap-1 px-6 py-[22px]">
      <span className="text-[15px] font-semibold text-navy">{label}</span>
      <span className="mt-3 text-[54px] leading-none font-extrabold text-navy [font-stretch:68%]">{value}</span>
      <span className="text-[13.5px] text-muted">{sub}</span>
    </div>
  );
}

function Panel({ title, empty, children }: { title: string; empty: string | null; children: ReactNode }) {
  return (
    <section className="surface mb-4 px-[26px] py-6" aria-label={title}>
      <h2 className="heading-card mb-4">{title}</h2>
      {empty ? <p className="text-muted">{empty}</p> : children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[14.5px]">
        <thead>
          <tr className="bg-[#FFFBF3] text-left text-[11.5px] tracking-[0.12em] text-muted uppercase">
            {head.map((h, i) => (
              <th key={i} scope="col" className="border-b border-sand-200 px-4 py-3 font-semibold">
                {h || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EditLink({ id }: { id: string }) {
  return (
    <Link to={`/admin/medicaments/${id}`} className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-sand-300 px-4 text-sm font-semibold text-navy hover:border-navy">
      Modifier
    </Link>
  );
}
