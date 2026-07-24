/**
 * Sample test data: five representative client visits so the dashboard,
 * lists and Excel report can be demonstrated immediately.
 * Each visit gets a branded placeholder photograph as its primary image.
 */
import { visitRepo, childRepo, imageRepo, generateVisitNumber } from '../database/repository';
import { fileService } from '../filesystem/fileService';
import { todayIso, nowTime } from '@/utils/format';
import { SAMPLE_PHOTOS } from './samplePhotos';
import type { ClientVisit } from '@/types/models';

function baseVisit(over: Partial<ClientVisit>): Partial<ClientVisit> {
  return {
    employee_id: 'ATC-EMP-001',
    employee_name: 'Rahul Sharma',
    visit_date: todayIso(),
    visit_time: nowTime(),
    visit_type: 'Sales visit',
    contact_person: '',
    designation: '',
    whatsapp_number: '',
    alternate_number: '',
    area: '', landmark: '', website: '',
    existing_system_status: 'Yes',
    printer_status: 'Yes',
    inquiry_title: '',
    client_requirement: '',
    expected_quantity: '',
    expected_timeline: '',
    budget_available: 1,
    decision_maker: '',
    competitor_info: '',
    quotation_required: 1,
    demo_required: 0,
    technical_visit_required: 0,
    follow_up_required: 1,
    consumable_scope: 'Yes',
    printer_scope: 'Maybe',
    software_scope: 'Yes',
    mobile_app_scope: 'No',
    web_app_scope: 'No',
    probability: 60,
    priority: 'High',
    expected_closure_date: '',
    management_attention: 0,
    follow_up_time: '11:00',
    follow_up_mode: 'Call',
    client_response: 'Positive',
    employee_observation: 'Strong interest, budget available.',
    challenges_identified: '',
    recommended_solution: '',
    next_action: 'Send quotation',
    additional_comments: '',
    status: 'submitted',
    ...over,
  };
}

const SAMPLES: Partial<ClientVisit>[] = [
  baseVisit({
    client_name: 'Suresh Patel', business_name: 'Patel Super Mart', mobile_number: '9876543210',
    email_address: 'patel.mart@example.com', full_address: '12 MG Road', city: 'Ahmedabad',
    state: 'Gujarat', pin_code: '380001', client_category: 'Supermarket',
    latitude: 23.0225, longitude: 72.5714, location_accuracy: 12,
    inquiry_description: 'Needs a modern billing + inventory POS with barcode support.',
    urgency: 'High', budget_amount: 250000, lead_rating: 'Hot', lead_score: 9,
    business_potential: 'Very high', estimated_business_value: 250000,
    follow_up_date: todayIso(), meeting_summary: 'Client wants a full POS + inventory upgrade before festive season.',
  }),
  baseVisit({
    client_name: 'Anita Desai', business_name: 'Desai Medical Store', mobile_number: '9812345678',
    email_address: 'desai.med@example.com', full_address: '45 Station Road', city: 'Surat',
    state: 'Gujarat', pin_code: '395003', client_category: 'Medical store',
    latitude: 21.1702, longitude: 72.8311, location_accuracy: 8,
    inquiry_description: 'Thermal receipt printer replacement and label consumables.',
    urgency: 'Medium', budget_amount: 40000, lead_rating: 'Warm', lead_score: 6,
    business_potential: 'Medium', estimated_business_value: 40000, printer_scope: 'Yes',
    software_scope: 'No', follow_up_date: todayIso(),
    meeting_summary: 'Requires a new thermal printer and ongoing label supply.',
  }),
  baseVisit({
    client_name: 'Mohammed Khan', business_name: 'Khan Logistics Pvt Ltd', mobile_number: '9900112233',
    email_address: 'ops@khanlogistics.example', full_address: 'Plot 8, GIDC', city: 'Vadodara',
    state: 'Gujarat', pin_code: '390010', client_category: 'Logistics company',
    latitude: 22.3072, longitude: 73.1812, location_accuracy: 15,
    inquiry_description: 'Custom field-service mobile app for delivery tracking.',
    urgency: 'High', budget_amount: 500000, lead_rating: 'Immediate', lead_score: 10,
    business_potential: 'Very high', estimated_business_value: 500000, mobile_app_scope: 'Yes',
    web_app_scope: 'Yes', follow_up_date: todayIso(),
    meeting_summary: 'Wants a delivery + field-service app with live tracking and a web portal.',
  }),
  baseVisit({
    client_name: 'Priya Nair', business_name: 'Nair Printing Works', mobile_number: '9765432109',
    email_address: 'nair.print@example.com', full_address: '3 Industrial Estate', city: 'Rajkot',
    state: 'Gujarat', pin_code: '360002', client_category: 'Printing business',
    latitude: 22.3039, longitude: 70.8022, location_accuracy: 10,
    inquiry_description: 'Bulk toner and industrial printer AMC contract.',
    urgency: 'Medium', budget_amount: 120000, lead_rating: 'Warm', lead_score: 7,
    business_potential: 'High', estimated_business_value: 120000, printer_scope: 'Yes',
    follow_up_date: todayIso(), meeting_summary: 'Interested in AMC + consumable subscription.',
  }),
  baseVisit({
    client_name: 'Vikram Singh', business_name: 'Singh Electronics', mobile_number: '9654321098',
    email_address: 'singh.elec@example.com', full_address: '78 Market Yard', city: 'Bhavnagar',
    state: 'Gujarat', pin_code: '364001', client_category: 'Retail shop',
    latitude: 21.7645, longitude: 72.1519, location_accuracy: 20,
    inquiry_description: 'Simple billing software and a barcode scanner for the counter.',
    urgency: 'Low', budget_amount: 30000, lead_rating: 'Cold', lead_score: 4,
    business_potential: 'Low', estimated_business_value: 30000, consumable_scope: 'No',
    software_scope: 'Maybe', follow_up_required: 0, follow_up_date: '',
    meeting_summary: 'Evaluating options, low urgency, will decide next month.',
  }),
];

export const seedService = {
  async seedIfEmpty(): Promise<boolean> {
    const existing = await visitRepo.all();
    if (existing.length > 0) return false;

    for (const [index, sample] of SAMPLES.entries()) {
      const visitNumber = await generateVisitNumber();
      const id = await visitRepo.create({ ...sample, visit_number: visitNumber });

      const photo = SAMPLE_PHOTOS[index % SAMPLE_PHOTOS.length];
      const imgPath = await fileService.saveImage(photo, `seed_${id}_${Date.now()}.jpg`);
      await imageRepo.add({
        visit_id: id, image_path: imgPath, image_type: 'Shop',
        is_primary: 1, caption: `${sample.business_name} storefront`, created_at: new Date().toISOString(),
      });

      await childRepo.replaceInquiries(id, [
        { visit_id: id, category_name: 'Software' },
        { visit_id: id, category_name: 'Printer' },
      ]);
      await childRepo.replaceSystems(id, [{
        visit_id: id, system_name: 'Legacy Billing', vendor: 'Local vendor', system_type: 'Billing software',
        platform: 'Desktop based', number_of_users: '3', satisfaction_level: 'Low',
        issues: 'Slow, no reports', missing_features: 'Inventory, GST', renewal_date: '',
        support_provider: 'None', notes: '',
      }]);
      await childRepo.replacePrinters(id, [{
        visit_id: id, printer_type: 'Thermal printer', brand: 'Epson', model: 'TM-T82', quantity: 1,
        condition: 'Average', consumables_used: 'Thermal paper', monthly_usage: '20 rolls',
        replacement_required: 0, service_required: 1, amc_opportunity: 1, image_path: null, remarks: '',
      }]);
      if (sample.consumable_scope === 'Yes') {
        await childRepo.replaceConsumables(id, [{
          visit_id: id, opportunity_status: 'Yes', consumable_type: 'Thermal paper', brand: 'Generic',
          model: '80mm', monthly_consumption: '20 rolls', current_supplier: 'Local', current_price: '₹35/roll',
          expected_date: '', remarks: 'Recurring supply opportunity',
        }]);
      }
      if (sample.software_scope === 'Yes') {
        await childRepo.replaceSoftware(id, [{
          visit_id: id, opportunity_status: 'Yes', application_type: 'POS + Inventory', required_modules: 'Billing, Stock, GST',
          current_problem: 'Manual process', number_of_users: '3', platform: 'Desktop', integration_required: 'None',
          expected_timeline: '1 month', budget: '₹2,50,000', notes: '',
        }]);
      }
      if (sample.mobile_app_scope === 'Yes') {
        await childRepo.replaceMobileApps(id, [{
          visit_id: id, opportunity_status: 'Yes', application_type: 'Field-service application',
          main_features: 'Live tracking, proof of delivery', expected_users: '50', integrations: 'Maps',
          timeline: '3 months', budget: '₹5,00,000', notes: '',
        }]);
      }
      if (sample.follow_up_required) {
        await childRepo.replaceFollowUps(id, [{
          visit_id: id, follow_up_date: sample.follow_up_date || todayIso(), follow_up_time: '11:00',
          follow_up_mode: 'Call', follow_up_purpose: 'Send quotation', assigned_employee: 'Rahul Sharma',
          reminder_note: 'Discuss pricing', status: 'pending',
        }]);
      }
    }
    return true;
  },
};
