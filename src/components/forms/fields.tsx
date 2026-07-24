/**
 * Reusable form controls with inline validation styling.
 */
import React from 'react';

interface BaseProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export const Field: React.FC<BaseProps & { children: React.ReactNode; name?: string }> = ({ label, required, error, hint, children, name }) => (
  <div className="atc-field" data-field={name}>
    {label && (
      <label className="atc-field-label">
        {label}{required && <span className="req">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <div className="atc-muted" style={{ marginTop: 4 }}>{hint}</div>}
    {error && <div className="atc-field-error">{error}</div>}
  </div>
);

export const TextInput: React.FC<BaseProps & {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; name?: string; inputMode?: any;
}> = ({ label, required, error, hint, value, onChange, type = 'text', placeholder, name, inputMode }) => (
  <Field label={label} required={required} error={error} hint={hint} name={name}>
    <input
      className={`atc-input ${error ? 'invalid' : ''}`}
      type={type}
      value={value}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

export const TextArea: React.FC<BaseProps & {
  value: string; onChange: (v: string) => void; placeholder?: string; name?: string;
}> = ({ label, required, error, hint, value, onChange, placeholder, name }) => (
  <Field label={label} required={required} error={error} hint={hint} name={name}>
    <textarea
      className={`atc-textarea ${error ? 'invalid' : ''}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

export const Select: React.FC<BaseProps & {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; name?: string;
}> = ({ label, required, error, hint, value, onChange, options, placeholder = 'Select', name }) => (
  <Field label={label} required={required} error={error} hint={hint} name={name}>
    <select className={`atc-select ${error ? 'invalid' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </Field>
);

/** Single-select pill group. */
export const PillSelect: React.FC<BaseProps & {
  value: string; onChange: (v: string) => void; options: string[]; name?: string;
}> = ({ label, required, error, value, onChange, options, name }) => (
  <Field label={label} required={required} error={error} name={name}>
    <div className="atc-pills">
      {options.map((o) => (
        <div key={o} className={`atc-pill ${value === o ? 'active' : ''}`} onClick={() => onChange(o)}>{o}</div>
      ))}
    </div>
  </Field>
);

/** Multi-select pill group. */
export const PillMultiSelect: React.FC<BaseProps & {
  values: string[]; onToggle: (v: string) => void; options: string[]; name?: string;
}> = ({ label, required, error, values, onToggle, options, name }) => (
  <Field label={label} required={required} error={error} name={name}>
    <div className="atc-pills">
      {options.map((o) => (
        <div key={o} className={`atc-pill ${values.includes(o) ? 'active' : ''}`} onClick={() => onToggle(o)}>{o}</div>
      ))}
    </div>
  </Field>
);

export const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="atc-spread" style={{ padding: '10px 0', borderBottom: '1px solid var(--atc-border)' }}>
    <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
    <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 26 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 999, cursor: 'pointer', transition: '0.25s',
        background: checked ? 'var(--atc-primary)' : 'var(--atc-border)',
      }}>
        <span style={{
          position: 'absolute', height: 20, width: 20, left: 3, bottom: 3, background: '#fff', borderRadius: '50%',
          transition: '0.25s', transform: checked ? 'translateX(20px)' : 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </span>
    </label>
  </div>
);
