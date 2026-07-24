/**
 * In-memory form state for the multi-step visit form, plus mappers to/from
 * the persisted domain models.
 */
import type {
  ClientVisit, VisitImage, ExistingSystem, PrinterDetail, ConsumableOpportunity,
  PrinterOpportunity, SoftwareOpportunity, MobileAppOpportunity, FollowUp, VisitBundle,
} from '@/types/models';
import { todayIso, nowTime } from '@/utils/format';

export interface DraftImage {
  id?: number;
  image_path: string;
  image_type: string;
  is_primary: boolean;
  caption: string;
}

export interface VisitFormState {
  editingId: number | null;
  visit: Partial<ClientVisit>;
  images: DraftImage[];
  inquiryCategories: string[];
  systems: Partial<ExistingSystem>[];
  printers: Partial<PrinterDetail>[];
  consumables: Partial<ConsumableOpportunity>[];
  printerOpportunities: Partial<PrinterOpportunity>[];
  softwareOpportunities: Partial<SoftwareOpportunity>[];
  mobileAppOpportunities: Partial<MobileAppOpportunity>[];
  followUps: Partial<FollowUp>[];
  confirmations: {
    clientVerified: boolean;
    inquiryVerified: boolean;
    imagesAttached: boolean;
    followUpChecked: boolean;
  };
}

export function emptyForm(): VisitFormState {
  return {
    editingId: null,
    visit: {
      visit_date: todayIso(),
      visit_time: nowTime(),
      visit_type: 'First visit',
      client_name: '', business_name: '', contact_person: '', designation: '',
      mobile_number: '', whatsapp_number: '', email_address: '', alternate_number: '',
      full_address: '', area: '', city: '', state: '', pin_code: '', landmark: '', website: '',
      client_category: '', latitude: null, longitude: null, location_accuracy: null, location_time: null,
      existing_system_status: '', printer_status: '',
      inquiry_title: '', inquiry_description: '', client_requirement: '', expected_quantity: '',
      expected_timeline: '', urgency: '', budget_available: 0, budget_amount: null, decision_maker: '',
      competitor_info: '', quotation_required: 0, demo_required: 0, technical_visit_required: 0, follow_up_required: 0,
      consumable_scope: '', printer_scope: '', software_scope: '', mobile_app_scope: '', web_app_scope: '',
      lead_rating: '', lead_score: 5, business_potential: '', probability: 50, estimated_business_value: null,
      priority: 'Normal', expected_closure_date: '', management_attention: 0,
      follow_up_date: '', follow_up_time: '', follow_up_mode: '',
      meeting_summary: '', client_response: '', employee_observation: '', challenges_identified: '',
      recommended_solution: '', next_action: '', additional_comments: '', status: 'draft',
    },
    images: [],
    inquiryCategories: [],
    systems: [],
    printers: [],
    consumables: [],
    printerOpportunities: [],
    softwareOpportunities: [],
    mobileAppOpportunities: [],
    followUps: [],
    confirmations: { clientVerified: false, inquiryVerified: false, imagesAttached: false, followUpChecked: false },
  };
}

/** Build a form state from a saved bundle (edit mode). */
export function formFromBundle(bundle: VisitBundle): VisitFormState {
  const f = emptyForm();
  f.editingId = bundle.visit.id ?? null;
  f.visit = { ...bundle.visit };
  f.images = bundle.images.map((i: VisitImage) => ({
    id: i.id, image_path: i.image_path, image_type: i.image_type, is_primary: !!i.is_primary, caption: i.caption,
  }));
  f.inquiryCategories = bundle.inquiryCategories.map((c) => c.category_name);
  f.systems = bundle.systems;
  f.printers = bundle.printers;
  f.consumables = bundle.consumables;
  f.printerOpportunities = bundle.printerOpportunities;
  f.softwareOpportunities = bundle.softwareOpportunities;
  f.mobileAppOpportunities = bundle.mobileAppOpportunities;
  f.followUps = bundle.followUps;
  return f;
}
