import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

// Australian test data
const firstNames = ['James', 'Emma', 'Oliver', 'Charlotte', 'William', 'Olivia', 'Jack', 'Amelia', 'Noah', 'Mia', 
                    'Thomas', 'Isla', 'Lucas', 'Grace', 'Henry', 'Sophia', 'Alexander', 'Chloe', 'Oscar', 'Ava'];
const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson',
                   'Thompson', 'Nguyen', 'Thomas', 'Walker', 'Harris', 'Lee', 'Ryan', 'Robinson', 'Kelly', 'King'];
const suburbs = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Geelong'];
const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const streetNames = ['George', 'King', 'Queen', 'Elizabeth', 'Collins', 'Bourke', 'Swanston', 'Pitt', 'Market', 'Park'];
const streetTypes = ['Street', 'Road', 'Avenue', 'Drive', 'Place', 'Court', 'Parade', 'Crescent', 'Lane', 'Way'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateMedicareNumber(): string {
  // Medicare numbers are 10 digits
  const num = Math.floor(Math.random() * 9000000000) + 1000000000;
  return num.toString();
}

function generatePhoneNumber(): string {
  // Australian mobile format: 04XX XXX XXX
  const num = Math.floor(Math.random() * 90000000) + 10000000;
  return `04${num}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com.au', 'bigpond.com', 'optusnet.com.au'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomElement(domains)}`;
}

function generateDateOfBirth(): string {
  const year = 1950 + Math.floor(Math.random() * 60);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function generateAddress() {
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const streetName = randomElement(streetNames);
  const streetType = randomElement(streetTypes);
  const suburb = randomElement(suburbs);
  const state = randomElement(states);
  const postcode = Math.floor(Math.random() * 9000) + 1000;
  
  return {
    line_1: `${streetNumber} ${streetName} ${streetType}`,
    suburb,
    state,
    postcode: postcode.toString(),
    country: 'Australia'
  };
}

const SyntheticDataSchema = z.object({
  num_patients: z.number().min(1).max(50).default(10).describe('Number of patients to create (max 50)'),
  num_appointments: z.number().min(0).max(100).default(20).describe('Number of appointments to create (max 100)'),
  days_ahead: z.number().min(1).max(30).default(7).describe('Days ahead to schedule appointments'),
});

export function registerSyntheticDataTools(server: any, client: ClinikoClient) {
  server.tool('generate_test_data', {
    description: 'Generate synthetic test data for Cliniko (Australian healthcare data)',
    inputSchema: {
      type: 'object',
      properties: {
        num_patients: { type: 'number', minimum: 1, maximum: 50, default: 10, description: 'Number of patients to create (max 50)' },
        num_appointments: { type: 'number', minimum: 0, maximum: 100, default: 20, description: 'Number of appointments to create (max 100)' },
        days_ahead: { type: 'number', minimum: 1, maximum: 30, default: 7, description: 'Days ahead to schedule appointments' }
      }
    },
  }, async ({ num_patients = 10, num_appointments = 20, days_ahead = 7 }: z.infer<typeof SyntheticDataSchema>) => {
    try {
      const results = {
        patients_created: [] as any[],
        appointments_created: [] as any[],
        errors: [] as string[],
      };

      // Get practitioners and appointment types first
      let practitioners: any[] = [];
      let appointmentTypes: any[] = [];
      let businesses: any[] = [];

      try {
        const practResponse = await client.listPractitioners({ per_page: 10 });
        practitioners = practResponse.practitioners || [];
        
        const apptTypeResponse = await client.listAppointmentTypes({ per_page: 10 });
        appointmentTypes = apptTypeResponse.appointment_types || [];
        
        const businessResponse = await client.listBusinesses();
        businesses = businessResponse.businesses || [];
      } catch (error) {
        results.errors.push(`Failed to fetch required data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }

      if (practitioners.length === 0 || appointmentTypes.length === 0 || businesses.length === 0) {
        results.errors.push('No practitioners, appointment types, or businesses found. Please set up these in Cliniko first.');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }

      // Create patients
      for (let i = 0; i < num_patients; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const address = generateAddress();
        
        const patientData = {
          first_name: firstName,
          last_name: lastName,
          title: randomElement(['Mr', 'Ms', 'Mrs', 'Dr', '']),
          date_of_birth: generateDateOfBirth(),
          sex: randomElement(['Male', 'Female', 'Other'] as const),
          email: generateEmail(firstName, lastName),
          phone_numbers: [{
            number: generatePhoneNumber(),
            type: 'Mobile'
          }],
          address,
          medicare_number: generateMedicareNumber(),
          medicare_reference_number: (Math.floor(Math.random() * 9) + 1).toString()
        };

        try {
          const patient = await client.createPatient(patientData);
          results.patients_created.push({
            id: patient.id,
            name: `${firstName} ${lastName}`,
            email: patientData.email
          });
        } catch (error) {
          results.errors.push(`Failed to create patient ${firstName} ${lastName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Create appointments
      if (num_appointments > 0 && results.patients_created.length > 0) {
        const now = new Date();
        
        for (let i = 0; i < num_appointments; i++) {
          const patient = randomElement(results.patients_created);
          const practitioner = randomElement(practitioners);
          const appointmentType = randomElement(appointmentTypes);
          const business = randomElement(businesses);
          
          // Generate random appointment time in the next X days
          const daysOffset = Math.floor(Math.random() * days_ahead) + 1;
          const hoursOffset = 9 + Math.floor(Math.random() * 8); // 9am to 5pm
          const minutesOffset = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
          
          const appointmentDate = new Date(now);
          appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
          appointmentDate.setHours(hoursOffset, minutesOffset, 0, 0);
          
          // Skip weekends
          if (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) {
            continue;
          }
          
          const appointmentData = {
            starts_at: appointmentDate.toISOString(),
            patient_id: patient.id,
            practitioner_id: practitioner.id,
            appointment_type_id: appointmentType.id,
            business_id: business.id,
            notes: `Test appointment for ${patient.name}`
          };

          try {
            const appointment = await client.createAppointment(appointmentData);
            results.appointments_created.push({
              id: appointment.id,
              patient: patient.name,
              practitioner: practitioner.first_name + ' ' + practitioner.last_name,
              starts_at: appointment.starts_at,
              type: appointmentType.name
            });
          } catch (error: any) {
            // Appointment slot might be taken, skip silently
            if (!error?.message?.includes('not available')) {
              results.errors.push(`Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: {
              patients_created: results.patients_created.length,
              appointments_created: results.appointments_created.length,
              errors: results.errors.length
            },
            ...results
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to generate test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  server.tool('cleanup_test_data', {
    description: 'Delete all test patients (patients with emails ending in @gmail.com, @outlook.com, etc)',
    inputSchema: {
      type: 'object',
      properties: {}
    },
  }, async () => {
    try {
      const results = {
        patients_deleted: [] as any[],
        errors: [] as string[],
      };

      // Search for test patients
      const testDomains = ['gmail.com', 'outlook.com', 'yahoo.com.au', 'bigpond.com', 'optusnet.com.au'];
      let allPatients: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) { // Limit to 10 pages for safety
        const response = await client.listPatients({ page, per_page: 100 });
        const patients = response.patients || [];
        allPatients = allPatients.concat(patients);
        hasMore = !!response.links.next;
        page++;
      }

      // Filter test patients
      const testPatients = allPatients.filter(p => {
        if (!p.email) return false;
        return testDomains.some(domain => p.email.endsWith(domain));
      });

      // Delete test patients
      for (const patient of testPatients) {
        try {
          await client.deletePatient(patient.id);
          results.patients_deleted.push({
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            email: patient.email
          });
        } catch (error) {
          results.errors.push(`Failed to delete patient ${patient.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: {
              patients_deleted: results.patients_deleted.length,
              errors: results.errors.length
            },
            ...results
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to cleanup test data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}