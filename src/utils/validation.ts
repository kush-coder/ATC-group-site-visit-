/**
 * Central validation utilities.
 */

export const isEmail = (v: string): boolean =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isPhone = (v: string): boolean =>
  !v || /^[+]?[\d\s-]{7,15}$/.test(v.trim());

export const isRequired = (v: string | null | undefined): boolean =>
  !!v && String(v).trim().length > 0;

export const trimAll = <T extends Record<string, any>>(obj: T): T => {
  const out: any = { ...obj };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === 'string') out[k] = out[k].trim();
  }
  return out;
};

export interface FieldError {
  field: string;
  message: string;
}

/** Validate the mandatory fields required before final submission. */
export function validateVisitForSubmit(v: {
  visit_date: string;
  visit_time: string;
  client_name: string;
  business_name: string;
  full_address: string;
  inquiry_description: string;
  lead_rating: string;
  meeting_summary: string;
  email_address: string;
  mobile_number: string;
  whatsapp_number: string;
  follow_up_required: number;
  follow_up_date: string;
  budget_amount: number | null;
  estimated_business_value: number | null;
  hasImage: boolean;
  hasInquiryCategory: boolean;
}): FieldError[] {
  const errors: FieldError[] = [];
  const req = (field: string, val: string, label: string) => {
    if (!isRequired(val)) errors.push({ field, message: `${label} is required` });
  };
  req('visit_date', v.visit_date, 'Visit date');
  req('visit_time', v.visit_time, 'Visit time');
  req('client_name', v.client_name, 'Client name');
  req('business_name', v.business_name, 'Business or shop name');
  req('full_address', v.full_address, 'Full address');
  req('inquiry_description', v.inquiry_description, 'Inquiry description');
  req('lead_rating', v.lead_rating, 'Opportunity rating');
  req('meeting_summary', v.meeting_summary, 'Meeting summary');

  if (!v.hasImage) errors.push({ field: 'image', message: 'At least one client-location photograph is required' });
  if (!v.hasInquiryCategory) errors.push({ field: 'inquiry_category', message: 'Select at least one inquiry category' });

  if (!isEmail(v.email_address)) errors.push({ field: 'email_address', message: 'Enter a valid email address' });
  if (!isPhone(v.mobile_number)) errors.push({ field: 'mobile_number', message: 'Enter a valid mobile number' });
  if (!isPhone(v.whatsapp_number)) errors.push({ field: 'whatsapp_number', message: 'Enter a valid WhatsApp number' });

  if (v.budget_amount != null && v.budget_amount < 0) errors.push({ field: 'budget_amount', message: 'Budget cannot be negative' });
  if (v.estimated_business_value != null && v.estimated_business_value < 0) errors.push({ field: 'estimated_business_value', message: 'Estimated value cannot be negative' });

  if (v.follow_up_required && v.follow_up_date && v.visit_date && v.follow_up_date < v.visit_date) {
    errors.push({ field: 'follow_up_date', message: 'Follow-up date cannot be before the visit date' });
  }
  return errors;
}
