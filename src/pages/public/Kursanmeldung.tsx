import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { useStepForm, useJourneySubmit } from '@/lib/journey';
import { createPublicPort } from '@/lib/journey/publicPort';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { tx } from '@/i18n';

const SLUG = 'kursanmeldung';

export default function Kursanmeldung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return (
    <PublicShell title={page.title} description={page.description}>
      <Registration cfg={cfg} page={page} />
    </PublicShell>
  );
}

function Registration({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const [step, setStep] = useState(1);
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);

  const form = useStepForm('kursteilnehmer', {
    fields: ['vorname', 'nachname', 'email', 'gruppe'],
    required: { vorname: true, nachname: true, email: true, gruppe: false },
    steps: { vorname: 1, nachname: 1, email: 1, gruppe: 1 },
    messages: {
      vorname: tx('Bitte den Vornamen eingeben.'),
      nachname: tx('Bitte den Nachnamen eingeben.'),
      email: tx('Bitte die E-Mail-Adresse eingeben.'),
    },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port,
    [{ key: 'teilnehmer', entity: 'kursteilnehmer', form, primary: true }],
    { draftKey: SLUG },
  );

  const steps = [{ label: tx('Deine Angaben') }, { label: tx('Prüfen') }];

  const restart = () => {
    submit.reset();
    form.reset();
    setStep(1);
  };

  const first = String(form.get('vorname') ?? '');
  const mail = String(form.get('email') ?? '');

  return (
    <IntentWizardShell
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      back={false}
      forms={[form]}
      draftKey={SLUG}
    >
      {step === 1 && !submit.result && (
        <div className="space-y-5">
          <Bound form={form} name="vorname" />
          <Bound form={form} name="nachname" />
          <Bound form={form} name="email" />
          <Bound form={form} name="gruppe" placeholder={tx('z. B. Montagsgruppe')} />
          <StepNav
            hideBack
            onNext={() => form.validate(['vorname', 'nachname', 'email', 'gruppe'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      )}
      {step === 2 && !submit.done && (
        <SummaryStep
          forms={[form]}
          submit={submit}
          whatHappensNext={tx('Mit dem Absenden meldest du dich zum Kurs an.')}
        />
      )}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[form]}
          title={tx('Vielen Dank für deine Anmeldung!')}
          whatHappensNext={tx`Wir haben deine Anmeldung erhalten, ${first}. Eine Bestätigung geht an ${mail}.`}
          next={[{ label: tx('Weitere Person anmelden'), onClick: restart }]}
        />
      )}
    </IntentWizardShell>
  );
}
