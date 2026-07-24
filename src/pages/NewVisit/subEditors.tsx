/**
 * Repeatable sub-entity editors used inside the visit form steps.
 * Each supports adding multiple records with a remove control.
 */
import React from 'react';
import { IonIcon } from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import { TextInput, TextArea, Select, PillSelect } from '@/components/forms/fields';
import {
  SYSTEM_TYPES, SYSTEM_PLATFORMS, SATISFACTION_LEVELS, PRINTER_TYPES, PRINTER_CONDITIONS,
  CONSUMABLE_TYPES, OPPORTUNITY_STATUS, PLATFORM_OPTIONS, MOBILE_APP_TYPES, FOLLOW_UP_MODES,
} from '@/constants/options';

function Repeatable<T>({ title, items, onChange, blank, render }: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const update = (idx: number) => (patch: Partial<T>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx} className="atc-card atc-fade-in" style={{ position: 'relative' }}>
          <button onClick={() => onChange(items.filter((_, i) => i !== idx))}
            style={{ position: 'absolute', top: 10, right: 10, background: '#FEE2E2', border: 'none', borderRadius: 10, width: 32, height: 32, color: 'var(--atc-error)' }}>
            <IonIcon icon={trashOutline} />
          </button>
          <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--atc-deep)' }}>{title} {idx + 1}</div>
          {render(item, update(idx))}
        </div>
      ))}
      <button className="atc-pill" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6, padding: 14, borderStyle: 'dashed' }} onClick={() => onChange([...items, blank()])}>
        <IonIcon icon={addOutline} /> Add {title.toLowerCase()}
      </button>
    </div>
  );
}

export const SystemsEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="System" items={items} onChange={onChange}
    blank={() => ({ system_name: '', vendor: '', system_type: '', platform: '', number_of_users: '', satisfaction_level: '', issues: '', missing_features: '', renewal_date: '', support_provider: '', notes: '' })}
    render={(it, up) => (<>
      <TextInput label="System / software name" value={it.system_name} onChange={(v) => up({ system_name: v })} />
      <TextInput label="Vendor / company" value={it.vendor} onChange={(v) => up({ vendor: v })} />
      <Select label="Type of system" value={it.system_type} onChange={(v) => up({ system_type: v })} options={SYSTEM_TYPES} />
      <Select label="Platform" value={it.platform} onChange={(v) => up({ platform: v })} options={SYSTEM_PLATFORMS} />
      <TextInput label="Number of users" value={it.number_of_users} onChange={(v) => up({ number_of_users: v })} inputMode="numeric" />
      <Select label="Client satisfaction" value={it.satisfaction_level} onChange={(v) => up({ satisfaction_level: v })} options={SATISFACTION_LEVELS} />
      <TextArea label="Issues faced" value={it.issues} onChange={(v) => up({ issues: v })} />
      <TextInput label="Missing features" value={it.missing_features} onChange={(v) => up({ missing_features: v })} />
      <TextInput label="Renewal date" value={it.renewal_date} onChange={(v) => up({ renewal_date: v })} type="date" />
      <TextInput label="Current support provider" value={it.support_provider} onChange={(v) => up({ support_provider: v })} />
    </>)}
  />
);

export const PrintersEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="Printer" items={items} onChange={onChange}
    blank={() => ({ printer_type: '', brand: '', model: '', quantity: 1, condition: '', consumables_used: '', monthly_usage: '', replacement_required: 0, service_required: 0, amc_opportunity: 0, image_path: null, remarks: '' })}
    render={(it, up) => (<>
      <Select label="Printer category" value={it.printer_type} onChange={(v) => up({ printer_type: v })} options={PRINTER_TYPES} />
      <TextInput label="Brand" value={it.brand} onChange={(v) => up({ brand: v })} />
      <TextInput label="Model" value={it.model} onChange={(v) => up({ model: v })} />
      <TextInput label="Quantity" value={String(it.quantity ?? '')} onChange={(v) => up({ quantity: Math.max(0, Number(v) || 0) })} type="number" inputMode="numeric" />
      <PillSelect label="Condition" value={it.condition} onChange={(v) => up({ condition: v })} options={PRINTER_CONDITIONS} />
      <TextInput label="Consumables used" value={it.consumables_used} onChange={(v) => up({ consumables_used: v })} />
      <TextInput label="Monthly usage estimate" value={it.monthly_usage} onChange={(v) => up({ monthly_usage: v })} />
      <TextArea label="Remarks" value={it.remarks} onChange={(v) => up({ remarks: v })} />
    </>)}
  />
);

export const ConsumablesEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="Consumable" items={items} onChange={onChange}
    blank={() => ({ opportunity_status: 'Yes', consumable_type: '', brand: '', model: '', monthly_consumption: '', current_supplier: '', current_price: '', expected_date: '', remarks: '' })}
    render={(it, up) => (<>
      <PillSelect label="Status" value={it.opportunity_status} onChange={(v) => up({ opportunity_status: v })} options={OPPORTUNITY_STATUS} />
      <Select label="Consumable type" value={it.consumable_type} onChange={(v) => up({ consumable_type: v })} options={CONSUMABLE_TYPES} />
      <TextInput label="Brand" value={it.brand} onChange={(v) => up({ brand: v })} />
      <TextInput label="Model" value={it.model} onChange={(v) => up({ model: v })} />
      <TextInput label="Estimated monthly consumption" value={it.monthly_consumption} onChange={(v) => up({ monthly_consumption: v })} />
      <TextInput label="Current supplier" value={it.current_supplier} onChange={(v) => up({ current_supplier: v })} />
      <TextInput label="Current price" value={it.current_price} onChange={(v) => up({ current_price: v })} />
      <TextInput label="Expected requirement date" value={it.expected_date} onChange={(v) => up({ expected_date: v })} type="date" />
      <TextArea label="Remarks" value={it.remarks} onChange={(v) => up({ remarks: v })} />
    </>)}
  />
);

export const PrinterOppEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="Printer opportunity" items={items} onChange={onChange}
    blank={() => ({ opportunity_status: 'Yes', required_printer_type: '', preferred_brand: '', quantity: 1, budget: '', expected_purchase_date: '', usage_requirement: '', remarks: '' })}
    render={(it, up) => (<>
      <PillSelect label="Status" value={it.opportunity_status} onChange={(v) => up({ opportunity_status: v })} options={OPPORTUNITY_STATUS} />
      <Select label="Required printer type" value={it.required_printer_type} onChange={(v) => up({ required_printer_type: v })} options={PRINTER_TYPES} />
      <TextInput label="Preferred brand" value={it.preferred_brand} onChange={(v) => up({ preferred_brand: v })} />
      <TextInput label="Quantity" value={String(it.quantity ?? '')} onChange={(v) => up({ quantity: Math.max(0, Number(v) || 0) })} type="number" inputMode="numeric" />
      <TextInput label="Expected budget" value={it.budget} onChange={(v) => up({ budget: v })} />
      <TextInput label="Expected purchase date" value={it.expected_purchase_date} onChange={(v) => up({ expected_purchase_date: v })} type="date" />
      <TextInput label="Usage requirement" value={it.usage_requirement} onChange={(v) => up({ usage_requirement: v })} />
      <TextArea label="Remarks" value={it.remarks} onChange={(v) => up({ remarks: v })} />
    </>)}
  />
);

export const SoftwareOppEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="Software scope" items={items} onChange={onChange}
    blank={() => ({ opportunity_status: 'Yes', application_type: '', required_modules: '', current_problem: '', number_of_users: '', platform: '', integration_required: '', expected_timeline: '', budget: '', notes: '' })}
    render={(it, up) => (<>
      <Select label="Status" value={it.opportunity_status} onChange={(v) => up({ opportunity_status: v })} options={['Yes', 'No', 'Maybe', 'Need requirement discussion']} />
      <TextInput label="Application type" value={it.application_type} onChange={(v) => up({ application_type: v })} />
      <TextInput label="Required modules" value={it.required_modules} onChange={(v) => up({ required_modules: v })} />
      <TextArea label="Current problem" value={it.current_problem} onChange={(v) => up({ current_problem: v })} />
      <TextInput label="Number of users" value={it.number_of_users} onChange={(v) => up({ number_of_users: v })} inputMode="numeric" />
      <Select label="Required platform" value={it.platform} onChange={(v) => up({ platform: v })} options={PLATFORM_OPTIONS} />
      <TextInput label="Integration required" value={it.integration_required} onChange={(v) => up({ integration_required: v })} />
      <TextInput label="Expected timeline" value={it.expected_timeline} onChange={(v) => up({ expected_timeline: v })} />
      <TextInput label="Budget indication" value={it.budget} onChange={(v) => up({ budget: v })} />
      <TextArea label="Notes" value={it.notes} onChange={(v) => up({ notes: v })} />
    </>)}
  />
);

export const MobileAppOppEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void }> = ({ items, onChange }) => (
  <Repeatable title="Mobile app scope" items={items} onChange={onChange}
    blank={() => ({ opportunity_status: 'Yes', application_type: '', main_features: '', expected_users: '', integrations: '', timeline: '', budget: '', notes: '' })}
    render={(it, up) => (<>
      <Select label="Status" value={it.opportunity_status} onChange={(v) => up({ opportunity_status: v })} options={['Yes', 'No', 'Maybe', 'Need requirement discussion']} />
      <Select label="Application type" value={it.application_type} onChange={(v) => up({ application_type: v })} options={MOBILE_APP_TYPES} />
      <TextArea label="Main features required" value={it.main_features} onChange={(v) => up({ main_features: v })} />
      <TextInput label="Expected users" value={it.expected_users} onChange={(v) => up({ expected_users: v })} inputMode="numeric" />
      <TextInput label="Required integrations" value={it.integrations} onChange={(v) => up({ integrations: v })} />
      <TextInput label="Timeline" value={it.timeline} onChange={(v) => up({ timeline: v })} />
      <TextInput label="Budget indication" value={it.budget} onChange={(v) => up({ budget: v })} />
      <TextArea label="Notes" value={it.notes} onChange={(v) => up({ notes: v })} />
    </>)}
  />
);

export const FollowUpEditor: React.FC<{ items: any[]; onChange: (v: any[]) => void; employeeName: string }> = ({ items, onChange, employeeName }) => (
  <Repeatable title="Follow-up" items={items} onChange={onChange}
    blank={() => ({ follow_up_date: '', follow_up_time: '', follow_up_mode: 'Call', follow_up_purpose: '', assigned_employee: employeeName, reminder_note: '', status: 'pending' })}
    render={(it, up) => (<>
      <TextInput label="Follow-up date" value={it.follow_up_date} onChange={(v) => up({ follow_up_date: v })} type="date" />
      <TextInput label="Follow-up time" value={it.follow_up_time} onChange={(v) => up({ follow_up_time: v })} type="time" />
      <Select label="Follow-up mode" value={it.follow_up_mode} onChange={(v) => up({ follow_up_mode: v })} options={FOLLOW_UP_MODES} />
      <TextInput label="Follow-up purpose" value={it.follow_up_purpose} onChange={(v) => up({ follow_up_purpose: v })} />
      <TextInput label="Assigned employee" value={it.assigned_employee} onChange={(v) => up({ assigned_employee: v })} />
      <TextArea label="Reminder note" value={it.reminder_note} onChange={(v) => up({ reminder_note: v })} />
    </>)}
  />
);
