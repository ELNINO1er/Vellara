import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { CheckboxField, SelectField, TextAreaField, TextField } from '../../components/ui/Field';
import { Icon, type IconName } from '../../components/ui/Icon';
import { PROFESSIONS } from '../../config/brand';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { isPublished } from '../../lib/catalog';
import { hasErrors, validateContact, type ContactFormValues } from '../../lib/validation';
import { useCatalog } from '../../store/CatalogContext';
import { useToast } from '../../store/ToastContext';
import type { FieldErrors } from '../../types/catalog';

const empty = (medicineId = ''): ContactFormValues => ({
  name: '',
  organization: '',
  profession: '',
  email: '',
  medicineId,
  message: '',
  consent: false,
});

export function ContactPage() {
  useDocumentTitle('Contact');
  const { data, addContactRequest } = useCatalog();
  const { notify } = useToast();
  const [params] = useSearchParams();
  const [values, setValues] = useState<ContactFormValues>(() => empty(params.get('produit') ?? ''));
  const [errors, setErrors] = useState<FieldErrors<keyof ContactFormValues>>({});
  const [sent, setSent] = useState(false);

  const set = <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateContact(values);
    if (hasErrors(found)) {
      setErrors(found);
      notify(`Le formulaire contient ${Object.values(found).filter(Boolean).length} erreur(s).`, 'error');
      return;
    }
    const { consent: _consent, ...request } = values;
    addContactRequest(request);
    setSent(true);
    setValues(empty());
  }

  const products = data.medicines.filter(isPublished).map((m) => ({ value: m.id, label: `${m.name} — ${m.strength}` }));
  const { settings } = data;
  const lines: [IconName, string, string][] = [
    ['mail', 'E-mail', settings.email],
    ['phone', 'Téléphone', settings.phone],
    ['pin', 'Siège', settings.address],
  ];

  return (
    <>
      <section className="border-b border-sand-200 pt-12 pb-8">
        <div className="container-page">
          <p className="eyebrow">Contact professionnel</p>
          <h1 className="display text-[clamp(44px,5.4vw,72px)]">Échanger avec nos équipes</h1>
          <p className="mt-4 max-w-[54ch] text-[19px] text-ink-soft">
            Une question sur une spécialité, une demande de documentation ou de rendez-vous ? Laissez-nous vos coordonnées professionnelles.
          </p>
        </div>
      </section>
      <div className="container-page grid items-start gap-10 pt-12 pb-[88px] lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <div className="flex flex-col gap-3.5">
          {lines.map(([icon, label, value]) => (
            <div key={label} className="surface flex items-start gap-3.5 rounded-[18px] px-5 py-[18px]">
              <Icon name={icon} className="mt-0.5 text-bordeaux" />
              <div>
                <small className="block text-[11.5px] font-semibold tracking-[0.13em] text-muted uppercase">{label}</small>
                <span className="font-semibold [overflow-wrap:anywhere] text-navy">{value}</span>
              </div>
            </div>
          ))}
          <p className="rounded-[18px] bg-cream px-5 py-[18px] text-[14.5px] leading-normal text-[#4A3A22]">
            <strong>Important.</strong> Ce formulaire n’est pas destiné aux urgences médicales ni aux déclarations d’effets indésirables, qui suivent les
            circuits officiels de pharmacovigilance.
          </p>
        </div>

        <div className="surface rounded-[26px] p-6 sm:p-8">
          {sent ? (
            <div role="status" className="flex flex-col items-start gap-3.5 py-3">
              <span className="grid size-14 place-items-center rounded-full bg-sky-50 text-navy">
                <Icon name="check" size={28} />
              </span>
              <h2 className="heading-card">Demande enregistrée</h2>
              <p className="text-muted">
                Prototype : votre demande est conservée dans ce navigateur, aucun message n’a été envoyé. En production, elle sera transmise à l’équipe
                concernée.
              </p>
              <Button variant="ghost" onClick={() => setSent(false)}>
                Envoyer une autre demande
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-x-5 gap-y-[18px] sm:grid-cols-2">
              <TextField label="Nom et prénom" required autoComplete="name" value={values.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
              <TextField
                label="Établissement"
                required
                autoComplete="organization"
                value={values.organization}
                error={errors.organization}
                onChange={(e) => set('organization', e.target.value)}
              />
              <SelectField
                label="Profession"
                required
                placeholder="Sélectionner…"
                options={PROFESSIONS.map((p) => ({ value: p, label: p }))}
                value={values.profession}
                error={errors.profession}
                onChange={(v) => set('profession', v)}
              />
              <TextField
                label="E-mail professionnel"
                type="email"
                required
                autoComplete="email"
                value={values.email}
                error={errors.email}
                onChange={(e) => set('email', e.target.value)}
              />
              <SelectField
                className="sm:col-span-2"
                label="Produit concerné"
                placeholder="Aucun produit en particulier"
                options={products}
                value={values.medicineId}
                onChange={(v) => set('medicineId', v)}
              />
              <TextAreaField
                className="sm:col-span-2"
                label="Votre message"
                required
                value={values.message}
                error={errors.message}
                onChange={(e) => set('message', e.target.value)}
              />
              <CheckboxField
                className="sm:col-span-2"
                label={
                  <>
                    J’accepte que ces informations soient utilisées pour traiter ma demande. <span className="text-ember-ink">*</span>
                  </>
                }
                checked={values.consent}
                error={errors.consent}
                onChange={(e) => set('consent', e.target.checked)}
              />
              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <span className="text-[13.5px] text-muted">* Champs obligatoires</span>
                <Button type="submit" size="lg">
                  Envoyer la demande
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
