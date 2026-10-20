import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Button, ButtonLink } from '../../components/ui/Button';
import { FieldShell, TextField } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DemoStrip } from '../../layouts/PublicLayout';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';

export function LoginPage() {
  useDocumentTitle('Connexion');
  const { session, loading, signIn } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  if (!loading && session) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (!email.trim()) found.email = 'Saisissez votre adresse e-mail.';
    if (!password) found.password = 'Saisissez votre mot de passe.';
    if (found.email || found.password) return setErrors(found);

    setPending(true);
    const result = await signIn(email, password);
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      setPassword('');
      return;
    }
    notify('Connexion réussie.');
    navigate(from, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoStrip />
      <main id="contenu" className="grid flex-1 place-items-center bg-cream px-4 py-16">
        <div className="animate-pop w-full max-w-[480px] rounded-[28px] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,48,73,.6)] sm:p-11">
          <span className="mb-[22px] grid size-14 place-items-center rounded-[18px] bg-navy text-cream">
            <Icon name="lock" size={26} />
          </span>
          <p className="eyebrow">Accès réservé</p>
          <h1 className="heading-section">Connexion à l’administration</h1>
          <p className="mt-3 text-ink-soft">Réservé aux équipes habilitées à gérer le catalogue.</p>

          <form noValidate onSubmit={submit} className="mt-7 flex flex-col gap-[18px]">
            {errors.form && (
              <p role="alert" className="flex items-start gap-2 rounded-2xl bg-danger-50 px-4 py-3 text-[14.5px] font-medium text-[#6E0910]">
                <Icon name="alert" size={18} className="mt-0.5" />
                {errors.form}
              </p>
            )}
            <TextField
              label="Adresse e-mail"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              error={errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
            />
            <FieldShell label="Mot de passe" error={errors.password}>
              {({ id, describedBy, invalid }) => (
                <div className="relative">
                  <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    className="field-control pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-sand-100 hover:text-navy"
                  >
                    <Icon name="eye" size={19} />
                  </button>
                </div>
              )}
            </FieldShell>
            <Button type="submit" size="lg" block disabled={pending}>
              {pending ? 'Vérification…' : 'Se connecter'}
            </Button>
            <ButtonLink to="/" variant="ghost" block>
              Retour au site public
            </ButtonLink>
          </form>
          <p className="mt-6 text-[12.5px] leading-relaxed text-muted">
            Connexion vérifiée par le serveur. Session sécurisée de 8 heures.
          </p>
        </div>
      </main>
    </div>
  );
}
