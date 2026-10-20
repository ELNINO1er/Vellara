import { ButtonLink } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Feedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page introuvable');
  return (
    <div className="container-page py-24">
      <EmptyState title="Page introuvable" tone="bordeaux" action={<ButtonLink to="/">Retour à l’accueil</ButtonLink>}>
        L’adresse demandée n’existe pas ou a été déplacée.
      </EmptyState>
    </div>
  );
}
