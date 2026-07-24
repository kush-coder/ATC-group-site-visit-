/**
 * ATC FieldConnect - Domain models
 * These interfaces mirror the local SQLite schema. All data lives on-device.
 */

export type YesNoMaybe = 'Yes' | 'No' | 'Maybe' | 'Need follow-up';
export type YesNoConfirm = 'Yes' | 'No' | 'Not confirmed';
export type OpportunityStatus = 'Yes' | 'No' | 'Maybe' | 'Need follow-up' | 'Need requirement discussion';
export type LeadRating = 'Cold' | 'Warm' | 'Hot' | 'Immediate';
export type BusinessPotential = 'Low' | 'Medium' | 'High' | 'Very high';
export type Priority = 'Low' | 'Normal' | 'High' | 'Critical';
export type Urgency = 'Low' | 'Medium' | 'High' | 'Immediate';
export type VisitStatus = 'draft' | 'submitted';

export interface EmployeeProfile {
  id?: number;
  employee_name: string;
  employee_id: string;
  mobile_number: string;
  email: string;
  department: string;
  designation: string;
  branch: string;
  profile_image_path: string | null;
  manager_name: string | null;
  pin_enabled: number; // 0 | 1
  pin_hash: string | null;
  biometric_enabled: number; // 0 | 1
  created_at: string;
  updated_at: string;
}

export interface ClientVisit {
  id?: number;
  visit_number: string;
  employee_id: string;
  employee_name: string;
  visit_date: string;
  visit_time: string;
  visit_type: string;

  client_name: string;
  business_name: string;
  contact_person: string;
  designation: string;
  mobile_number: string;
  whatsapp_number: string;
  email_address: string;
  alternate_number: string;
  full_address: string;
  area: string;
  city: string;
  state: string;
  pin_code: string;
  landmark: string;
  website: string;
  client_category: string;

  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  location_time: string | null;

  existing_system_status: YesNoConfirm | '';
  printer_status: YesNoConfirm | '';

  inquiry_title: string;
  inquiry_description: string;
  client_requirement: string;
  expected_quantity: string;
  expected_timeline: string;
  urgency: Urgency | '';
  budget_available: number; // 0 | 1
  budget_amount: number | null;
  decision_maker: string;
  competitor_info: string;
  quotation_required: number; // 0 | 1
  demo_required: number; // 0 | 1
  technical_visit_required: number; // 0 | 1
  follow_up_required: number; // 0 | 1

  consumable_scope: string;
  printer_scope: string;
  software_scope: string;
  mobile_app_scope: string;
  web_app_scope: string;

  lead_rating: LeadRating | '';
  lead_score: number;
  business_potential: BusinessPotential | '';
  probability: number;
  estimated_business_value: number | null;
  priority: Priority | '';
  expected_closure_date: string;
  management_attention: number; // 0 | 1

  follow_up_date: string;
  follow_up_time: string;
  follow_up_mode: string;

  meeting_summary: string;
  client_response: string;
  employee_observation: string;
  challenges_identified: string;
  recommended_solution: string;
  next_action: string;
  additional_comments: string;

  status: VisitStatus;
  created_at: string;
  updated_at: string;
}

export interface VisitImage {
  id?: number;
  visit_id: number;
  image_path: string;
  image_type: string;
  is_primary: number; // 0 | 1
  caption: string;
  created_at: string;
}

export interface ExistingSystem {
  id?: number;
  visit_id: number;
  system_name: string;
  vendor: string;
  system_type: string;
  platform: string;
  number_of_users: string;
  satisfaction_level: string;
  issues: string;
  missing_features: string;
  renewal_date: string;
  support_provider: string;
  notes: string;
}

export interface PrinterDetail {
  id?: number;
  visit_id: number;
  printer_type: string;
  brand: string;
  model: string;
  quantity: number;
  condition: string;
  consumables_used: string;
  monthly_usage: string;
  replacement_required: number; // 0 | 1
  service_required: number; // 0 | 1
  amc_opportunity: number; // 0 | 1
  image_path: string | null;
  remarks: string;
}

export interface InquiryCategory {
  id?: number;
  visit_id: number;
  category_name: string;
}

export interface ConsumableOpportunity {
  id?: number;
  visit_id: number;
  opportunity_status: string;
  consumable_type: string;
  brand: string;
  model: string;
  monthly_consumption: string;
  current_supplier: string;
  current_price: string;
  expected_date: string;
  remarks: string;
}

export interface PrinterOpportunity {
  id?: number;
  visit_id: number;
  opportunity_status: string;
  required_printer_type: string;
  preferred_brand: string;
  quantity: number;
  budget: string;
  expected_purchase_date: string;
  usage_requirement: string;
  remarks: string;
}

export interface SoftwareOpportunity {
  id?: number;
  visit_id: number;
  opportunity_status: string;
  application_type: string;
  required_modules: string;
  current_problem: string;
  number_of_users: string;
  platform: string;
  integration_required: string;
  expected_timeline: string;
  budget: string;
  notes: string;
}

export interface MobileAppOpportunity {
  id?: number;
  visit_id: number;
  opportunity_status: string;
  application_type: string;
  main_features: string;
  expected_users: string;
  integrations: string;
  timeline: string;
  budget: string;
  notes: string;
}

export interface FollowUp {
  id?: number;
  visit_id: number;
  follow_up_date: string;
  follow_up_time: string;
  follow_up_mode: string;
  follow_up_purpose: string;
  assigned_employee: string;
  reminder_note: string;
  status: string;
}

/** Aggregate used when reading a full visit for details/report/export. */
export interface VisitBundle {
  visit: ClientVisit;
  images: VisitImage[];
  systems: ExistingSystem[];
  printers: PrinterDetail[];
  inquiryCategories: InquiryCategory[];
  consumables: ConsumableOpportunity[];
  printerOpportunities: PrinterOpportunity[];
  softwareOpportunities: SoftwareOpportunity[];
  mobileAppOpportunities: MobileAppOpportunity[];
  followUps: FollowUp[];
}

export interface DashboardStats {
  todayVisits: number;
  completedVisits: number;
  pendingFollowUps: number;
  highPotential: number;
  consumableOpps: number;
  printerOpps: number;
  softwareOpps: number;
  mobileAppOpps: number;
  estimatedValue: number;
}
