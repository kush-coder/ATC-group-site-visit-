/**
 * Excel report generation using ExcelJS.
 * Produces a styled multi-sheet .xlsx with embedded client images.
 * Runs asynchronously with progress callbacks so the UI never freezes.
 */
import ExcelJS from 'exceljs';
import type { VisitBundle, EmployeeProfile } from '@/types/models';
import { fileService } from '../filesystem/fileService';
import { compressDataUrl } from '../camera/cameraService';
import { COMPANY_NAME, APP_NAME } from '@/constants/options';

const GREEN = 'FF0F9D58';
const DEEP = 'FF08783F';
const FOREST = 'FF064E3B';
const MINT = 'FFEAF8F0';
const WHITE = 'FFFFFFFF';

export interface ReportOptions {
  includeImages: boolean;
  onProgress?: (pct: number, label: string) => void;
}

function headerStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DEEP } };
  cell.font = { color: { argb: WHITE }, bold: true, size: 11, name: 'Calibri' };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFBBD8C7' } },
    left: { style: 'thin', color: { argb: 'FFBBD8C7' } },
    bottom: { style: 'thin', color: { argb: 'FFBBD8C7' } },
    right: { style: 'thin', color: { argb: 'FFBBD8C7' } },
  };
}
function bodyBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'hair', color: { argb: 'FFDDE9E2' } },
    left: { style: 'hair', color: { argb: 'FFDDE9E2' } },
    bottom: { style: 'hair', color: { argb: 'FFDDE9E2' } },
    right: { style: 'hair', color: { argb: 'FFDDE9E2' } },
  };
  cell.alignment = { vertical: 'top', wrapText: true };
  cell.font = { size: 10 };
}

const b = (v: number) => (v ? 'Yes' : 'No');

async function loadImageBase64(path: string): Promise<string | null> {
  try {
    const dataUrl = await fileService.readImageAsDataUrl(path);
    // Thumbnail for excel: keep file size manageable.
    const thumb = await compressDataUrl(dataUrl, 320, 0.6);
    return thumb.split(',')[1];
  } catch {
    return null;
  }
}

export async function generateDayEndReport(
  bundles: VisitBundle[],
  employee: EmployeeProfile,
  reportDate: string,
  options: ReportOptions
): Promise<{ base64: string; fileName: string }> {
  const { includeImages, onProgress } = options;
  const wb = new ExcelJS.Workbook();
  wb.creator = COMPANY_NAME;
  wb.created = new Date();

  onProgress?.(5, 'Preparing workbook');

  /* ---------------- Sheet 1: Day-End Summary ---------------- */
  const summary = wb.addWorksheet('Day-End Summary', {
    properties: { defaultColWidth: 26 },
    views: [{ showGridLines: false }],
  });
  summary.mergeCells('A1:D1');
  const brand = summary.getCell('A1');
  brand.value = `${COMPANY_NAME}  •  ${APP_NAME}`;
  brand.font = { size: 18, bold: true, color: { argb: WHITE } };
  brand.alignment = { vertical: 'middle', horizontal: 'center' };
  brand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  summary.getRow(1).height = 34;

  summary.mergeCells('A2:D2');
  const sub = summary.getCell('A2');
  sub.value = 'Day-End Field Sales Report';
  sub.font = { size: 13, bold: true, color: { argb: FOREST } };
  sub.alignment = { horizontal: 'center' };
  summary.getRow(2).height = 22;

  const totals = computeTotals(bundles);
  const rows: [string, string | number][] = [
    ['Report Date', reportDate],
    ['Employee Name', employee.employee_name],
    ['Employee ID', employee.employee_id],
    ['Branch', employee.branch],
    ['Total Visits', bundles.length],
    ['Total Inquiries', totals.inquiries],
    ['High-Priority Leads', totals.highPriority],
    ['Consumable Opportunities', totals.consumable],
    ['Printer Opportunities', totals.printer],
    ['Software Opportunities', totals.software],
    ['Mobile Application Opportunities', totals.mobile],
    ['Follow-ups Required', totals.followUps],
    ['Estimated Total Opportunity Value', totals.estValue],
    ['Report Generated', new Date().toLocaleString()],
  ];
  let r = 4;
  for (const [label, value] of rows) {
    const lc = summary.getCell(`A${r}`);
    lc.value = label;
    lc.font = { bold: true, color: { argb: FOREST } };
    lc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MINT } };
    lc.alignment = { vertical: 'middle' };
    summary.mergeCells(`B${r}:D${r}`);
    const vc = summary.getCell(`B${r}`);
    vc.value = value as any;
    vc.alignment = { vertical: 'middle' };
    summary.getRow(r).height = 20;
    r++;
  }
  summary.getColumn(1).width = 32;

  onProgress?.(20, 'Writing visit details');

  /* ---------------- Sheet 2: Client Visit Details ---------------- */
  const details = wb.addWorksheet('Client Visit Details', { views: [{ state: 'frozen', ySplit: 1 }] });
  const columns = [
    'Sr. No.', 'Primary Client Image', 'Visit Number', 'Visit Date', 'Visit Time',
    'Employee Name', 'Employee ID', 'Visit Type', 'Client Name', 'Business or Shop Name',
    'Contact Person', 'Designation', 'Mobile Number', 'WhatsApp Number', 'Email Address',
    'Full Address', 'Area', 'City', 'State', 'PIN Code', 'Client Category', 'GPS Latitude',
    'GPS Longitude', 'Existing System', 'System Type', 'Existing Software Vendor',
    'Current System Issues', 'Printer Available', 'Printer Type', 'Printer Brand',
    'Printer Model', 'Printer Quantity', 'Printer Condition', 'Inquiry Category',
    'Inquiry Title', 'Inquiry Description', 'Inquiry Urgency', 'Consumable Scope',
    'Consumable Type', 'Monthly Consumption', 'Printer Selling Scope', 'Required Printer Type',
    'Software Customization Scope', 'Mobile Application Scope', 'Web Application Scope',
    'Lead Rating', 'Lead Score', 'Business Potential', 'Probability', 'Estimated Business Value',
    'Follow-Up Required', 'Follow-Up Date', 'Follow-Up Mode', 'Meeting Summary',
    'Client Response', 'Employee Observation', 'Recommended Solution', 'Next Action',
    'Additional Comments', 'Record Status',
  ];
  const headerRow = details.addRow(columns);
  headerRow.height = 30;
  headerRow.eachCell(headerStyle);
  details.getColumn(2).width = 20; // image column
  columns.forEach((_, i) => {
    const col = details.getColumn(i + 1);
    if (i !== 1 && !col.width) col.width = 18;
  });

  let sr = 1;
  for (const bundle of bundles) {
    const { visit, systems, printers, inquiryCategories, consumables } = bundle;
    const sys = systems[0];
    const prn = printers[0];
    const con = consumables[0];
    const rowValues = [
      sr, '', visit.visit_number, visit.visit_date, visit.visit_time, visit.employee_name,
      visit.employee_id, visit.visit_type, visit.client_name, visit.business_name,
      visit.contact_person, visit.designation, visit.mobile_number, visit.whatsapp_number,
      visit.email_address, visit.full_address, visit.area, visit.city, visit.state,
      visit.pin_code, visit.client_category, visit.latitude ?? '', visit.longitude ?? '',
      visit.existing_system_status, sys?.system_type ?? '', sys?.vendor ?? '', sys?.issues ?? '',
      visit.printer_status, prn?.printer_type ?? '', prn?.brand ?? '', prn?.model ?? '',
      prn?.quantity ?? '', prn?.condition ?? '', inquiryCategories.map((c) => c.category_name).join(', '),
      visit.inquiry_title, visit.inquiry_description, visit.urgency, visit.consumable_scope,
      con?.consumable_type ?? '', con?.monthly_consumption ?? '', visit.printer_scope,
      bundle.printerOpportunities[0]?.required_printer_type ?? '', visit.software_scope,
      visit.mobile_app_scope, visit.web_app_scope, visit.lead_rating, visit.lead_score,
      visit.business_potential, `${visit.probability}%`, visit.estimated_business_value ?? '',
      b(visit.follow_up_required), visit.follow_up_date, visit.follow_up_mode,
      visit.meeting_summary, visit.client_response, visit.employee_observation,
      visit.recommended_solution, visit.next_action, visit.additional_comments, visit.status,
    ];
    const row = details.addRow(rowValues);
    row.eachCell(bodyBorder);

    if (includeImages) {
      const primary = bundle.images.find((i) => i.is_primary) ?? bundle.images[0];
      if (primary) {
        const b64 = await loadImageBase64(primary.image_path);
        if (b64) {
          row.height = 78;
          const imgId = wb.addImage({ base64: b64, extension: 'jpeg' });
          details.addImage(imgId, {
            tl: { col: 1.15, row: row.number - 1 + 0.1 },
            ext: { width: 96, height: 96 },
            editAs: 'oneCell',
          });
        }
      }
    }
    sr++;
    onProgress?.(20 + Math.round((sr / Math.max(bundles.length, 1)) * 40), 'Writing visit details');
  }

  onProgress?.(65, 'Writing opportunities');

  /* ---------------- Sheet 3: Opportunity Summary ---------------- */
  const oppSheet = wb.addWorksheet('Opportunity Summary');
  const oppCols = ['Visit Number', 'Client Name', 'Opportunity Type', 'Opportunity Status',
    'Product or Service', 'Quantity', 'Estimated Value', 'Expected Date', 'Lead Rating',
    'Follow-up Date', 'Notes'];
  const oppHeader = oppSheet.addRow(oppCols);
  oppHeader.height = 26;
  oppHeader.eachCell(headerStyle);
  oppCols.forEach((_, i) => (oppSheet.getColumn(i + 1).width = 20));
  for (const bundle of bundles) {
    const v = bundle.visit;
    for (const c of bundle.consumables) {
      oppSheet.addRow([v.visit_number, v.client_name, 'Consumable', c.opportunity_status,
        c.consumable_type, '', c.current_price, c.expected_date, v.lead_rating, v.follow_up_date, c.remarks])
        .eachCell(bodyBorder);
    }
    for (const p of bundle.printerOpportunities) {
      oppSheet.addRow([v.visit_number, v.client_name, 'Printer', p.opportunity_status,
        p.required_printer_type, p.quantity, p.budget, p.expected_purchase_date, v.lead_rating, v.follow_up_date, p.remarks])
        .eachCell(bodyBorder);
    }
    for (const s of bundle.softwareOpportunities) {
      oppSheet.addRow([v.visit_number, v.client_name, 'Software', s.opportunity_status,
        s.application_type, '', s.budget, s.expected_timeline, v.lead_rating, v.follow_up_date, s.notes])
        .eachCell(bodyBorder);
    }
    for (const m of bundle.mobileAppOpportunities) {
      oppSheet.addRow([v.visit_number, v.client_name, 'Mobile App', m.opportunity_status,
        m.application_type, '', m.budget, m.timeline, v.lead_rating, v.follow_up_date, m.notes])
        .eachCell(bodyBorder);
    }
  }

  /* ---------------- Sheet 4: Follow-Up Report ---------------- */
  const fuSheet = wb.addWorksheet('Follow-Up Report');
  const fuCols = ['Visit Number', 'Client Name', 'Mobile Number', 'Follow-up Date',
    'Follow-up Time', 'Follow-up Mode', 'Follow-up Purpose', 'Priority', 'Assigned Employee',
    'Status', 'Remarks'];
  const fuHeader = fuSheet.addRow(fuCols);
  fuHeader.height = 26;
  fuHeader.eachCell(headerStyle);
  fuCols.forEach((_, i) => (fuSheet.getColumn(i + 1).width = 20));
  for (const bundle of bundles) {
    const v = bundle.visit;
    const list = bundle.followUps.length
      ? bundle.followUps
      : v.follow_up_required
        ? [{ follow_up_date: v.follow_up_date, follow_up_time: v.follow_up_time, follow_up_mode: v.follow_up_mode, follow_up_purpose: v.next_action, assigned_employee: v.employee_name, reminder_note: '', status: 'pending' } as any]
        : [];
    for (const f of list) {
      fuSheet.addRow([v.visit_number, v.client_name, v.mobile_number, f.follow_up_date,
        f.follow_up_time, f.follow_up_mode, f.follow_up_purpose, v.priority, f.assigned_employee,
        f.status, f.reminder_note]).eachCell(bodyBorder);
    }
  }

  onProgress?.(80, 'Embedding images');

  /* ---------------- Sheet 5: Visit Images ---------------- */
  if (includeImages) {
    const imgSheet = wb.addWorksheet('Visit Images');
    const imgCols = ['Sr. No.', 'Visit Number', 'Client Name', 'Image', 'Image Category', 'Caption', 'Capture Date'];
    const imgHeader = imgSheet.addRow(imgCols);
    imgHeader.height = 26;
    imgHeader.eachCell(headerStyle);
    imgSheet.getColumn(1).width = 8;
    imgSheet.getColumn(2).width = 24;
    imgSheet.getColumn(3).width = 22;
    imgSheet.getColumn(4).width = 20;
    imgSheet.getColumn(5).width = 18;
    imgSheet.getColumn(6).width = 26;
    imgSheet.getColumn(7).width = 20;
    let isr = 1;
    for (const bundle of bundles) {
      for (const image of bundle.images) {
        const b64 = await loadImageBase64(image.image_path);
        const row = imgSheet.addRow([isr, bundle.visit.visit_number, bundle.visit.client_name,
          '', image.image_type, image.caption, (image.created_at || '').split('T')[0]]);
        row.eachCell(bodyBorder);
        if (b64) {
          row.height = 96;
          const imgId = wb.addImage({ base64: b64, extension: 'jpeg' });
          imgSheet.addImage(imgId, {
            tl: { col: 3.1, row: row.number - 1 + 0.1 },
            ext: { width: 118, height: 118 },
            editAs: 'oneCell',
          });
        }
        isr++;
      }
    }
  }

  onProgress?.(92, 'Finalising file');

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = arrayBufferToBase64(buffer as ArrayBuffer);
  const safeName = employee.employee_name.replace(/[^a-zA-Z0-9]/g, '') || 'Employee';
  const fileName = `ATC_FieldConnect_Day_End_Report_${safeName}_${reportDate}.xlsx`;

  onProgress?.(100, 'Done');
  return { base64, fileName };
}

function computeTotals(bundles: VisitBundle[]) {
  let inquiries = 0, consumable = 0, printer = 0, software = 0, mobile = 0, followUps = 0, highPriority = 0, estValue = 0;
  for (const bd of bundles) {
    inquiries += bd.inquiryCategories.length || (bd.visit.inquiry_description ? 1 : 0);
    if (bd.consumables.some((c) => c.opportunity_status === 'Yes' || c.opportunity_status === 'Maybe')) consumable++;
    if (bd.printerOpportunities.some((p) => p.opportunity_status === 'Yes' || p.opportunity_status === 'Maybe')) printer++;
    if (bd.softwareOpportunities.some((s) => ['Yes', 'Maybe', 'Need requirement discussion'].includes(s.opportunity_status))) software++;
    if (bd.mobileAppOpportunities.some((m) => ['Yes', 'Maybe', 'Need requirement discussion'].includes(m.opportunity_status))) mobile++;
    if (bd.visit.follow_up_required) followUps++;
    if (['Hot', 'Immediate'].includes(bd.visit.lead_rating) || ['High', 'Very high'].includes(bd.visit.business_potential)) highPriority++;
    estValue += bd.visit.estimated_business_value ?? 0;
  }
  return { inquiries, consumable, printer, software, mobile, followUps, highPriority, estValue };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(binary);
}
