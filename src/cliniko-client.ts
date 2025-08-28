import { Patient, Appointment, Practitioner, Business, AppointmentType, AvailableTime, ClinikoListResponse, Invoice, InvoiceItem, Payment, Product, Tax, PatientCase } from './types.js';

export class ClinikoClient {
  private baseUrl = 'https://api.au1.cliniko.com/v1';
  private headers: HeadersInit;

  constructor(apiKey: string) {
    this.headers = {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Cliniko/1.0'
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cliniko API error (${response.status}): ${error}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Patient methods
  async listPatients(params?: { page?: number; per_page?: number; q?: string }): Promise<ClinikoListResponse<Patient>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.q) searchParams.append('q', params.q);
    
    return this.request<ClinikoListResponse<Patient>>(`/patients${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getPatient(id: number): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`);
  }

  async createPatient(patient: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(id: number, patient: Partial<Patient>): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  async deletePatient(id: number): Promise<void> {
    return this.request<void>(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment methods
  async listAppointments(params?: { 
    page?: number; 
    per_page?: number; 
    patient_id?: number;
    practitioner_id?: number;
    business_id?: number;
    starts_at?: string;
    ends_at?: string;
    status?: string;
  }): Promise<ClinikoListResponse<Appointment>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.patient_id) searchParams.append('patient_id', params.patient_id.toString());
    if (params?.practitioner_id) searchParams.append('practitioner_id', params.practitioner_id.toString());
    if (params?.business_id) searchParams.append('business_id', params.business_id.toString());
    if (params?.starts_at) searchParams.append('starts_at', params.starts_at);
    if (params?.ends_at) searchParams.append('ends_at', params.ends_at);
    if (params?.status) searchParams.append('status', params.status);
    
    return this.request<ClinikoListResponse<Appointment>>(`/appointments${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getAppointment(id: number): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`);
  }

  async createAppointment(appointment: {
    starts_at: string;
    patient_id?: number;
    practitioner_id: number;
    appointment_type_id: number;
    business_id: number;
    notes?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointment),
    });
  }

  async cancelAppointment(id: number, reason?: string): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ cancellation_reason: reason }),
    });
  }

  async deleteAppointment(id: number): Promise<void> {
    return this.request<void>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Practitioner methods
  async listPractitioners(params?: { page?: number; per_page?: number }): Promise<ClinikoListResponse<Practitioner>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    
    return this.request<ClinikoListResponse<Practitioner>>(`/practitioners${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getPractitioner(id: number): Promise<Practitioner> {
    return this.request<Practitioner>(`/practitioners/${id}`);
  }

  // Business methods
  async listBusinesses(): Promise<ClinikoListResponse<Business>> {
    return this.request<ClinikoListResponse<Business>>('/businesses');
  }

  async getBusiness(id: number): Promise<Business> {
    return this.request<Business>(`/businesses/${id}`);
  }

  // Appointment Type methods
  async listAppointmentTypes(params?: { page?: number; per_page?: number }): Promise<ClinikoListResponse<AppointmentType>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    
    return this.request<ClinikoListResponse<AppointmentType>>(`/appointment_types${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getAppointmentType(id: number): Promise<AppointmentType> {
    return this.request<AppointmentType>(`/appointment_types/${id}`);
  }

  // Available times
  async getAvailableTimes(params: {
    business_id: number;
    practitioner_id: number;
    from: string;
    to: string;
  }): Promise<AvailableTime[]> {
    const searchParams = new URLSearchParams({
      business_id: params.business_id.toString(),
      practitioner_id: params.practitioner_id.toString(),
      from: params.from,
      to: params.to,
    });
    
    const response = await this.request<{ available_times: AvailableTime[] }>(`/available_times?${searchParams.toString()}`);
    return response.available_times;
  }

  // Invoice methods
  async listInvoices(params?: {
    page?: number;
    per_page?: number;
    patient_id?: number;
    practitioner_id?: number;
    issued_at_from?: string;
    issued_at_to?: string;
    status?: string;
  }): Promise<ClinikoListResponse<Invoice>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.patient_id) searchParams.append('q[patient_id]', params.patient_id.toString());
    if (params?.practitioner_id) searchParams.append('q[practitioner_id]', params.practitioner_id.toString());
    if (params?.issued_at_from) searchParams.append('q[issued_at][gte]', params.issued_at_from);
    if (params?.issued_at_to) searchParams.append('q[issued_at][lte]', params.issued_at_to);
    if (params?.status) searchParams.append('q[status]', params.status);
    
    return this.request<ClinikoListResponse<Invoice>>(`/invoices${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async createInvoice(invoice: {
    patient_id: number;
    practitioner_id: number;
    issue_date: string;  // Changed from issued_at to issue_date
    status?: string;
    notes?: string;
    payment_terms?: number;
    appointment_ids?: number[];
    invoice_items?: Array<{
      description: string;
      unit_price: number;
      quantity: number;
      discount_percentage?: number;
      tax_id?: number;
      product_id?: number;
    }>;
  }): Promise<Invoice> {
    // Map issue_date field properly and ensure date format
    const invoiceData = { ...invoice };
    if (invoice.issue_date && invoice.issue_date.includes('T')) {
      // Convert ISO datetime to YYYY-MM-DD format
      invoiceData.issue_date = invoice.issue_date.split('T')[0];
    }
    return this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(id: number, invoice: {
    status?: string;
    notes?: string;
    payment_terms?: number;
  }): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    });
  }

  async deleteInvoice(id: number): Promise<void> {
    return this.request<void>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Invoice Item methods
  async listInvoiceItems(invoiceId: number): Promise<ClinikoListResponse<InvoiceItem>> {
    return this.request<ClinikoListResponse<InvoiceItem>>(`/invoices/${invoiceId}/invoice_items`);
  }

  async addInvoiceItem(invoiceId: number, item: {
    description: string;
    unit_price: number;
    quantity?: number;
    discount_percentage?: number;
    tax_id?: number;
    product_id?: number;
  }): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/invoices/${invoiceId}/invoice_items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateInvoiceItem(invoiceId: number, itemId: number, item: {
    description?: string;
    unit_price?: number;
    quantity?: number;
    discount_percentage?: number;
  }): Promise<InvoiceItem> {
    return this.request<InvoiceItem>(`/invoices/${invoiceId}/invoice_items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteInvoiceItem(invoiceId: number, itemId: number): Promise<void> {
    return this.request<void>(`/invoices/${invoiceId}/invoice_items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Payment methods
  async listPayments(params?: {
    page?: number;
    per_page?: number;
    invoice_id?: number;
    patient_id?: number;
    created_at_from?: string;
    created_at_to?: string;
  }): Promise<ClinikoListResponse<Payment>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.invoice_id) searchParams.append('q[invoice_id]', params.invoice_id.toString());
    if (params?.patient_id) searchParams.append('q[patient_id]', params.patient_id.toString());
    if (params?.created_at_from) searchParams.append('q[created_at][gte]', params.created_at_from);
    if (params?.created_at_to) searchParams.append('q[created_at][lte]', params.created_at_to);
    
    return this.request<ClinikoListResponse<Payment>>(`/payments${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getPayment(id: number): Promise<Payment> {
    return this.request<Payment>(`/payments/${id}`);
  }

  async createPayment(payment: {
    invoice_id: number;
    amount: number;
    paid_at: string;
    payment_method?: string;
    reference?: string;
  }): Promise<Payment> {
    return this.request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(id: number): Promise<void> {
    return this.request<void>(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  async listProducts(params?: {
    page?: number;
    per_page?: number;
  }): Promise<ClinikoListResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    
    return this.request<ClinikoListResponse<Product>>(`/products${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  async createProduct(product: {
    name: string;
    item_code: string;
    unit_price: number;
    description?: string;
    tax_id?: number;
  }): Promise<Product> {
    // Map unit_price to price for API compatibility
    const { unit_price, ...rest } = product;
    const apiProduct = {
      ...rest,
      price: unit_price
    };
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(apiProduct),
    });
  }

  async updateProduct(id: number, product: {
    name?: string;
    item_code?: string;
    unit_price?: number;
    description?: string;
    tax_id?: number;
  }): Promise<Product> {
    // Map unit_price to price for API compatibility
    const { unit_price, ...rest } = product;
    const apiProduct = unit_price !== undefined ? {
      ...rest,
      price: unit_price
    } : rest;
    return this.request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiProduct),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Tax methods
  async listTaxes(): Promise<ClinikoListResponse<Tax>> {
    return this.request<ClinikoListResponse<Tax>>('/taxes');
  }

  async getTax(id: number): Promise<Tax> {
    return this.request<Tax>(`/taxes/${id}`);
  }

  // Patient Case methods
  async listPatientCases(patientId: number): Promise<ClinikoListResponse<PatientCase>> {
    return this.request<ClinikoListResponse<PatientCase>>(`/patients/${patientId}/cases`);
  }

  async getPatientCase(id: number): Promise<PatientCase> {
    return this.request<PatientCase>(`/cases/${id}`);
  }

  async getCaseInvoices(caseId: number): Promise<ClinikoListResponse<Invoice>> {
    return this.request<ClinikoListResponse<Invoice>>(`/cases/${caseId}/invoices`);
  }
}