import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import { loadPublicPagesConfig, prepareChallenge, type PublicPagesConfig, type PublicPageConfig } from '@/lib/publicClient';
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
    loadPublicPagesConfig(SLUG)
      .then(c => {
        setCfg(c);
        setPage(c?.pages[SLUG] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return <PublicShell title={page.title} description={page.description}><Form cfg={cfg} page={page} /></PublicShell>;
}

function Form({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const [step, setStep] = useState(1);
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const anmeldung = useStepForm('kursteilnehmer', {
    fields: ['vorname', 'nachname', 'email'],
    steps: { vorname: 1, nachname: 1, email: 1 },
    autoComplete: true,
  });
  const submit = useJourneySubmit(
    port,
    [{ key: 'anmeldung', entity: 'kursteilnehmer', form: anmeldung, primary: true }],
    { draftKey: SLUG },
  );

  const steps = [{ label: tx('Deine Daten') }, { label: tx('Prüfen') }];

  const restart = () => {
    submit.reset();
    anmeldung.reset();
    setStep(1);
  };

  return (
    <IntentWizardShell steps={steps} currentStep={step} onStepChange={setStep} back={false} forms={[anmeldung]} draftKey={SLUG}>
      {step === 1 && (
        <div className="space-y-5" onFocus={() => prepareChallenge(cfg, page, 'POST', `/apps/${page.endpoints?.find(e => e.op === 'create')?.app_id}/records`)}>
          <Bound form={anmeldung} name="vorname" />
          <Bound form={anmeldung} name="nachname" />
          <Bound form={anmeldung} name="email" />
          <StepNav hideBack onNext={() => anmeldung.validate(['vorname', 'nachname', 'email'])} nextStepLabel={tx('Prüfen')} />
        </div>
      )}
      {step === 2 && !submit.done && (
        <SummaryStep forms={[anmeldung]} submit={submit} whatHappensNext={tx('Mit dem Absenden ist deine Anmeldung abgeschlossen.')} />
      )}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[anmeldung]}
          title={tx('Anmeldung eingegangen')}
          next={[{ label: tx('Weitere Anmeldung'), onClick: restart }]}
        />
      )}
    </IntentWizardShell>
  );
}
