import type { Kursteilnehmer } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface KursteilnehmerDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kursteilnehmer;
}

export function KursteilnehmerDetails({
  record,
}: KursteilnehmerDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kursteilnehmer', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('kursteilnehmer', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('kursteilnehmer', 'email')} value={record.fields.email} format="email" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.KURSTEILNEHMER} recordId={record.record_id} readOnly={!perms.canWrite('kursteilnehmer')} />
    </>
  );
}
