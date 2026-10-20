import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog, Notice } from '../../components/ui/Feedback';
import { TextAreaField, TextField } from '../../components/ui/Field';
import { BRAND_DEFAULTS } from '../../config/brand';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AdminHeader } from '../../layouts/AdminLayout';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { CompanySettings, FieldErrors } from '../../types/catalog';

export function SettingsPage() {
  useDocumentTitle('Paramètres');
  const { data, updateSettings, resetDemo } = useCatalog();
  const { notify } = useToast();
  const [values, setValues] = useState<CompanySettings>(data.settings);
  const [errors, setErrors] = useState<FieldErrors<keyof CompanySettings>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  const field = (key: keyof CompanySettings) => ({
    value: values[key],
    error: errors[key],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setErrors((er) => ({ ...er, [key]: undefined }));
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = updateSettings(values);
    if (result) {
      setErrors(result);
      notify('Paramètres non enregistrés : corrigez les champs signalés.', 'error');
      return;
    }
    notify('Paramètres enregistrés et appliqués à toute la plateforme.');
  }

  return (
    <>
      <AdminHeader title="Paramètres de l’entreprise" subtitle="Le nom et les coordonnées s’appliquent immédiatement à toute la plateforme." />
      <form noValidate onSubmit={submit} className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <section className="surface p-5 sm:p-[26px]" aria-labelledby="identity">
            <h2 id="identity" className="heading-card mb-5">
              Identité
            </h2>
            <div className="grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
              <TextField label="Nom de l’entreprise" required hint="Nom provisoire, modifiable à tout moment." {...field('companyName')} />
              <TextField label="Signature sous le logo" {...field('tagline')} />
              <TextAreaField className="sm:col-span-2" label="Texte de présentation (page d’accueil)" {...field('intro')} />
            </div>
          </section>
          <section className="surface p-5 sm:p-[26px]" aria-labelledby="coords">
            <h2 id="coords" className="heading-card mb-5">
              Coordonnées et partage
            </h2>
            <div className="grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
              <TextField label="E-mail de contact" type="email" {...field('email')} />
              <TextField label="Téléphone" type="tel" {...field('phone')} />
              <TextField className="sm:col-span-2" label="Adresse du siège" {...field('address')} />
              <TextField
                className="sm:col-span-2 [&_input]:font-mono"
                label="Adresse publique du catalogue"
                required
                hint="Utilisée pour générer les liens de partage des fiches."
                {...field('publicBaseUrl')}
              />
            </div>
          </section>
        </div>

        <aside className="flex flex-[1_1_290px] flex-col gap-4 lg:sticky lg:top-4">
          <div className="surface flex flex-col gap-2.5 p-[22px]">
            <Button type="submit" block>
              Enregistrer les paramètres
            </Button>
            <Button
              variant="quiet"
              block
              onClick={() => {
                setValues(data.settings);
                setErrors({});
                notify('Modifications annulées.', 'info');
              }}
            >
              Annuler les modifications
            </Button>
          </div>
          <Notice icon="lock" tone="cream">
            <strong>Sécurité (prototype).</strong> La connexion est vérifiée dans le navigateur, ce qui reste contournable. La production nécessitera une authentification
            serveur, des rôles (éditeur, validateur, administrateur) et un historique des modifications.
          </Notice>
          <div className="surface p-[22px]">
            <h2 className="mb-2 text-xs font-semibold tracking-[0.15em] text-muted uppercase">Données de démonstration</h2>
            <p className="mb-3.5 text-sm text-ink-soft">Restaure les fiches, référentiels et paramètres d’origine.</p>
            <Button variant="danger" block icon="reset" onClick={() => setConfirmReset(true)}>
              Réinitialiser les données
            </Button>
          </div>
        </aside>
      </form>

      <ConfirmDialog
        open={confirmReset}
        icon="reset"
        title="Réinitialiser les données ?"
        confirmLabel="Réinitialiser"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          setErrors({});
          notify('Données de démonstration réinitialisées.');
          setValues({ ...BRAND_DEFAULTS });
        }}
      >
        Toutes les fiches, catégories, laboratoires et paramètres reviendront à leur état de démonstration initial. Vos ajouts seront perdus.
      </ConfirmDialog>
    </>
  );
}
