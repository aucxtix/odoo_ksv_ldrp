/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'procurement_officer' | 'manager' | 'vendor';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // bcrypt hash, hidden in front-end
  role: UserRole;
  vendor_id?: number | null;
  created_at?: string;
  permissions?: { code: string; access: string }[];
}

export interface Vendor {
  id: number;
  name: string;
  category: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  gst_number: string;
  risk_level: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Inactive' | 'Blacklisted';
  rating: number;
  on_time_pct: number;
  created_at?: string;
}

export interface VendorRating {
  id: number;
  vendor_id: number;
  user_id: number;
  rating: number; // 1 to 5
  notes?: string;
  created_at?: string;
}

export interface RFQ {
  id: string; // RFQ-YYYY-NNN
  title: string;
  description: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Quotations Received' | 'Under Approval' | 'PO Generated' | 'Closed';
  created_by: number;
  created_at?: string;
  items?: RFQItem[];
  vendor_ids?: number[];
  vendors?: Vendor[]; // populated in views
}

export interface RFQItem {
  id: number;
  rfq_id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface RFQVendor {
  rfq_id: string;
  vendor_id: number;
}

export interface Quotation {
  id: number;
  rfq_id: string;
  vendor_id: number;
  delivery_days: number;
  notes: string;
  total_amount: number;
  status: 'Draft' | 'Submitted' | 'Selected' | 'Rejected';
  submitted_at?: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  rfq_item_id: number;
  unit_price: number;
  total_price: number;
  name?: string; // transient for view joins
  quantity?: number;
  unit?: string;
}

export interface Approval {
  id: number;
  rfq_id: string;
  quotation_id: number;
  requested_by: number;
  approved_by?: number | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string | null;
  requested_at?: string;
  actioned_at?: string | null;
}

export interface PurchaseOrder {
  id: string; // PO-YYYY-NNN
  rfq_id: string;
  quotation_id: number;
  vendor_id: number;
  approval_id: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: 'Active' | 'Invoiced' | 'Completed';
  po_date?: string;
  delivery_date: string;
}

export interface Invoice {
  id: string; // INV-YYYY-NNN
  po_id: string;
  vendor_id: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: 'Generated' | 'Sent' | 'Paid';
  generated_at?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number | null;
  user_name?: string; // transient for UI display
  action: string;
  entity_type: 'rfq' | 'vendor' | 'quotation' | 'approval' | 'po' | 'invoice' | 'contract' | 'budget';
  entity_id: string;
  details?: string;
  created_at?: string;
}

export interface Contract {
  id: string; // CON-YYYY-NNN
  vendor_id: number;
  title: string;
  description: string;
  start_date: string;
  expiry_date: string;
  value: number;
  status: 'Active' | 'Expired' | 'Renewed' | 'Terminated';
  created_by: number;
  created_at: string;
}

export interface Budget {
  id: number;
  department: string;
  fiscal_year: number;
  quarter: 1 | 2 | 3 | 4;
  allocated: number;
  utilized: number;
  created_by: number;
  updated_at: string;
}
