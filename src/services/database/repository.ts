/**
 * Data-access repository. All read/write helpers for the domain models.
 */
import { dbManager } from './db';
import type {
  ClientVisit, VisitImage, ExistingSystem, PrinterDetail, InquiryCategory,
  ConsumableOpportunity, PrinterOpportunity, SoftwareOpportunity,
  MobileAppOpportunity, FollowUp, EmployeeProfile, VisitBundle, DashboardStats,
} from '@/types/models';

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Employee profile                                                    */
/* ------------------------------------------------------------------ */
export const employeeRepo = {
  async get(): Promise<EmployeeProfile | null> {
    const rows = await dbManager.query<EmployeeProfile>(
      'SELECT * FROM employee_profile ORDER BY id ASC LIMIT 1'
    );
    return rows[0] ?? null;
  },

  async upsert(p: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    const existing = await this.get();
    const ts = nowIso();
    if (existing?.id) {
      await dbManager.run(
        `UPDATE employee_profile SET employee_name=?, employee_id=?, mobile_number=?, email=?,
          department=?, designation=?, branch=?, profile_image_path=?, manager_name=?,
          pin_enabled=?, pin_hash=?, biometric_enabled=?, updated_at=? WHERE id=?`,
        [
          p.employee_name ?? existing.employee_name,
          p.employee_id ?? existing.employee_id,
          p.mobile_number ?? existing.mobile_number,
          p.email ?? existing.email,
          p.department ?? existing.department,
          p.designation ?? existing.designation,
          p.branch ?? existing.branch,
          p.profile_image_path ?? existing.profile_image_path,
          p.manager_name ?? existing.manager_name,
          p.pin_enabled ?? existing.pin_enabled,
          p.pin_hash ?? existing.pin_hash,
          p.biometric_enabled ?? existing.biometric_enabled,
          ts, existing.id,
        ]
      );
    } else {
      await dbManager.run(
        `INSERT INTO employee_profile (employee_name, employee_id, mobile_number, email,
          department, designation, branch, profile_image_path, manager_name,
          pin_enabled, pin_hash, biometric_enabled, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          p.employee_name ?? '', p.employee_id ?? '', p.mobile_number ?? '', p.email ?? '',
          p.department ?? '', p.designation ?? '', p.branch ?? '',
          p.profile_image_path ?? null, p.manager_name ?? null,
          p.pin_enabled ?? 0, p.pin_hash ?? null, p.biometric_enabled ?? 0, ts, ts,
        ]
      );
    }
    return (await this.get())!;
  },
};

/* ------------------------------------------------------------------ */
/* Visit number generation                                             */
/* ------------------------------------------------------------------ */
export async function generateVisitNumber(date: Date = new Date()): Promise<string> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const datePart = `${y}${m}${d}`;
  const rows = await dbManager.query<{ c: number }>(
    `SELECT COUNT(*) as c FROM client_visits WHERE visit_number LIKE ?`,
    [`ATC-VISIT-${datePart}-%`]
  );
  const seq = String((rows[0]?.c ?? 0) + 1).padStart(4, '0');
  return `ATC-VISIT-${datePart}-${seq}`;
}

/* ------------------------------------------------------------------ */
/* Client visits                                                       */
/* ------------------------------------------------------------------ */
const VISIT_COLUMNS = [
  'visit_number', 'employee_id', 'employee_name', 'visit_date', 'visit_time', 'visit_type',
  'client_name', 'business_name', 'contact_person', 'designation', 'mobile_number',
  'whatsapp_number', 'email_address', 'alternate_number', 'full_address', 'area', 'city',
  'state', 'pin_code', 'landmark', 'website', 'client_category', 'latitude', 'longitude',
  'location_accuracy', 'location_time', 'existing_system_status', 'printer_status',
  'inquiry_title', 'inquiry_description', 'client_requirement', 'expected_quantity',
  'expected_timeline', 'urgency', 'budget_available', 'budget_amount', 'decision_maker',
  'competitor_info', 'quotation_required', 'demo_required', 'technical_visit_required',
  'follow_up_required', 'consumable_scope', 'printer_scope', 'software_scope',
  'mobile_app_scope', 'web_app_scope', 'lead_rating', 'lead_score', 'business_potential',
  'probability', 'estimated_business_value', 'priority', 'expected_closure_date',
  'management_attention', 'follow_up_date', 'follow_up_time', 'follow_up_mode',
  'meeting_summary', 'client_response', 'employee_observation', 'challenges_identified',
  'recommended_solution', 'next_action', 'additional_comments', 'status',
];

function visitValues(v: Partial<ClientVisit>): any[] {
  return VISIT_COLUMNS.map((c) => {
    const val = (v as any)[c];
    return val === undefined ? null : val;
  });
}

export const visitRepo = {
  async create(v: Partial<ClientVisit>): Promise<number> {
    const ts = nowIso();
    const cols = [...VISIT_COLUMNS, 'created_at', 'updated_at'];
    const placeholders = cols.map(() => '?').join(',');
    const res = await dbManager.run(
      `INSERT INTO client_visits (${cols.join(',')}) VALUES (${placeholders})`,
      [...visitValues(v), ts, ts]
    );
    return res.lastId!;
  },

  async update(id: number, v: Partial<ClientVisit>): Promise<void> {
    const setClause = VISIT_COLUMNS.map((c) => `${c}=?`).join(',');
    await dbManager.run(
      `UPDATE client_visits SET ${setClause}, updated_at=? WHERE id=?`,
      [...visitValues(v), nowIso(), id]
    );
  },

  async get(id: number): Promise<ClientVisit | null> {
    const rows = await dbManager.query<ClientVisit>('SELECT * FROM client_visits WHERE id=?', [id]);
    return rows[0] ?? null;
  },

  async all(): Promise<ClientVisit[]> {
    return dbManager.query<ClientVisit>('SELECT * FROM client_visits ORDER BY id DESC');
  },

  async byDate(date: string): Promise<ClientVisit[]> {
    return dbManager.query<ClientVisit>(
      'SELECT * FROM client_visits WHERE visit_date=? ORDER BY id DESC',
      [date]
    );
  },

  async delete(id: number): Promise<void> {
    // Explicit cascade in case FK enforcement is off.
    for (const t of ['visit_images', 'existing_systems', 'printer_details', 'inquiry_categories',
      'consumable_opportunities', 'printer_opportunities', 'software_opportunities',
      'mobile_app_opportunities', 'follow_ups']) {
      await dbManager.run(`DELETE FROM ${t} WHERE visit_id=?`, [id]);
    }
    await dbManager.run('DELETE FROM client_visits WHERE id=?', [id]);
  },
};

/* ------------------------------------------------------------------ */
/* Child collections (generic helpers)                                 */
/* ------------------------------------------------------------------ */
async function insertChild(table: string, cols: string[], obj: any): Promise<number> {
  const placeholders = cols.map(() => '?').join(',');
  const res = await dbManager.run(
    `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
    cols.map((c) => (obj[c] === undefined ? null : obj[c]))
  );
  return res.lastId!;
}
async function replaceChildren(table: string, cols: string[], visitId: number, items: any[]): Promise<void> {
  await dbManager.run(`DELETE FROM ${table} WHERE visit_id=?`, [visitId]);
  for (const item of items) {
    await insertChild(table, cols, { ...item, visit_id: visitId });
  }
}
async function readChildren<T>(table: string, visitId: number): Promise<T[]> {
  return dbManager.query<T>(`SELECT * FROM ${table} WHERE visit_id=?`, [visitId]);
}

export const imageRepo = {
  cols: ['visit_id', 'image_path', 'image_type', 'is_primary', 'caption', 'created_at'],
  async add(img: Omit<VisitImage, 'id'>): Promise<number> {
    return insertChild('visit_images', this.cols, img);
  },
  async forVisit(visitId: number): Promise<VisitImage[]> {
    return readChildren<VisitImage>('visit_images', visitId);
  },
  async delete(id: number): Promise<void> {
    await dbManager.run('DELETE FROM visit_images WHERE id=?', [id]);
  },
  async setPrimary(visitId: number, imageId: number): Promise<void> {
    await dbManager.run('UPDATE visit_images SET is_primary=0 WHERE visit_id=?', [visitId]);
    await dbManager.run('UPDATE visit_images SET is_primary=1 WHERE id=?', [imageId]);
  },
  async primaryFor(visitId: number): Promise<VisitImage | null> {
    const rows = await dbManager.query<VisitImage>(
      'SELECT * FROM visit_images WHERE visit_id=? ORDER BY is_primary DESC, id ASC LIMIT 1',
      [visitId]
    );
    return rows[0] ?? null;
  },
};

const systemCols = ['visit_id', 'system_name', 'vendor', 'system_type', 'platform',
  'number_of_users', 'satisfaction_level', 'issues', 'missing_features', 'renewal_date',
  'support_provider', 'notes'];
const printerCols = ['visit_id', 'printer_type', 'brand', 'model', 'quantity', 'condition',
  'consumables_used', 'monthly_usage', 'replacement_required', 'service_required',
  'amc_opportunity', 'image_path', 'remarks'];
const inquiryCols = ['visit_id', 'category_name'];
const consumableCols = ['visit_id', 'opportunity_status', 'consumable_type', 'brand', 'model',
  'monthly_consumption', 'current_supplier', 'current_price', 'expected_date', 'remarks'];
const printerOppCols = ['visit_id', 'opportunity_status', 'required_printer_type',
  'preferred_brand', 'quantity', 'budget', 'expected_purchase_date', 'usage_requirement', 'remarks'];
const softwareCols = ['visit_id', 'opportunity_status', 'application_type', 'required_modules',
  'current_problem', 'number_of_users', 'platform', 'integration_required', 'expected_timeline',
  'budget', 'notes'];
const mobileCols = ['visit_id', 'opportunity_status', 'application_type', 'main_features',
  'expected_users', 'integrations', 'timeline', 'budget', 'notes'];
const followUpCols = ['visit_id', 'follow_up_date', 'follow_up_time', 'follow_up_mode',
  'follow_up_purpose', 'assigned_employee', 'reminder_note', 'status'];

export const childRepo = {
  replaceSystems: (id: number, items: ExistingSystem[]) => replaceChildren('existing_systems', systemCols, id, items),
  replacePrinters: (id: number, items: PrinterDetail[]) => replaceChildren('printer_details', printerCols, id, items),
  replaceInquiries: (id: number, items: InquiryCategory[]) => replaceChildren('inquiry_categories', inquiryCols, id, items),
  replaceConsumables: (id: number, items: ConsumableOpportunity[]) => replaceChildren('consumable_opportunities', consumableCols, id, items),
  replacePrinterOpps: (id: number, items: PrinterOpportunity[]) => replaceChildren('printer_opportunities', printerOppCols, id, items),
  replaceSoftware: (id: number, items: SoftwareOpportunity[]) => replaceChildren('software_opportunities', softwareCols, id, items),
  replaceMobileApps: (id: number, items: MobileAppOpportunity[]) => replaceChildren('mobile_app_opportunities', mobileCols, id, items),
  replaceFollowUps: (id: number, items: FollowUp[]) => replaceChildren('follow_ups', followUpCols, id, items),
};

/* ------------------------------------------------------------------ */
/* Bundle read + dashboard aggregation                                 */
/* ------------------------------------------------------------------ */
export async function getVisitBundle(visitId: number): Promise<VisitBundle | null> {
  const visit = await visitRepo.get(visitId);
  if (!visit) return null;
  return {
    visit,
    images: await readChildren<VisitImage>('visit_images', visitId),
    systems: await readChildren<ExistingSystem>('existing_systems', visitId),
    printers: await readChildren<PrinterDetail>('printer_details', visitId),
    inquiryCategories: await readChildren<InquiryCategory>('inquiry_categories', visitId),
    consumables: await readChildren<ConsumableOpportunity>('consumable_opportunities', visitId),
    printerOpportunities: await readChildren<PrinterOpportunity>('printer_opportunities', visitId),
    softwareOpportunities: await readChildren<SoftwareOpportunity>('software_opportunities', visitId),
    mobileAppOpportunities: await readChildren<MobileAppOpportunity>('mobile_app_opportunities', visitId),
    followUps: await readChildren<FollowUp>('follow_ups', visitId),
  };
}

export async function getDashboardStats(date: string): Promise<DashboardStats> {
  const one = async (sql: string, params: any[] = []) => {
    const r = await dbManager.query<{ c: number }>(sql, params);
    return r[0]?.c ?? 0;
  };
  const todayVisits = await one('SELECT COUNT(*) c FROM client_visits WHERE visit_date=?', [date]);
  const completedVisits = await one("SELECT COUNT(*) c FROM client_visits WHERE visit_date=? AND status='submitted'", [date]);
  const pendingFollowUps = await one("SELECT COUNT(*) c FROM client_visits WHERE follow_up_required=1 AND status='submitted'");
  const highPotential = await one("SELECT COUNT(*) c FROM client_visits WHERE visit_date=? AND (lead_rating='Hot' OR lead_rating='Immediate' OR business_potential='High' OR business_potential='Very high')", [date]);
  const consumableOpps = await one("SELECT COUNT(DISTINCT visit_id) c FROM consumable_opportunities co JOIN client_visits v ON v.id=co.visit_id WHERE v.visit_date=? AND (co.opportunity_status='Yes' OR co.opportunity_status='Maybe')", [date]);
  const printerOpps = await one("SELECT COUNT(DISTINCT visit_id) c FROM printer_opportunities po JOIN client_visits v ON v.id=po.visit_id WHERE v.visit_date=? AND (po.opportunity_status='Yes' OR po.opportunity_status='Maybe')", [date]);
  const softwareOpps = await one("SELECT COUNT(DISTINCT visit_id) c FROM software_opportunities so JOIN client_visits v ON v.id=so.visit_id WHERE v.visit_date=? AND so.opportunity_status IN ('Yes','Maybe','Need requirement discussion')", [date]);
  const mobileAppOpps = await one("SELECT COUNT(DISTINCT visit_id) c FROM mobile_app_opportunities mo JOIN client_visits v ON v.id=mo.visit_id WHERE v.visit_date=? AND mo.opportunity_status IN ('Yes','Maybe','Need requirement discussion')", [date]);
  const valRows = await dbManager.query<{ s: number }>(
    'SELECT COALESCE(SUM(estimated_business_value),0) s FROM client_visits WHERE visit_date=?', [date]
  );
  return {
    todayVisits, completedVisits, pendingFollowUps, highPotential,
    consumableOpps, printerOpps, softwareOpps, mobileAppOpps,
    estimatedValue: valRows[0]?.s ?? 0,
  };
}
