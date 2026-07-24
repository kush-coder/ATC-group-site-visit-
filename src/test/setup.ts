/**
 * Global test setup: jest-dom matchers, browser polyfills that jsdom lacks,
 * and module mocks so every page can be rendered in isolation without touching
 * native plugins, SQLite, the camera, GPS, or the filesystem.
 */
import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

/* ------------------------------------------------------------------ */
/* jsdom polyfills                                                     */
/* ------------------------------------------------------------------ */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
(globalThis as any).ResizeObserver = MockObserver;
(globalThis as any).IntersectionObserver = MockObserver;

if (!Element.prototype.animate) {
  Element.prototype.animate = () =>
    ({ finished: Promise.resolve(), cancel() {}, play() {}, pause() {} }) as unknown as Animation;
}
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
(HTMLElement.prototype as any).scrollToTop = (HTMLElement.prototype as any).scrollToTop || (() => Promise.resolve());

/* ------------------------------------------------------------------ */
/* Shared stub fixtures (hoisted so mock factories can use them)       */
/* ------------------------------------------------------------------ */
const fx = vi.hoisted(() => {
  const sampleProfile = {
    id: 1, employee_name: 'Test Employee', employee_id: 'EMP1', mobile_number: '9876543210',
    email: 'test@example.com', department: 'Sales', designation: 'Executive', branch: 'HQ',
    profile_image_path: null, manager_name: 'Manager', pin_enabled: 0, pin_hash: null,
    biometric_enabled: 0, created_at: '', updated_at: '',
  };
  const sampleVisit = {
    id: 5, visit_number: 'ATC-VISIT-20260724-0001', employee_id: 'EMP1', employee_name: 'Test Employee',
    visit_date: '2026-07-24', visit_time: '10:30', visit_type: 'Sales visit',
    client_name: 'Test Client', business_name: 'Test Business', contact_person: 'John', designation: 'Owner',
    mobile_number: '9876543210', whatsapp_number: '9876543210', email_address: 'client@example.com',
    alternate_number: '', full_address: '12 Test Road', area: 'Central', city: 'Ahmedabad', state: 'Gujarat',
    pin_code: '380001', landmark: '', website: '', client_category: 'Retail shop',
    latitude: 23.02, longitude: 72.57, location_accuracy: 10, location_time: '',
    existing_system_status: 'Yes', printer_status: 'Yes', inquiry_title: 'Billing', inquiry_description: 'Needs POS',
    client_requirement: '', expected_quantity: '', expected_timeline: '', urgency: 'High',
    budget_available: 1, budget_amount: 250000, decision_maker: '', competitor_info: '',
    quotation_required: 1, demo_required: 0, technical_visit_required: 0, follow_up_required: 1,
    consumable_scope: 'Yes', printer_scope: 'Maybe', software_scope: 'Yes', mobile_app_scope: 'No', web_app_scope: 'No',
    lead_rating: 'Hot', lead_score: 9, business_potential: 'Very high', probability: 70,
    estimated_business_value: 250000, priority: 'High', expected_closure_date: '', management_attention: 0,
    follow_up_date: '2026-07-25', follow_up_time: '11:00', follow_up_mode: 'Call',
    meeting_summary: 'Great meeting', client_response: 'Positive', employee_observation: '',
    challenges_identified: '', recommended_solution: '', next_action: 'Quote', additional_comments: '',
    status: 'submitted', created_at: '', updated_at: '',
  };
  const sampleBundle = {
    visit: sampleVisit,
    images: [{ id: 1, visit_id: 5, image_path: 'p.jpg', image_type: 'Shop', is_primary: 1, caption: 'Front', created_at: '2026-07-24' }],
    systems: [{ id: 1, visit_id: 5, system_name: 'Legacy', vendor: 'V', system_type: 'Billing software', platform: 'Desktop based', number_of_users: '3', satisfaction_level: 'Low', issues: 'Slow', missing_features: '', renewal_date: '', support_provider: '', notes: '' }],
    printers: [{ id: 1, visit_id: 5, printer_type: 'Thermal printer', brand: 'Epson', model: 'TM', quantity: 1, condition: 'Average', consumables_used: '', monthly_usage: '20', replacement_required: 0, service_required: 1, amc_opportunity: 1, image_path: null, remarks: '' }],
    inquiryCategories: [{ id: 1, visit_id: 5, category_name: 'Software' }],
    consumables: [{ id: 1, visit_id: 5, opportunity_status: 'Yes', consumable_type: 'Thermal paper', brand: '', model: '', monthly_consumption: '20', current_supplier: '', current_price: '', expected_date: '', remarks: '' }],
    printerOpportunities: [{ id: 1, visit_id: 5, opportunity_status: 'Maybe', required_printer_type: 'Laser printer', preferred_brand: '', quantity: 1, budget: '', expected_purchase_date: '', usage_requirement: '', remarks: '' }],
    softwareOpportunities: [{ id: 1, visit_id: 5, opportunity_status: 'Yes', application_type: 'POS', required_modules: '', current_problem: '', number_of_users: '', platform: 'Desktop', integration_required: '', expected_timeline: '', budget: '', notes: '' }],
    mobileAppOpportunities: [],
    followUps: [{ id: 1, visit_id: 5, follow_up_date: '2026-07-25', follow_up_time: '11:00', follow_up_mode: 'Call', follow_up_purpose: 'Quote', assigned_employee: 'Test Employee', reminder_note: '', status: 'pending' }],
  };
  const stats = {
    todayVisits: 1, completedVisits: 1, pendingFollowUps: 1, highPotential: 1,
    consumableOpps: 1, printerOpps: 1, softwareOpps: 1, mobileAppOpps: 0, estimatedValue: 250000,
  };
  return { sampleProfile, sampleVisit, sampleBundle, stats };
});

export const fixtures = fx;

/* ------------------------------------------------------------------ */
/* Ionic lifecycle hooks -> fire once on mount so page loaders run     */
/* ------------------------------------------------------------------ */
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  const React = await import('react');
  const runOnMount = (cb?: () => void) => {
    React.useEffect(() => { cb?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  };
  return {
    ...actual,
    useIonViewWillEnter: runOnMount,
    useIonViewDidEnter: runOnMount,
    useIonViewWillLeave: () => {},
    useIonViewDidLeave: () => {},
  };
});

/* ------------------------------------------------------------------ */
/* Capacitor + native plugin mocks                                     */
/* ------------------------------------------------------------------ */
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web', convertFileSrc: (u: string) => u, isNativePlatform: () => false },
}));
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn(async () => ({ dataUrl: 'data:image/jpeg;base64,AA' })) },
  CameraSource: { Camera: 'CAMERA', Photos: 'PHOTOS' },
  CameraResultType: { DataUrl: 'dataUrl' },
}));

/* ------------------------------------------------------------------ */
/* App service / repository / context mocks                            */
/* ------------------------------------------------------------------ */
vi.mock('@/hooks/AppContext', () => ({
  useApp: () => ({
    dbReady: true,
    profile: fx.sampleProfile,
    refreshProfile: vi.fn(async () => {}),
    toast: vi.fn(),
    haptic: vi.fn(),
  }),
  AppProvider: ({ children }: { children: any }) => children,
}));

vi.mock('@/services/database/repository', () => ({
  employeeRepo: { get: vi.fn(async () => fx.sampleProfile), upsert: vi.fn(async () => fx.sampleProfile) },
  visitRepo: {
    all: vi.fn(async () => [fx.sampleVisit]),
    byDate: vi.fn(async () => [fx.sampleVisit]),
    get: vi.fn(async () => fx.sampleVisit),
    create: vi.fn(async () => 1),
    update: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  },
  imageRepo: {
    primaryFor: vi.fn(async () => fx.sampleBundle.images[0]),
    forVisit: vi.fn(async () => fx.sampleBundle.images),
    add: vi.fn(async () => 1),
    delete: vi.fn(async () => {}),
    setPrimary: vi.fn(async () => {}),
  },
  childRepo: {
    replaceInquiries: vi.fn(async () => {}), replaceSystems: vi.fn(async () => {}),
    replacePrinters: vi.fn(async () => {}), replaceConsumables: vi.fn(async () => {}),
    replacePrinterOpps: vi.fn(async () => {}), replaceSoftware: vi.fn(async () => {}),
    replaceMobileApps: vi.fn(async () => {}), replaceFollowUps: vi.fn(async () => {}),
  },
  generateVisitNumber: vi.fn(async () => 'ATC-VISIT-20260724-0001'),
  getVisitBundle: vi.fn(async () => fx.sampleBundle),
  getDashboardStats: vi.fn(async () => fx.stats),
}));

vi.mock('@/services/database/db', () => ({
  dbManager: {
    init: vi.fn(async () => {}), persist: vi.fn(async () => {}), isReady: () => true,
    query: vi.fn(async () => [{ c: 1, image_path: 'p.jpg' }]),
    run: vi.fn(async () => ({ lastId: 1, changes: 1 })),
    execute: vi.fn(async () => {}),
  },
}));

vi.mock('@/services/filesystem/fileService', () => ({
  fileService: {
    IMAGE_DIR: 'atc_images', REPORT_DIR: 'atc_reports', BACKUP_DIR: 'atc_backups',
    saveImage: vi.fn(async () => 'atc_images/p.jpg'),
    readImageAsDataUrl: vi.fn(async () => { throw new Error('no-image-in-test'); }),
    readBase64: vi.fn(async () => ''),
    displaySrc: vi.fn(async () => ''),
    deleteFile: vi.fn(async () => {}),
    saveReport: vi.fn(async () => ({ path: 'atc_reports/r.xlsx', uri: 'file://r.xlsx' })),
    saveBackup: vi.fn(async () => ({ path: 'atc_backups/b.zip', uri: 'file://b.zip' })),
    writeText: vi.fn(async () => {}),
    listReports: vi.fn(async () => ['r1.xlsx']),
    statSize: vi.fn(async () => 1024),
  },
}));

vi.mock('@/services/camera/cameraService', () => ({
  cameraService: {
    capture: vi.fn(async () => ({ path: 'atc_images/p.jpg', dataUrl: 'data:image/jpeg;base64,AA' })),
    takePhoto: vi.fn(async () => ({ path: 'atc_images/p.jpg', dataUrl: 'data:image/jpeg;base64,AA' })),
    pickFromGallery: vi.fn(async () => ({ path: 'atc_images/p.jpg', dataUrl: 'data:image/jpeg;base64,AA' })),
  },
  compressDataUrl: vi.fn(async (d: string) => d),
}));

vi.mock('@/services/geolocation/geoService', () => ({
  geoService: { current: vi.fn(async () => ({ latitude: 23.02, longitude: 72.57, accuracy: 10, time: '2026-07-24T10:00:00Z' })) },
}));

vi.mock('@/services/notifications/notificationService', () => ({
  notificationService: { ensurePermission: vi.fn(async () => true), scheduleFollowUp: vi.fn(async () => true), cancel: vi.fn(async () => {}) },
}));

vi.mock('@/services/share/shareService', () => ({
  shareService: { shareFile: vi.fn(async () => {}), shareText: vi.fn(async () => {}), downloadBase64: vi.fn(() => {}) },
}));

vi.mock('@/services/security/securityService', () => ({
  securityService: {
    hashPin: vi.fn(async () => 'hash'), verifyPin: vi.fn(async () => true),
    markActive: vi.fn(async () => {}), isSessionExpired: vi.fn(async () => false),
    setSetting: vi.fn(async () => {}), getSetting: vi.fn(async () => null),
  },
}));

vi.mock('@/services/draft/draftService', () => ({
  draftService: { save: vi.fn(async () => {}), load: vi.fn(async () => null), clear: vi.fn(async () => {}), has: vi.fn(async () => false) },
}));

vi.mock('@/services/seed/seedService', () => ({
  seedService: { seedIfEmpty: vi.fn(async () => false) },
}));

vi.mock('@/services/backup/backupService', () => ({
  backupService: {
    exportZip: vi.fn(async () => ({ base64: 'AAAA', fileName: 'ATC_FieldConnect_Backup_2026-07-24_10-00.zip' })),
    validate: vi.fn(async () => ({ app: 'ATC FieldConnect', version: '1.0.0', createdAt: '2026-07-24T10:00:00Z', tableCounts: {} })),
    restoreZip: vi.fn(async () => {}),
  },
}));
