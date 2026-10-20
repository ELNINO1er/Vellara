import { Link, useParams } from 'react-router';
import { ProductCard } from '../../components/product/ProductCard';
import { ProductDetail } from '../../components/product/ProductDetail';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { isPublished } from '../../lib/catalog';
import { useAuth } from '../../store/AuthContext';
import { useCatalog } from '../../store/CatalogContext';

export function ProductPage() {
  const { slug } = useParams();
  const { data } = useCatalog();
  const { session } = useAuth();
  const medicine = data.medicines.find((m) => m.slug === slug);
  // Un brouillon n'est consultable que par l'administration.
  const visible = medicine && (isPublished(medicine) || session) ? medicine : null;
  useDocumentTitle(visible?.name ?? 'Fiche indisponible');

  if (!visible) {
    return (
      <div className="container-page py-[72px] md:py-24">
        <EmptyState
          title="Cette fiche n’est pas disponible"
          tone="bordeaux"
          action={<ButtonLink to="/catalogue">Retour au catalogue</ButtonLink>}
        >
          Elle a peut-être été retirée du catalogue, supprimée, ou n’a pas encore été publiée.
        </EmptyState>
      </div>
    );
  }

  const related = data.medicines.filter((m) => isPublished(m) && m.categoryId === visible.categoryId && m.id !== visible.id).slice(0, 4);

  return (
    <>
      {!isPublished(visible) && (
        <div className="sticky top-[78px] z-20 bg-bordeaux-dark text-white">
          <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-[14.5px]">
            <span>
              <strong className="text-cream">Brouillon.</strong> Fiche visible uniquement par l’administration (accès simulé).
            </span>
            <ButtonLink to={`/admin/medicaments/${visible.id}`} variant="light" size="sm">
              Modifier la fiche
            </ButtonLink>
          </div>
        </div>
      )}
      <nav aria-label="Fil d’Ariane" className="container-page flex flex-wrap items-center gap-2 pt-5 pb-6 text-sm text-muted">
        <Link to="/" className="py-2.5 text-bordeaux underline underline-offset-[3px]">
          Accueil
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/catalogue" className="py-2.5 text-bordeaux underline underline-offset-[3px]">
          Catalogue
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{visible.name}</span>
      </nav>
      <ProductDetail medicine={visible} />
      {related.length > 0 && (
        <section className="pb-16 md:pb-[72px]" aria-labelledby="related-title">
          <div className="container-page">
            <p className="eyebrow">Même aire thérapeutique</p>
            <h2 id="related-title" className="heading-section mb-7">
              Autres spécialités
            </h2>
            <div className="grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(236px,1fr))]">
              {related.map((m) => (
                <ProductCard key={m.id} medicine={m} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
