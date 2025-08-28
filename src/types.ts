export interface Patient {
  id: number;
  title?: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth?: string;
  sex?: 'Male' | 'Female' | 'Other';
  email?: string;
  phone_numbers?: Array<{
    number: string;
    type: string;
  }>;
  address?: {
    line_1?: string;
    line_2?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
  medicare_number?: string;
  medicare_reference_number?: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  links?: {
    self: string;
    appointments?: string;
  };
}

export interface Appointment {
  id: number;
  starts_at: string;
  ends_at: string;
  duration: number;
  appointment_type: {
    id: number;
    name: string;
    category?: string;
    color?: string;
    duration: number;
  };
  patient?: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  practitioner: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  business: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  status: 'Active' | 'Cancelled' | 'Did not arrive';
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
    patient?: string;
    practitioner: string;
    appointment_type: string;
  };
}

export interface Practitioner {
  id: number;
  title?: string;
  first_name: string;
  last_name: string;
  designation?: string;
  user?: {
    id: number;
    email: string;
  };
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
  };
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  country: string;
  time_zone: string;
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
  };
}

export interface AppointmentType {
  id: number;
  name: string;
  duration: number;
  color?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
  };
}

export interface AvailableTime {
  appointment_type_id: number;
  business_id: number;
  practitioner_id: number;
  starts_at: string;
}

export interface ClinikoListResponse<T> {
  [key: string]: T[] | number | any;
  total_entries: number;
  links: {
    self: string;
    next?: string;
  };
}

export interface Invoice {
  id: number;
  invoice_number?: string;
  issued_at: string;
  due_at?: string;
  status: 'draft' | 'awaiting_payment' | 'part_paid' | 'paid' | 'void' | 'write_off';
  total: number;
  tax_total: number;
  subtotal: number;
  amount_paid: number;
  amount_outstanding: number;
  notes?: string;
  payment_terms?: number;
  patient: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  practitioner: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  business: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  invoice_items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
    patient: string;
    practitioner: string;
    invoice_items?: string;
    payments?: string;
  };
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  total_amount: number;
  product?: {
    id: number;
    name: string;
  };
  tax?: {
    id: number;
    name: string;
    rate: number;
  };
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
    invoice: string;
  };
}

export interface Payment {
  id: number;
  amount: number;
  paid_at: string;
  payment_method: 'cash' | 'credit_card' | 'eft' | 'cheque' | 'other';
  reference?: string;
  invoice: {
    id: number;
    invoice_number: string;
    links: {
      self: string;
    };
  };
  patient: {
    id: number;
    name: string;
    links: {
      self: string;
    };
  };
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
    invoice: string;
    patient: string;
  };
}

export interface Product {
  id: number;
  name: string;
  item_code: string;
  unit_price: number;
  description?: string;
  tax?: {
    id: number;
    name: string;
    rate: number;
  };
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
  };
}

export interface Tax {
  id: number;
  name: string;
  rate: number;
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
  };
}

export interface PatientCase {
  id: number;
  name: string;
  patient_id: number;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  links?: {
    self: string;
    patient: string;
    invoices?: string;
  };
}