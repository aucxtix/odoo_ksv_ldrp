/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import bcryptjs from 'bcryptjs';
import { 
  User, Vendor, RFQ, RFQItem, RFQVendor, 
  Quotation, QuotationItem, Approval, PurchaseOrder, 
  Invoice, ActivityLog, Contract, Budget, VendorRating
} from '../types.js';

const DB_FILE = path.join(process.cwd(), 'database.json');

export interface DatabaseSchema {
  users: User[];
  vendors: Vendor[];
  vendor_ratings: VendorRating[];
  rfqs: RFQ[];
  rfq_items: RFQItem[];
  rfq_vendors: RFQVendor[];
  quotations: Quotation[];
  quotation_items: QuotationItem[];
  approvals: Approval[];
  purchase_orders: PurchaseOrder[];
  invoices: Invoice[];
  activity_log: ActivityLog[];
  contracts: Contract[];
  budgets: Budget[];
  permissions: any[];
  role_permissions: any[];
  user_permission_overrides: any[];
  security_violations: any[];
  approval_authority: any[];
  temporary_access: any[];
}

// Global active database object holding full schema
let dbInstance: DatabaseSchema | null = null;

export function loadDb(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(content);
      return dbInstance!;
    } catch (e) {
      console.error('Error loading database.json, re-creating empty database', e);
    }
  }

  // Set up and seed database
  dbInstance = {
    users: [],
    vendors: [],
    vendor_ratings: [],
    rfqs: [],
    rfq_items: [],
    rfq_vendors: [],
    quotations: [],
    quotation_items: [],
    approvals: [],
    purchase_orders: [],
    invoices: [],
    activity_log: [],
    contracts: [],
    budgets: [],
    permissions: [],
    role_permissions: [],
    user_permission_overrides: [],
    security_violations: [],
    approval_authority: [],
    temporary_access: []
  };

  seedDb(dbInstance);
  saveDb();
  return dbInstance!;
}

export function saveDb(): void {
  if (!dbInstance) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
}

function seedDb(db: DatabaseSchema) {
  console.log('Seeding database with live demo data...');

  // 1. Password Hashing
  const hashAdmin = bcryptjs.hashSync('admin123', 10);
  const hashOfficer = bcryptjs.hashSync('officer123', 10);
  const hashManager = bcryptjs.hashSync('manager123', 10);
  const hashSiliconv = bcryptjs.hashSync('silicon123', 10);
  const hashApexv = bcryptjs.hashSync('apex123', 10);

  // 2. Vendors Seed (5 records)
  db.vendors = [
    {
      id: 1,
      name: 'Silicon Systems Ltd',
      category: 'IT Hardware',
      contact_name: 'John Doe',
      email: 'silicon@vendorbridge.com',
      phone: '+1 555-0101',
      city: 'Tech City',
      gst_number: 'GSTIN12345IT',
      risk_level: 'Low',
      status: 'Active',
      rating: 4.8,
      on_time_pct: 98,
      created_at: '2026-01-10T10:00:00Z'
    },
    {
      id: 2,
      name: 'Paper & More Supplies',
      category: 'Office Supplies',
      contact_name: 'Jane Smith',
      email: 'paper@vendorbridge.com',
      phone: '+1 555-0102',
      city: 'Metro City',
      gst_number: 'GSTIN23456OS',
      risk_level: 'Low',
      status: 'Active',
      rating: 4.2,
      on_time_pct: 95,
      created_at: '2026-02-15T11:00:00Z'
    },
    {
      id: 3,
      name: 'Apex Logistics Corp',
      category: 'Logistics',
      contact_name: 'Robert Johnson',
      email: 'apex@vendorbridge.com',
      phone: '+1 555-0103',
      city: 'Port City',
      gst_number: 'GSTIN34567LG',
      risk_level: 'Medium',
      status: 'Active',
      rating: 4.5,
      on_time_pct: 92,
      created_at: '2026-03-20T09:30:00Z'
    },
    {
      id: 4,
      name: 'Micro Circuits Inc',
      category: 'Electronics',
      contact_name: 'Alice Brown',
      email: 'micro@vendorbridge.com',
      phone: '+1 555-0104',
      city: 'Silicon Valley',
      gst_number: 'GSTIN45678EL',
      risk_level: 'High',
      status: 'Active',
      rating: 3.9,
      on_time_pct: 88,
      created_at: '2026-04-05T14:15:00Z'
    },
    {
      id: 5,
      name: 'Global Forge Heavy Industries',
      category: 'Manufacturing',
      contact_name: 'David Wilson',
      email: 'forge@vendorbridge.com',
      phone: '+1 555-0105',
      city: 'Forge Town',
      gst_number: 'GSTIN56789MF',
      risk_level: 'Low',
      status: 'Active',
      rating: 4.7,
      on_time_pct: 96,
      created_at: '2026-05-18T16:45:00Z'
    }
  ];

  // 3. User Accounts Seed
  db.users = [
    {
      id: 1,
      name: 'Sarah Connor (Admin)',
      email: 'admin@vendorbridge.com',
      password: hashAdmin,
      role: 'admin',
      vendor_id: null,
      created_at: '2026-01-01T08:00:00Z'
    },
    {
      id: 2,
      name: 'Officer Bob (Procurement)',
      email: 'officer@vendorbridge.com',
      password: hashOfficer,
      role: 'procurement_officer',
      vendor_id: null,
      created_at: '2026-01-02T09:00:00Z'
    },
    {
      id: 3,
      name: 'Manager Alice',
      email: 'manager@vendorbridge.com',
      password: hashManager,
      role: 'manager',
      vendor_id: null,
      created_at: '2026-01-03T10:00:00Z'
    },
    {
      id: 4,
      name: 'Silicon Systems Account',
      email: 'silicon@vendorbridge.com',
      password: hashSiliconv,
      role: 'vendor',
      vendor_id: 1,
      created_at: '2026-01-11T10:30:00Z'
    },
    {
      id: 5,
      name: 'Apex Logistics Account',
      email: 'apex@vendorbridge.com',
      password: hashApexv,
      role: 'vendor',
      vendor_id: 3,
      created_at: '2026-03-21T10:00:00Z'
    }
  ];

  // 4. RFQs Seed (3 RFQs in different states)
  db.rfqs = [
    {
      id: 'RFQ-2026-001',
      title: 'Enterprise Developer Laptop Procurement',
      description: 'Sourcing 50 high-spec developer laptops for engineering department onboarding.',
      deadline: '2026-06-15',
      priority: 'High',
      status: 'Under Approval',
      created_by: 2,
      created_at: '2026-05-20T10:00:00Z'
    },
    {
      id: 'RFQ-2026-002',
      title: 'Bi-annual Corporate Office Stationery Supply',
      description: 'Regular recurring purchase of eco-friendly A4 reams, archiving folders, and pen supplies.',
      deadline: '2026-06-25',
      priority: 'Low',
      status: 'Quotations Received',
      created_by: 2,
      created_at: '2026-05-22T11:30:00Z'
    },
    {
      id: 'RFQ-2026-003',
      title: 'Heavy Parts Logistical Freight Service',
      description: 'Flatbed transport of forged factory conveyor components from Forge Town and delivery in Port City.',
      deadline: '2026-06-30',
      priority: 'Critical',
      status: 'Open',
      created_by: 2,
      created_at: '2026-05-25T14:00:00Z'
    }
  ];

  // RFQ Items
  db.rfq_items = [
    { id: 1, rfq_id: 'RFQ-2026-001', name: 'High-spec Developer Laptops (32GB RAM, 1TB SSD)', quantity: 50, unit: 'units' },
    { id: 2, rfq_id: 'RFQ-2026-002', name: 'A4 Copier Paper Reams (Recycled)', quantity: 500, unit: 'reams' },
    { id: 3, rfq_id: 'RFQ-2026-002', name: 'Premium Archiving Black Ring Files', quantity: 150, unit: 'units' },
    { id: 4, rfq_id: 'RFQ-2026-003', name: 'Heavy Conveyor Forged Rollers (Industrial Grade)', quantity: 2, unit: 'freight units' }
  ];

  // RFQ Vendor assignments
  db.rfq_vendors = [
    { rfq_id: 'RFQ-2026-001', vendor_id: 1 }, // Silicon Systems
    { rfq_id: 'RFQ-2026-001', vendor_id: 4 }, // Micro Circuits
    { rfq_id: 'RFQ-2026-002', vendor_id: 2 }, // Paper & More
    { rfq_id: 'RFQ-2026-002', vendor_id: 4 }, // Micro Circuits
    { rfq_id: 'RFQ-2026-003', vendor_id: 3 }, // Apex Logistics
    { rfq_id: 'RFQ-2026-003', vendor_id: 5 }  // Global Forge
  ];

  // 5. Quotations Seed (4 quotations)
  db.quotations = [
    {
      id: 1,
      rfq_id: 'RFQ-2026-001',
      vendor_id: 1,
      delivery_days: 7,
      notes: 'Laptops with customized configurations. Offer includes 3-year commercial warranty.',
      total_amount: 1450000,
      status: 'Submitted',
      submitted_at: '2026-05-24T09:12:00Z'
    },
    {
      id: 2,
      rfq_id: 'RFQ-2026-002',
      vendor_id: 2,
      delivery_days: 3,
      notes: 'Direct warehouse pricing. Immediate stock availability. Included complimentary pen boxes.',
      total_amount: 25000,
      status: 'Submitted',
      submitted_at: '2026-05-26T15:20:00Z'
    },
    {
      id: 3,
      rfq_id: 'RFQ-2026-002',
      vendor_id: 4,
      delivery_days: 10,
      notes: 'Eco-certified corporate stationery packs. Delay expected due to custom branding file folders.',
      total_amount: 29000,
      status: 'Submitted',
      submitted_at: '2026-05-28T10:45:00Z'
    },
    {
      id: 4,
      rfq_id: 'RFQ-2026-003',
      vendor_id: 3,
      delivery_days: 5,
      notes: 'Insured flatbed transit with GPS tracking. Fully vetted operators.',
      total_amount: 120000,
      status: 'Draft',
      submitted_at: '2026-05-29T16:00:00Z'
    }
  ];

  // Quotation items
  db.quotation_items = [
    { id: 1, quotation_id: 1, rfq_item_id: 1, unit_price: 29000, total_price: 1450000 },
    { id: 2, quotation_id: 2, rfq_item_id: 2, unit_price: 40, total_price: 20000 },
    { id: 3, quotation_id: 2, rfq_item_id: 3, unit_price: 33.33, total_price: 5000 },
    { id: 4, quotation_id: 3, rfq_item_id: 2, unit_price: 45, total_price: 22500 },
    { id: 5, quotation_id: 3, rfq_item_id: 3, unit_price: 43.33, total_price: 6500 },
    { id: 6, quotation_id: 4, rfq_item_id: 4, unit_price: 60000, total_price: 120000 }
  ];

  // 6. Approvals Seed (1 pending approval)
  db.approvals = [
    {
      id: 1,
      rfq_id: 'RFQ-2026-001',
      quotation_id: 1,
      requested_by: 2,
      approved_by: null,
      status: 'Pending',
      remarks: 'Silicon Systems bids with robust ratings and prompt on-time statistics. Highly recommended for selection.',
      requested_at: '2026-05-30T11:00:00Z',
      actioned_at: null
    }
  ];

  // 7. Activity Logs Seed (10 entries covering multiple entity types)
  db.activity_log = [
    { id: 1, user_id: 2, action: 'User authentication login completed', entity_type: 'vendor', entity_id: '2', details: 'Officer Bob logged in from 192.168.1.5', created_at: '2026-05-20T09:00:00Z' },
    { id: 2, user_id: 2, action: 'Created RFQ', entity_type: 'rfq', entity_id: 'RFQ-2026-001', details: 'Created Elite Laptop RFQ with target budget 1,500,000', created_at: '2026-05-20T10:15:00Z' },
    { id: 3, user_id: 2, action: 'Proposed Vendor Assignment', entity_type: 'vendor', entity_id: '1', details: 'Assigned Silicon Systems and Micro Circuits to RFQ-2026-001', created_at: '2026-05-20T10:20:00Z' },
    { id: 4, user_id: 4, action: 'Quotation Submitted', entity_type: 'quotation', entity_id: '1', details: 'Silicon Systems submitted quotation layout with value $1,450,000', created_at: '2026-05-24T09:12:00Z' },
    { id: 5, user_id: 2, action: 'Created RFQ', entity_type: 'rfq', entity_id: 'RFQ-2026-002', details: 'Created Corporate Stationery Supply RFQ', created_at: '2026-05-22T11:30:00Z' },
    { id: 6, user_id: 2, action: 'Proposed Vendor Assignment', entity_type: 'vendor', entity_id: '2', details: 'Assigned Paper & More to RFQ-2026-002', created_at: '2026-05-22T11:35:00Z' },
    { id: 7, user_id: 2, action: 'Created RFQ', entity_type: 'rfq', entity_id: 'RFQ-2026-003', details: 'Created Freight Service logistics RFQ', created_at: '2026-05-25T14:00:00Z' },
    { id: 8, user_id: 2, action: 'Requested Review Approval', entity_type: 'approval', entity_id: '1', details: 'Submitted approval requested for Silicon Systems quote on RFQ-2026-001', created_at: '2026-05-30T11:00:00Z' }
  ];

  // Additional 5-6 sample entries for requested tables
  db.vendors.push(
    { id: 6, name: 'Eco Packaging Solutions', category: 'Packaging', contact_name: 'Emma Watson', email: 'emma@ecopack.com', phone: '+1 555-0106', city: 'Green City', gst_number: 'GSTIN67890EP', risk_level: 'Low', status: 'Active', rating: 4.6, on_time_pct: 94, created_at: '2026-05-20T10:00:00Z' },
    { id: 7, name: 'NextGen Softworks', category: 'IT Software', contact_name: 'Paul Walker', email: 'p.walker@nextgen.com', phone: '+1 555-0107', city: 'Cyber City', gst_number: 'GSTIN007NG', risk_level: 'Medium', status: 'Active', rating: 4.3, on_time_pct: 90, created_at: '2026-05-21T09:00:00Z' },
    { id: 8, name: 'Secure Transit Authority', category: 'Logistics', contact_name: 'Rebecca Miles', email: 'rebecca@sta.com', phone: '+1 555-0108', city: 'Port City', gst_number: 'GSTIN008ST', risk_level: 'Low', status: 'Active', rating: 4.9, on_time_pct: 99, created_at: '2026-05-22T08:00:00Z' },
    { id: 9, name: 'IronClad Security', category: 'Services', contact_name: 'Tom Hardy', email: 'tom@ironclad.com', phone: '+1 555-0109', city: 'Metro City', gst_number: 'GSTIN009IC', risk_level: 'High', status: 'Active', rating: 3.5, on_time_pct: 85, created_at: '2026-05-23T11:00:00Z' },
    { id: 10, name: 'Office Ergonomics Plus', category: 'Office Supplies', contact_name: 'Sarah Connor', email: 's.connor@oep.com', phone: '+1 555-0110', city: 'Tech City', gst_number: 'GSTIN010OE', risk_level: 'Low', status: 'Active', rating: 4.5, on_time_pct: 93, created_at: '2026-05-24T12:00:00Z' },
    { id: 11, name: 'Bright Ideas Lighting', category: 'Electronics', contact_name: 'Luke Skywalker', email: 'luke@brightideas.com', phone: '+1 555-0111', city: 'Crystal City', gst_number: 'GSTIN011BI', risk_level: 'Low', status: 'Active', rating: 4.8, on_time_pct: 97, created_at: '2026-05-25T13:00:00Z' },
    { id: 12, name: 'Prime Resources', category: 'Manufacturing', contact_name: 'Diana Prince', email: 'diana@primeresources.com', phone: '+1 555-0112', city: 'Forge Town', gst_number: 'GSTIN012PR', risk_level: 'Medium', status: 'Active', rating: 4.0, on_time_pct: 89, created_at: '2026-05-26T14:00:00Z' },
    { id: 13, name: 'Oceanic Freight', category: 'Logistics', contact_name: 'Arthur Curry', email: 'arthur@oceanic.com', phone: '+1 555-0113', city: 'Port City', gst_number: 'GSTIN013OF', risk_level: 'Low', status: 'Active', rating: 4.7, on_time_pct: 95, created_at: '2026-05-27T15:00:00Z' },
    { id: 14, name: 'Green Space Landscaping', category: 'Services', contact_name: 'Pamela Isley', email: 'pamela@greenspace.com', phone: '+1 555-0114', city: 'Garden City', gst_number: 'GSTIN014GS', risk_level: 'Low', status: 'Active', rating: 4.4, on_time_pct: 92, created_at: '2026-05-28T16:00:00Z' },
    { id: 15, name: 'Delta Cybernetics', category: 'IT Hardware', contact_name: 'Victor Stone', email: 'victor@deltacyber.com', phone: '+1 555-0115', city: 'Silicon Valley', gst_number: 'GSTIN015DC', risk_level: 'High', status: 'Active', rating: 3.8, on_time_pct: 86, created_at: '2026-05-29T17:00:00Z' }
  );

  db.rfqs.push(
    { id: 'RFQ-2026-004', title: 'Q3 Packaging Material Supply', description: 'Sustainable packaging materials for Q3 product shipments', deadline: '2026-07-01', priority: 'Medium', status: 'Open', created_by: 2, created_at: '2026-06-01T09:00:00Z' },
    { id: 'RFQ-2026-005', title: 'Server Room Cooling Units', description: 'Upgraded HVAC units for main server room', deadline: '2026-06-20', priority: 'High', status: 'Quotations Received', created_by: 2, created_at: '2026-06-02T10:00:00Z' },
    { id: 'RFQ-2026-006', title: 'Employee Welcome Kits', description: 'Branded welcome kits for 100 new hires', deadline: '2026-07-15', priority: 'Low', status: 'Under Approval', created_by: 2, created_at: '2026-06-03T11:00:00Z' },
    { id: 'RFQ-2026-007', title: 'Office Furniture Upgrade', description: 'Ergonomic chairs and standing desks', deadline: '2026-07-10', priority: 'Medium', status: 'PO Generated', created_by: 2, created_at: '2026-06-04T12:00:00Z' },
    { id: 'RFQ-2026-008', title: 'Cloud Infrastructure Audit', description: 'External security and compliance audit', deadline: '2026-06-30', priority: 'Critical', status: 'Closed', created_by: 2, created_at: '2026-06-05T13:00:00Z' },
    { id: 'RFQ-2026-009', title: 'Marketing Agency Retainer', description: 'Annual retainer for digital marketing agency services', deadline: '2026-07-31', priority: 'Medium', status: 'Open', created_by: 2, created_at: '2026-06-06T09:00:00Z' },
    { id: 'RFQ-2026-010', title: 'Warehouse Racking System', description: 'Heavy duty steel racking for new warehouse facility', deadline: '2026-08-15', priority: 'High', status: 'Quotations Received', created_by: 2, created_at: '2026-06-06T10:00:00Z' },
    { id: 'RFQ-2026-011', title: 'Corporate Event Catering', description: 'Catering services for annual company gala', deadline: '2026-09-01', priority: 'Low', status: 'Open', created_by: 2, created_at: '2026-06-06T11:00:00Z' },
    { id: 'RFQ-2026-012', title: 'Cybersecurity Training Software', description: 'Enterprise license for employee security awareness platform', deadline: '2026-06-25', priority: 'Critical', status: 'Under Approval', created_by: 2, created_at: '2026-06-06T12:00:00Z' },
    { id: 'RFQ-2026-013', title: 'Fleet Vehicle Maintenance Service', description: 'Quarterly maintenance contract for company delivery vans', deadline: '2026-07-20', priority: 'Medium', status: 'PO Generated', created_by: 2, created_at: '2026-06-06T13:00:00Z' },
    { id: 'RFQ-2026-014', title: 'Renewable Energy Consultation', description: 'Assessment of solar panel installation feasibility', deadline: '2026-08-30', priority: 'Low', status: 'Open', created_by: 2, created_at: '2026-06-06T14:00:00Z' },
    { id: 'RFQ-2026-015', title: 'Customer Support Helpdesk AI', description: 'AI-driven ticketing and chatbot solution', deadline: '2026-07-05', priority: 'High', status: 'Closed', created_by: 2, created_at: '2026-06-06T15:00:00Z' }
  );

  db.rfq_items.push(
    { id: 5, rfq_id: 'RFQ-2026-004', name: 'Recycled Cardboard Boxes', quantity: 5000, unit: 'units' },
    { id: 6, rfq_id: 'RFQ-2026-005', name: 'HVAC Cooling Unit 5 Ton', quantity: 2, unit: 'units' },
    { id: 7, rfq_id: 'RFQ-2026-006', name: 'Welcome Kit (Mug, Notebook, Pen)', quantity: 100, unit: 'kits' },
    { id: 8, rfq_id: 'RFQ-2026-007', name: 'Ergonomic Office Chair', quantity: 30, unit: 'units' },
    { id: 9, rfq_id: 'RFQ-2026-008', name: 'Infrastructure Audit Service', quantity: 1, unit: 'service' },
    { id: 10, rfq_id: 'RFQ-2026-009', name: 'Digital Marketing Campaign Management', quantity: 12, unit: 'months' },
    { id: 11, rfq_id: 'RFQ-2026-010', name: 'Heavy Duty Steel Pallet Racks', quantity: 50, unit: 'units' },
    { id: 12, rfq_id: 'RFQ-2026-011', name: 'Gala Dinner Packages (3-course)', quantity: 250, unit: 'pax' },
    { id: 13, rfq_id: 'RFQ-2026-012', name: 'Cybersecurity Platform Enterprise License', quantity: 1, unit: 'license' },
    { id: 14, rfq_id: 'RFQ-2026-013', name: 'Van Maintenance Package (Oil, Filters, Brakes)', quantity: 20, unit: 'vehicles' },
    { id: 15, rfq_id: 'RFQ-2026-014', name: 'Solar Feasibility Study Report', quantity: 1, unit: 'report' },
    { id: 16, rfq_id: 'RFQ-2026-015', name: 'AI Helpdesk Integration Setup', quantity: 1, unit: 'setup' }
  );

  db.quotations.push(
    { id: 5, rfq_id: 'RFQ-2026-005', vendor_id: 1, delivery_days: 14, notes: 'Includes installation', total_amount: 15000, status: 'Submitted', submitted_at: '2026-06-03T09:00:00Z' },
    { id: 6, rfq_id: 'RFQ-2026-006', vendor_id: 2, delivery_days: 7, notes: 'Standard branding', total_amount: 5000, status: 'Selected', submitted_at: '2026-06-04T10:00:00Z' },
    { id: 7, rfq_id: 'RFQ-2026-007', vendor_id: 4, delivery_days: 21, notes: 'Premium chairs', total_amount: 12000, status: 'Selected', submitted_at: '2026-06-05T11:00:00Z' },
    { id: 8, rfq_id: 'RFQ-2026-008', vendor_id: 1, delivery_days: 30, notes: 'Comprehensive audit', total_amount: 25000, status: 'Selected', submitted_at: '2026-06-06T12:00:00Z' },
    { id: 9, rfq_id: 'RFQ-2026-004', vendor_id: 6, delivery_days: 10, notes: '100% recycled', total_amount: 7500, status: 'Draft', submitted_at: '2026-06-05T14:00:00Z' },
    { id: 10, rfq_id: 'RFQ-2026-010', vendor_id: 5, delivery_days: 45, notes: 'Includes safety certification and installation', total_amount: 45000, status: 'Submitted', submitted_at: '2026-06-06T10:30:00Z' },
    { id: 11, rfq_id: 'RFQ-2026-010', vendor_id: 12, delivery_days: 30, notes: 'Fast track delivery available', total_amount: 48000, status: 'Submitted', submitted_at: '2026-06-06T11:00:00Z' },
    { id: 12, rfq_id: 'RFQ-2026-012', vendor_id: 7, delivery_days: 1, notes: 'Instant activation upon PO creation', total_amount: 15000, status: 'Selected', submitted_at: '2026-06-06T13:00:00Z' },
    { id: 13, rfq_id: 'RFQ-2026-013', vendor_id: 3, delivery_days: 3, notes: 'On-site maintenance included', total_amount: 8000, status: 'Selected', submitted_at: '2026-06-06T14:00:00Z' },
    { id: 14, rfq_id: 'RFQ-2026-015', vendor_id: 7, delivery_days: 14, notes: 'Setup, training, and 1 year support', total_amount: 22000, status: 'Selected', submitted_at: '2026-06-06T15:30:00Z' },
    { id: 15, rfq_id: 'RFQ-2026-009', vendor_id: 9, delivery_days: 7, notes: 'Monthly reports included', total_amount: 60000, status: 'Submitted', submitted_at: '2026-06-06T16:00:00Z' }
  );

  db.quotation_items.push(
    { id: 7, quotation_id: 5, rfq_item_id: 6, unit_price: 7500, total_price: 15000 },
    { id: 8, quotation_id: 6, rfq_item_id: 7, unit_price: 50, total_price: 5000 },
    { id: 9, quotation_id: 7, rfq_item_id: 8, unit_price: 400, total_price: 12000 },
    { id: 10, quotation_id: 8, rfq_item_id: 9, unit_price: 25000, total_price: 25000 },
    { id: 11, quotation_id: 9, rfq_item_id: 5, unit_price: 1.5, total_price: 7500 },
    { id: 12, quotation_id: 10, rfq_item_id: 11, unit_price: 900, total_price: 45000 },
    { id: 13, quotation_id: 11, rfq_item_id: 11, unit_price: 960, total_price: 48000 },
    { id: 14, quotation_id: 12, rfq_item_id: 13, unit_price: 15000, total_price: 15000 },
    { id: 15, quotation_id: 13, rfq_item_id: 14, unit_price: 400, total_price: 8000 },
    { id: 16, quotation_id: 14, rfq_item_id: 16, unit_price: 22000, total_price: 22000 },
    { id: 17, quotation_id: 15, rfq_item_id: 10, unit_price: 5000, total_price: 60000 }
  );

  db.approvals.push(
    { id: 2, rfq_id: 'RFQ-2026-006', quotation_id: 6, requested_by: 2, approved_by: null, status: 'Pending', remarks: 'Good price for kits', requested_at: '2026-06-04T11:00:00Z', actioned_at: null },
    { id: 3, rfq_id: 'RFQ-2026-007', quotation_id: 7, requested_by: 2, approved_by: 3, status: 'Approved', remarks: 'Approved for ergonomic needs', requested_at: '2026-06-05T09:00:00Z', actioned_at: '2026-06-05T10:00:00Z' },
    { id: 4, rfq_id: 'RFQ-2026-008', quotation_id: 8, requested_by: 2, approved_by: 3, status: 'Approved', remarks: 'Required for compliance', requested_at: '2026-06-05T11:00:00Z', actioned_at: '2026-06-05T12:00:00Z' },
    { id: 5, rfq_id: 'RFQ-2026-005', quotation_id: 5, requested_by: 2, approved_by: 3, status: 'Rejected', remarks: 'Too expensive, find another vendor', requested_at: '2026-06-04T12:00:00Z', actioned_at: '2026-06-04T13:00:00Z' },
    { id: 6, rfq_id: 'RFQ-2026-004', quotation_id: 9, requested_by: 2, approved_by: null, status: 'Pending', remarks: 'Please review green packaging solution', requested_at: '2026-06-06T10:00:00Z', actioned_at: null },
    { id: 7, rfq_id: 'RFQ-2026-010', quotation_id: 10, requested_by: 2, approved_by: 3, status: 'Approved', remarks: 'Better safety rating for racks', requested_at: '2026-06-06T11:00:00Z', actioned_at: '2026-06-06T11:30:00Z' },
    { id: 8, rfq_id: 'RFQ-2026-012', quotation_id: 12, requested_by: 2, approved_by: 3, status: 'Approved', remarks: 'Critical for company security', requested_at: '2026-06-06T13:15:00Z', actioned_at: '2026-06-06T13:45:00Z' },
    { id: 9, rfq_id: 'RFQ-2026-013', quotation_id: 13, requested_by: 2, approved_by: null, status: 'Pending', remarks: 'Routine vehicle servicing request', requested_at: '2026-06-06T14:15:00Z', actioned_at: null },
    { id: 10, rfq_id: 'RFQ-2026-015', quotation_id: 14, requested_by: 2, approved_by: 1, status: 'Approved', remarks: 'Helpdesk SLA met, proceed', requested_at: '2026-06-06T15:45:00Z', actioned_at: '2026-06-06T16:15:00Z' },
    { id: 11, rfq_id: 'RFQ-2026-009', quotation_id: 15, requested_by: 2, approved_by: null, status: 'Pending', remarks: 'Marketing retainer, high cost', requested_at: '2026-06-06T16:30:00Z', actioned_at: null }
  );

  db.purchase_orders.push(
    { id: 'PO-2026-001', rfq_id: 'RFQ-2026-007', quotation_id: 7, vendor_id: 4, approval_id: 3, subtotal: 12000, gst_amount: 2160, total_amount: 14160, status: 'Invoiced', po_date: '2026-06-05T10:30:00Z', delivery_date: '2026-06-26' },
    { id: 'PO-2026-002', rfq_id: 'RFQ-2026-008', quotation_id: 8, vendor_id: 1, approval_id: 4, subtotal: 25000, gst_amount: 4500, total_amount: 29500, status: 'Invoiced', po_date: '2026-06-05T12:30:00Z', delivery_date: '2026-07-05' },
    { id: 'PO-2026-003', rfq_id: 'RFQ-2026-002', quotation_id: 2, vendor_id: 2, approval_id: 1, subtotal: 25000, gst_amount: 4500, total_amount: 29500, status: 'Completed', po_date: '2026-05-28T10:30:00Z', delivery_date: '2026-06-02' },
    { id: 'PO-2026-004', rfq_id: 'RFQ-2026-001', quotation_id: 1, vendor_id: 1, approval_id: 1, subtotal: 1450000, gst_amount: 261000, total_amount: 1711000, status: 'Active', po_date: '2026-06-01T10:30:00Z', delivery_date: '2026-06-08' },
    { id: 'PO-2026-005', rfq_id: 'RFQ-2026-006', quotation_id: 6, vendor_id: 2, approval_id: 2, subtotal: 5000, gst_amount: 900, total_amount: 5900, status: 'Active', po_date: '2026-06-06T09:30:00Z', delivery_date: '2026-06-13' },
    { id: 'PO-2026-006', rfq_id: 'RFQ-2026-004', quotation_id: 9, vendor_id: 6, approval_id: 6, subtotal: 7500, gst_amount: 1350, total_amount: 8850, status: 'Invoiced', po_date: '2026-06-06T11:00:00Z', delivery_date: '2026-06-20' },
    { id: 'PO-2026-007', rfq_id: 'RFQ-2026-010', quotation_id: 10, vendor_id: 5, approval_id: 7, subtotal: 45000, gst_amount: 8100, total_amount: 53100, status: 'Active', po_date: '2026-06-06T12:00:00Z', delivery_date: '2026-07-21' },
    { id: 'PO-2026-008', rfq_id: 'RFQ-2026-012', quotation_id: 12, vendor_id: 7, approval_id: 8, subtotal: 15000, gst_amount: 2700, total_amount: 17700, status: 'Invoiced', po_date: '2026-06-06T14:00:00Z', delivery_date: '2026-06-07' },
    { id: 'PO-2026-009', rfq_id: 'RFQ-2026-015', quotation_id: 14, vendor_id: 7, approval_id: 10, subtotal: 22000, gst_amount: 3960, total_amount: 25960, status: 'Invoiced', po_date: '2026-06-06T16:30:00Z', delivery_date: '2026-06-20' }
  );

  db.invoices.push(
    { id: 'INV-2026-001', po_id: 'PO-2026-001', vendor_id: 4, subtotal: 12000, gst_amount: 2160, total_amount: 14160, status: 'Generated', generated_at: '2026-06-06T08:00:00Z' },
    { id: 'INV-2026-002', po_id: 'PO-2026-002', vendor_id: 1, subtotal: 25000, gst_amount: 4500, total_amount: 29500, status: 'Sent', generated_at: '2026-06-06T09:00:00Z' },
    { id: 'INV-2026-003', po_id: 'PO-2026-003', vendor_id: 2, subtotal: 25000, gst_amount: 4500, total_amount: 29500, status: 'Paid', generated_at: '2026-06-02T10:00:00Z' },
    { id: 'INV-2026-004', po_id: 'PO-2026-001', vendor_id: 4, subtotal: 6000, gst_amount: 1080, total_amount: 7080, status: 'Paid', generated_at: '2026-05-15T08:00:00Z' },
    { id: 'INV-2026-005', po_id: 'PO-2026-002', vendor_id: 1, subtotal: 12500, gst_amount: 2250, total_amount: 14750, status: 'Sent', generated_at: '2026-05-20T08:00:00Z' },
    { id: 'INV-2026-006', po_id: 'PO-2026-006', vendor_id: 6, subtotal: 7500, gst_amount: 1350, total_amount: 8850, status: 'Generated', generated_at: '2026-06-06T12:00:00Z' },
    { id: 'INV-2026-007', po_id: 'PO-2026-008', vendor_id: 7, subtotal: 15000, gst_amount: 2700, total_amount: 17700, status: 'Sent', generated_at: '2026-06-06T14:30:00Z' },
    { id: 'INV-2026-008', po_id: 'PO-2026-009', vendor_id: 7, subtotal: 22000, gst_amount: 3960, total_amount: 25960, status: 'Generated', generated_at: '2026-06-06T17:00:00Z' },
    { id: 'INV-2026-009', po_id: 'PO-2026-007', vendor_id: 5, subtotal: 22500, gst_amount: 4050, total_amount: 26550, status: 'Paid', generated_at: '2026-06-06T12:30:00Z' }
  );

  // 8. Seeding Budgets and Contracts
  db.budgets = [
    { id: 1, department: 'Engineering', fiscal_year: 2026, quarter: 2, allocated: 500000, utilized: 350000, created_by: 1, updated_at: '2026-05-01T10:00:00Z' },
    { id: 2, department: 'Operations', fiscal_year: 2026, quarter: 2, allocated: 200000, utilized: 190000, created_by: 1, updated_at: '2026-05-01T10:00:00Z' },
    { id: 3, department: 'Marketing', fiscal_year: 2026, quarter: 2, allocated: 150000, utilized: 50000, created_by: 1, updated_at: '2026-05-01T10:00:00Z' }
  ];
  db.contracts = [
    { id: 'CON-2026-001', vendor_id: 1, title: 'Annual Hardware Supply', description: 'Main hardware vendor', start_date: '2026-01-01', expiry_date: '2026-12-31', value: 2000000, status: 'Active', created_by: 1, created_at: '2026-01-01T10:00:00Z' }
  ];

  // RBAC Seeds
  db.approval_authority.push(
    { id: 1, user_id: 3, level: 3, max_amount: 5000000, is_active: 1, granted_by: 1, granted_at: '2026-01-01T00:00:00Z' },
    { id: 2, user_id: 4, level: 2, max_amount: 1000000, is_active: 1, granted_by: 1, granted_at: '2026-01-01T00:00:00Z' }
  );

  const PERMISSIONS = [
    { code: "vendor.view_all", label: "View All Vendors", category: "vendors" },
    { code: "vendor.view_own", label: "View Own Profile", category: "vendors" },
    { code: "vendor.create", label: "Register Vendor", category: "vendors" },
    { code: "vendor.edit_own", label: "Edit Own Profile", category: "vendors" },
    { code: "vendor.edit_any", label: "Edit Any Vendor", category: "vendors" },
    { code: "vendor.change_status", label: "Change Vendor Status", category: "vendors" },
    { code: "vendor.change_risk", label: "Change Risk Level", category: "vendors" },
    { code: "vendor.blacklist", label: "Blacklist Vendor", category: "vendors" },
    { code: "vendor.onboard", label: "Approve Vendor Onboarding", category: "vendors" },
    { code: "vendor.upload_docs", label: "Upload Own Documents", category: "vendors" },
    { code: "vendor.verify_docs", label: "Verify Vendor Documents", category: "vendors" },
    { code: "vendor.rate", label: "Rate Vendor Post-PO", category: "vendors" },
    { code: "rfq.view_all", label: "View All RFQs", category: "rfq" },
    { code: "rfq.view_assigned", label: "View Assigned RFQs", category: "rfq" },
    { code: "rfq.create", label: "Create RFQ", category: "rfq" },
    { code: "rfq.edit_own", label: "Edit Own RFQ", category: "rfq" },
    { code: "rfq.edit_any", label: "Edit Any RFQ", category: "rfq" },
    { code: "rfq.cancel", label: "Cancel RFQ", category: "rfq" },
    { code: "rfq.assign_vendors", label: "Assign Vendors to RFQ", category: "rfq" },
    { code: "rfq.save_template", label: "Save RFQ as Template", category: "rfq" },
    { code: "rfq.kanban_override", label: "Kanban Status Override", category: "rfq" },
    { code: "quote.view_all", label: "View All Quotations", category: "quotations" },
    { code: "quote.submit", label: "Submit Quotation", category: "quotations" },
    { code: "quote.edit_own", label: "Edit Own Quotation", category: "quotations" },
    { code: "quote.counter_offer", label: "Submit Counter-Offer", category: "quotations" },
    { code: "quote.view_competitor", label: "View Competitor Pricing", category: "quotations" },
    { code: "quote.compare", label: "Compare Quotations", category: "quotations" },
    { code: "quote.select_winner", label: "Select Winning Quotation", category: "quotations" },
    { code: "quote.view_own_history", label: "View Own Bid History", category: "quotations" },
    { code: "approval.view_all", label: "View All Approvals", category: "approvals" },
    { code: "approval.request", label: "Request Approval", category: "approvals" },
    { code: "approval.approve_l1", label: "Approve L1 (<=1L)", category: "approvals" },
    { code: "approval.approve_l2", label: "Approve L2 (1L-10L)", category: "approvals" },
    { code: "approval.approve_l3", label: "Approve L3 (>10L)", category: "approvals" },
    { code: "approval.override", label: "Override Any Approval", category: "approvals" },
    { code: "approval.delegate", label: "Delegate Approval Authority", category: "approvals" },
    { code: "po.view_all", label: "View All POs", category: "purchase_orders" },
    { code: "po.view_own", label: "View Own Vendor POs", category: "purchase_orders" },
    { code: "po.generate", label: "Generate PO", category: "purchase_orders" },
    { code: "po.cancel", label: "Cancel PO", category: "purchase_orders" },
    { code: "invoice.view_all", label: "View All Invoices", category: "invoices" },
    { code: "invoice.view_own", label: "View Own Invoices", category: "invoices" },
    { code: "invoice.generate", label: "Generate Invoice", category: "invoices" },
    { code: "invoice.download_pdf", label: "Download Invoice PDF", category: "invoices" },
    { code: "invoice.send_email", label: "Send Invoice via Email", category: "invoices" },
    { code: "invoice.mark_paid", label: "Mark Invoice Paid", category: "invoices" },
    { code: "contract.view_all", label: "View All Contracts", category: "contracts" },
    { code: "contract.view_own", label: "View Own Contracts", category: "contracts" },
    { code: "contract.create", label: "Create Contract", category: "contracts" },
    { code: "contract.renew", label: "Renew / Terminate Contract", category: "contracts" },
    { code: "budget.view", label: "View Budgets", category: "budgets" },
    { code: "budget.manage", label: "Create/Edit Budgets", category: "budgets" },
    { code: "budget.override_breach", label: "Override Budget Breach", category: "budgets" },
    { code: "report.full", label: "View Full Analytics", category: "reports" },
    { code: "report.export", label: "Export Reports", category: "reports" },
    { code: "report.own", label: "View Own Analytics", category: "reports" },
    { code: "message.send_internal", label: "Send Internal Messages", category: "messages" },
    { code: "message.send_external", label: "Send Vendor-Visible Msgs", category: "messages" },
    { code: "message.reply_own", label: "Reply on Own RFQ Thread", category: "messages" },
    { code: "admin.users", label: "User Management", category: "admin" },
    { code: "admin.settings", label: "System Settings", category: "admin" },
    { code: "admin.audit", label: "View Full Audit Trail", category: "admin" },
    { code: "admin.permissions", label: "Edit Permission Matrix", category: "admin" },
    { code: "admin.impersonate", label: "Impersonate User", category: "admin" },
    { code: "admin.temp_access", label: "Grant Temporary Access", category: "admin" },
    { code: "admin.security_log", label: "View Security Violations", category: "admin" }
  ];
  db.permissions = PERMISSIONS.map((p, idx) => ({ id: idx + 1, ...p, is_active: 1 }));

  const managerPerms = [
    ["vendor.view_all", "read"], ["vendor.change_risk", "full"], ["rfq.view_all", "read"],
    ["quote.view_all", "read"], ["quote.view_competitor", "full"], ["quote.compare", "full"],
    ["approval.view_all", "full"], ["approval.approve_l1", "full"], ["approval.approve_l2", "full"],
    ["approval.approve_l3", "full"], ["approval.delegate", "full"], ["po.view_all", "read"],
    ["invoice.view_all", "read"], ["invoice.download_pdf", "full"], ["contract.view_all", "read"],
    ["budget.view", "full"], ["budget.override_breach", "full"], ["report.full", "full"],
    ["report.export", "full"], ["message.send_internal", "full"]
  ];
  const officerPerms = [
    ["vendor.view_all", "read"], ["vendor.create", "full"], ["vendor.rate", "full"],
    ["rfq.view_all", "full"], ["rfq.create", "full"], ["rfq.edit_own", "full"], ["rfq.cancel", "own"],
    ["rfq.assign_vendors", "full"], ["rfq.save_template", "full"], ["quote.view_all", "full"],
    ["quote.view_competitor", "full"], ["quote.compare", "full"], ["quote.select_winner", "full"],
    ["approval.view_all", "read"], ["approval.request", "full"], ["po.view_all", "full"],
    ["po.generate", "full"], ["invoice.view_all", "full"], ["invoice.generate", "full"],
    ["invoice.download_pdf", "full"], ["invoice.send_email", "full"], ["invoice.mark_paid", "full"],
    ["contract.view_all", "read"], ["contract.create", "full"], ["contract.renew", "full"],
    ["budget.view", "read"], ["report.full", "read"], ["report.export", "full"],
    ["message.send_internal", "full"], ["message.send_external", "full"]
  ];
  const vendorPerms = [
    ["vendor.view_own", "own"], ["vendor.edit_own", "own"], ["vendor.upload_docs", "own"],
    ["rfq.view_assigned", "own"], ["quote.submit", "own"], ["quote.edit_own", "own"],
    ["quote.counter_offer", "own"], ["quote.view_own_history", "own"], ["po.view_own", "own"],
    ["invoice.view_own", "own"], ["invoice.download_pdf", "own"], ["contract.view_own", "own"],
    ["report.own", "own"], ["message.reply_own", "own"]
  ];

  PERMISSIONS.forEach(p => {
    db.role_permissions.push({ role: 'admin', permission: p.code, access_type: 'full' });
  });
  managerPerms.forEach(p => db.role_permissions.push({ role: 'manager', permission: p[0], access_type: p[1] as string }));
  officerPerms.forEach(p => db.role_permissions.push({ role: 'procurement_officer', permission: p[0], access_type: p[1] as string }));
  vendorPerms.forEach(p => db.role_permissions.push({ role: 'vendor', permission: p[0], access_type: p[1] as string }));
}
