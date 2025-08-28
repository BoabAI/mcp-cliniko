import { Patient, Appointment, Practitioner, Business, AppointmentType, AvailableTime, ClinikoListResponse } from './types.js';

export class ClinikoClient {
  private baseUrl = 'https://api.au4.cliniko.com/v1';
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
}