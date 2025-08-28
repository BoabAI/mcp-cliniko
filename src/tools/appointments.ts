import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

const AppointmentSearchSchema = z.object({
  patient_id: z.number().optional().describe('Filter by patient ID'),
  practitioner_id: z.number().optional().describe('Filter by practitioner ID'),
  business_id: z.number().optional().describe('Filter by business ID'),
  starts_at: z.string().optional().describe('Filter appointments starting from (ISO 8601)'),
  ends_at: z.string().optional().describe('Filter appointments ending before (ISO 8601)'),
  status: z.string().optional().describe('Filter by status (Active, Cancelled, Did not arrive)'),
  page: z.number().optional().describe('Page number'),
  per_page: z.number().optional().describe('Results per page (max 100)'),
});

const AppointmentCreateSchema = z.object({
  starts_at: z.string().describe('Appointment start time (ISO 8601)'),
  patient_id: z.number().optional().describe('Patient ID (optional for walk-ins)'),
  practitioner_id: z.number().describe('Practitioner ID'),
  appointment_type_id: z.number().describe('Appointment type ID'),
  business_id: z.number().describe('Business ID'),
  notes: z.string().optional().describe('Appointment notes'),
});

const AvailableTimesSchema = z.object({
  business_id: z.number().describe('Business ID'),
  practitioner_id: z.number().describe('Practitioner ID'),
  from: z.string().describe('Start date for availability check (YYYY-MM-DD)'),
  to: z.string().describe('End date for availability check (YYYY-MM-DD)'),
});

export function registerAppointmentTools(server: any, client: ClinikoClient) {
  // List/Search appointments
  server.tool('list_appointments', {
    description: 'List or search for appointments',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Filter by patient ID' },
        practitioner_id: { type: 'number', description: 'Filter by practitioner ID' },
        business_id: { type: 'number', description: 'Filter by business ID' },
        starts_at: { type: 'string', description: 'Filter appointments starting from (ISO 8601)' },
        ends_at: { type: 'string', description: 'Filter appointments ending before (ISO 8601)' },
        status: { type: 'string', description: 'Filter by status (Active, Cancelled, Did not arrive)' },
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' }
      }
    },
  }, async (params: z.infer<typeof AppointmentSearchSchema>) => {
    try {
      const response = await client.listAppointments(params);
      const appointments = response.appointments || [];
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            appointments,
            total_entries: response.total_entries,
            page: params.page || 1,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get appointment by ID
  server.tool('get_appointment', {
    description: 'Get a specific appointment by ID',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'number', description: 'Appointment ID' }
      },
      required: ['appointment_id']
    },
  }, async ({ appointment_id }: { appointment_id: number }) => {
    try {
      const appointment = await client.getAppointment(appointment_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appointment, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Create appointment
  server.tool('create_appointment', {
    description: 'Create a new appointment',
    inputSchema: {
      type: 'object',
      properties: {
        starts_at: { type: 'string', description: 'Appointment start time (ISO 8601)' },
        patient_id: { type: 'number', description: 'Patient ID (optional for walk-ins)' },
        practitioner_id: { type: 'number', description: 'Practitioner ID' },
        appointment_type_id: { type: 'number', description: 'Appointment type ID' },
        business_id: { type: 'number', description: 'Business ID' },
        notes: { type: 'string', description: 'Appointment notes' }
      },
      required: ['starts_at', 'practitioner_id', 'appointment_type_id', 'business_id']
    },
  }, async (input: z.infer<typeof AppointmentCreateSchema>) => {
    try {
      const appointment = await client.createAppointment(input);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appointment, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Update appointment
  server.tool('update_appointment', {
    description: 'Update an existing appointment',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'number', description: 'Appointment ID' },
        starts_at: { type: 'string', description: 'New start time (ISO 8601)' },
        notes: { type: 'string', description: 'Updated notes' },
        patient_id: { type: 'number', description: 'New patient ID' }
      },
      required: ['appointment_id']
    },
  }, async ({ appointment_id, ...updateData }: any) => {
    try {
      const appointment = await client.updateAppointment(appointment_id, updateData);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appointment, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to update appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Cancel appointment
  server.tool('cancel_appointment', {
    description: 'Cancel an appointment',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'number', description: 'Appointment ID' },
        cancellation_reason: { type: 'string', description: 'Reason for cancellation' }
      },
      required: ['appointment_id']
    },
  }, async ({ appointment_id, cancellation_reason }: { appointment_id: number; cancellation_reason?: string }) => {
    try {
      const appointment = await client.cancelAppointment(appointment_id, cancellation_reason);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(appointment, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Delete appointment
  server.tool('delete_appointment', {
    description: 'Delete an appointment completely',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'number', description: 'Appointment ID' }
      },
      required: ['appointment_id']
    },
  }, async ({ appointment_id }: { appointment_id: number }) => {
    try {
      await client.deleteAppointment(appointment_id);
      return {
        content: [{
          type: 'text',
          text: `Appointment ${appointment_id} has been deleted successfully`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to delete appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Get available times
  server.tool('get_available_times', {
    description: 'Get available appointment times for a practitioner',
    inputSchema: {
      type: 'object',
      properties: {
        business_id: { type: 'number', description: 'Business ID' },
        practitioner_id: { type: 'number', description: 'Practitioner ID' },
        from: { type: 'string', description: 'Start date for availability check (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date for availability check (YYYY-MM-DD)' }
      },
      required: ['business_id', 'practitioner_id', 'from', 'to']
    },
  }, async (params: z.infer<typeof AvailableTimesSchema>) => {
    try {
      const availableTimes = await client.getAvailableTimes(params);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            available_times: availableTimes,
            total: availableTimes.length,
            ...params
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get available times: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // List practitioners (helper for appointments)
  server.tool('list_practitioners', {
    description: 'List all practitioners',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page' }
      }
    },
  }, async ({ page, per_page }: { page?: number; per_page?: number }) => {
    try {
      const response = await client.listPractitioners({ page, per_page });
      const practitioners = response.practitioners || [];
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            practitioners,
            total_entries: response.total_entries,
            page: page || 1,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list practitioners: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // List appointment types (helper for appointments)
  server.tool('list_appointment_types', {
    description: 'List all appointment types',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page' }
      }
    },
  }, async ({ page, per_page }: { page?: number; per_page?: number }) => {
    try {
      const response = await client.listAppointmentTypes({ page, per_page });
      const appointmentTypes = response.appointment_types || [];
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            appointment_types: appointmentTypes,
            total_entries: response.total_entries,
            page: page || 1,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list appointment types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // List businesses (helper for appointments)
  server.tool('list_businesses', {
    description: 'List all businesses',
    inputSchema: {
      type: 'object',
      properties: {}
    },
  }, async () => {
    try {
      const response = await client.listBusinesses();
      const businesses = response.businesses || [];
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            businesses,
            total_entries: response.total_entries,
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to list businesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}