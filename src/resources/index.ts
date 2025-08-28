import { ClinikoClient } from '../cliniko-client.js';

export function registerResources(server: any, client: ClinikoClient) {
  // Patient resources
  server.resource('patient://{id}', {
    description: 'Individual patient data',
    mimeType: 'application/json',
  }, async ({ id }: { id: string }) => {
    try {
      const patient = await client.getPatient(parseInt(id));
      return {
        contents: [{
          uri: `patient://${id}`,
          mimeType: 'application/json',
          text: JSON.stringify(patient, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  server.resource('patients://list', {
    description: 'List of all patients',
    mimeType: 'application/json',
  }, async () => {
    try {
      const response = await client.listPatients({ per_page: 100 });
      return {
        contents: [{
          uri: 'patients://list',
          mimeType: 'application/json',
          text: JSON.stringify({
            patients: response.patients || [],
            total_entries: response.total_entries,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch patients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Appointment resources
  server.resource('appointment://{id}', {
    description: 'Individual appointment data',
    mimeType: 'application/json',
  }, async ({ id }: { id: string }) => {
    try {
      const appointment = await client.getAppointment(parseInt(id));
      return {
        contents: [{
          uri: `appointment://${id}`,
          mimeType: 'application/json',
          text: JSON.stringify(appointment, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  server.resource('appointments://list', {
    description: 'List of appointments',
    mimeType: 'application/json',
  }, async () => {
    try {
      const response = await client.listAppointments({ per_page: 100 });
      return {
        contents: [{
          uri: 'appointments://list',
          mimeType: 'application/json',
          text: JSON.stringify({
            appointments: response.appointments || [],
            total_entries: response.total_entries,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  server.resource('appointments://today', {
    description: "Today's appointments",
    mimeType: 'application/json',
  }, async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await client.listAppointments({
        starts_at: today.toISOString(),
        ends_at: tomorrow.toISOString(),
        per_page: 100
      });

      return {
        contents: [{
          uri: 'appointments://today',
          mimeType: 'application/json',
          text: JSON.stringify({
            date: today.toISOString().split('T')[0],
            appointments: response.appointments || [],
            total_entries: response.total_entries,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch today's appointments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Practitioner resources
  server.resource('practitioners://list', {
    description: 'List of all practitioners',
    mimeType: 'application/json',
  }, async () => {
    try {
      const response = await client.listPractitioners({ per_page: 100 });
      return {
        contents: [{
          uri: 'practitioners://list',
          mimeType: 'application/json',
          text: JSON.stringify({
            practitioners: response.practitioners || [],
            total_entries: response.total_entries,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch practitioners: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Business resources
  server.resource('businesses://list', {
    description: 'List of all businesses',
    mimeType: 'application/json',
  }, async () => {
    try {
      const response = await client.listBusinesses();
      return {
        contents: [{
          uri: 'businesses://list',
          mimeType: 'application/json',
          text: JSON.stringify({
            businesses: response.businesses || [],
            total_entries: response.total_entries
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch businesses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Appointment types resource
  server.resource('appointment-types://list', {
    description: 'List of all appointment types',
    mimeType: 'application/json',
  }, async () => {
    try {
      const response = await client.listAppointmentTypes({ per_page: 100 });
      return {
        contents: [{
          uri: 'appointment-types://list',
          mimeType: 'application/json',
          text: JSON.stringify({
            appointment_types: response.appointment_types || [],
            total_entries: response.total_entries,
            has_more: !!response.links.next
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to fetch appointment types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}