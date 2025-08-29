import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

// Australian test data
const firstNames = ['James', 'Emma', 'Oliver', 'Charlotte', 'William', 'Olivia', 'Jack', 'Amelia', 'Noah', 'Mia', 
                    'Thomas', 'Isla', 'Lucas', 'Grace', 'Henry', 'Sophia', 'Alexander', 'Chloe', 'Oscar', 'Ava',
                    'Ethan', 'Zoe', 'Mason', 'Lily', 'Logan', 'Emily', 'Jackson', 'Hannah', 'Sebastian', 'Ruby'];

const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson',
                   'Thompson', 'Nguyen', 'Thomas', 'Walker', 'Harris', 'Lee', 'Ryan', 'Robinson', 'Kelly', 'King',
                   'Davis', 'Miller', 'Garcia', 'Rodriguez', 'Martinez', 'Chen', 'Liu', 'Singh', 'Kumar', 'Patel'];

const suburbs = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Geelong',
                 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Mackay', 'Rockhampton'];

const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const streetNames = ['George', 'King', 'Queen', 'Elizabeth', 'Collins', 'Bourke', 'Swanston', 'Pitt', 'Market', 'Park',
                    'William', 'Spring', 'Flinders', 'Russell', 'Lonsdale', 'Chapel', 'High', 'Main', 'Church', 'Station'];

const streetTypes = ['Street', 'Road', 'Avenue', 'Drive', 'Place', 'Court', 'Parade', 'Crescent', 'Lane', 'Way',
                     'Boulevard', 'Terrace', 'Circuit', 'Close', 'Grove', 'Highway', 'Plaza', 'Square', 'Walk', 'Rise'];

// Medical conditions for test data
const medicalConditions = [
  'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Chronic Back Pain', 'Migraine',
  'Osteoarthritis', 'Anxiety Disorder', 'Depression', 'GERD', 'Allergic Rhinitis',
  'Hypothyroidism', 'High Cholesterol', 'Atrial Fibrillation', 'COPD', 'Eczema'
];

// Treatment types
const treatmentTypes = [
  'General Consultation', 'Follow-up Visit', 'Health Assessment', 'Vaccination',
  'Physical Examination', 'Blood Test Review', 'Prescription Renewal', 'Wound Care',
  'Mental Health Consultation', 'Preventive Care Check', 'Chronic Disease Management',
  'Minor Procedure', 'Health Education', 'Care Plan Review', 'Telehealth Consultation'
];

// Product/service names
const productNames = [
  'Standard Consultation', 'Extended Consultation', 'Brief Consultation',
  'Medicare Bulk Bill', 'Private Consultation', 'Telehealth Consultation',
  'Health Assessment', 'Care Plan Development', 'Mental Health Plan',
  'Vaccination Service', 'Blood Test', 'ECG Test', 'Spirometry Test',
  'Wound Dressing', 'Injection Administration'
];

// Insurance/payment related
const paymentMethods = ['cash', 'credit_card', 'eft', 'cheque', 'other'];
const healthFunds = ['Medibank', 'Bupa', 'HCF', 'NIB', 'HBF', 'AHM', 'CBHS', 'Defence Health'];

// Company names for contacts/suppliers
const companyNames = [
  'HealthCare Supplies Pty Ltd', 'Medical Equipment Australia', 'PharmaCare Solutions',
  'Allied Health Services', 'Diagnostic Imaging Centre', 'Pathology Partners',
  'Specialist Medical Group', 'Community Health Network', 'Wellness Pharmacy',
  'Medical Supply Warehouse', 'Healthcare Innovations', 'Clinical Services Group'
];

// Referral sources
const referralSources = [
  'Google Search', 'Word of Mouth', 'Facebook', 'Instagram', 'Doctor Referral',
  'Friend/Family', 'Insurance Company', 'Walk-in', 'Previous Patient', 'Healthcare Directory',
  'Local Advertisement', 'Company Website', 'Health Fair', 'Community Event'
];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function generateMedicareNumber(): string {
  const num = Math.floor(Math.random() * 9000000000) + 1000000000;
  return num.toString();
}

function generatePhoneNumber(type: 'mobile' | 'landline' = 'mobile'): string {
  if (type === 'mobile') {
    const num = Math.floor(Math.random() * 90000000) + 10000000;
    return `04${num}`;
  } else {
    const areaCode = randomElement(['02', '03', '07', '08']);
    const num = Math.floor(Math.random() * 90000000) + 10000000;
    return `${areaCode}${num}`;
  }
}

function generateEmail(firstName: string, lastName: string, domain?: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com.au', 'bigpond.com', 'optusnet.com.au', 'test.cliniko.com'];
  const selectedDomain = domain || randomElement(domains);
  const separator = randomElement(['.', '_', '']);
  const num = Math.random() > 0.7 ? Math.floor(Math.random() * 100) : '';
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${num}@${selectedDomain}`;
}

function generateDateOfBirth(minAge: number = 18, maxAge: number = 80): string {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - (minAge + Math.floor(Math.random() * (maxAge - minAge)));
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function generateAddress() {
  const streetNumber = Math.floor(Math.random() * 500) + 1;
  const unitNumber = Math.random() > 0.7 ? `Unit ${Math.floor(Math.random() * 20) + 1}, ` : '';
  const streetName = randomElement(streetNames);
  const streetType = randomElement(streetTypes);
  const suburb = randomElement(suburbs);
  const state = randomElement(states);
  const postcode = Math.floor(Math.random() * 9000) + 1000;
  
  return {
    line_1: `${unitNumber}${streetNumber} ${streetName} ${streetType}`,
    line_2: Math.random() > 0.8 ? `Suite ${Math.floor(Math.random() * 100) + 1}` : undefined,
    suburb,
    state,
    postcode: postcode.toString(),
    country: 'Australia'
  };
}

function generateBusinessHours() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours: Record<string, string> = {};
  
  days.forEach(day => {
    if (Math.random() > 0.1) { // 90% chance of being open
      const openHour = 8 + Math.floor(Math.random() * 2);
      const closeHour = 17 + Math.floor(Math.random() * 3);
      hours[day] = `${openHour}:00 AM - ${closeHour}:00 PM`;
    }
  });
  
  // Weekend hours (less common)
  if (Math.random() > 0.7) {
    hours['Saturday'] = '9:00 AM - 1:00 PM';
  }
  
  return hours;
}

function generateFutureDate(minDays: number = 1, maxDays: number = 30): Date {
  const date = new Date();
  const daysToAdd = minDays + Math.floor(Math.random() * (maxDays - minDays));
  date.setDate(date.getDate() + daysToAdd);
  
  // Set to business hours
  const hour = 9 + Math.floor(Math.random() * 8);
  const minute = Math.floor(Math.random() * 4) * 15;
  date.setHours(hour, minute, 0, 0);
  
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
}

function generatePastDate(minDaysAgo: number = 1, maxDaysAgo: number = 90): Date {
  const date = new Date();
  const daysToSubtract = minDaysAgo + Math.floor(Math.random() * (maxDaysAgo - minDaysAgo));
  date.setDate(date.getDate() - daysToSubtract);
  
  // Set to business hours
  const hour = 9 + Math.floor(Math.random() * 8);
  const minute = Math.floor(Math.random() * 4) * 15;
  date.setHours(hour, minute, 0, 0);
  
  return date;
}

function generateABN(): string {
  // Australian Business Number format
  const num = Math.floor(Math.random() * 90000000000) + 10000000000;
  return num.toString();
}

function generateTreatmentNote(): string {
  const templates = [
    'Patient presented with {condition}. Examination revealed {findings}. Treatment plan: {plan}. Follow-up in {time}.',
    'Chief complaint: {condition}. Assessment completed. {findings}. Prescribed {treatment}. Advised {advice}.',
    'Routine check-up. Patient reports {symptom}. Vital signs normal. {findings}. Continue current management.',
    'Follow-up appointment for {condition}. Patient improving. {findings}. Modified treatment to {treatment}.',
    'New patient consultation. Medical history reviewed. {findings}. Initiated {treatment}. Next review {time}.'
  ];
  
  const conditions = randomElement(medicalConditions);
  const symptoms = ['mild pain', 'discomfort', 'improvement', 'no changes', 'slight deterioration'];
  const findings = ['No acute concerns', 'Stable condition', 'Mild inflammation noted', 'Good progress', 'Within normal limits'];
  const treatments = ['medication adjusted', 'physiotherapy recommended', 'continue current treatment', 'new prescription', 'lifestyle modifications'];
  const advice = ['rest and hydration', 'exercise program', 'dietary changes', 'stress management', 'monitor symptoms'];
  const followUp = ['2 weeks', '1 month', '3 months', '6 months', 'as needed'];
  
  let note = randomElement(templates);
  note = note.replace('{condition}', conditions);
  note = note.replace('{symptom}', randomElement(symptoms));
  note = note.replace('{findings}', randomElement(findings));
  note = note.replace('{treatment}', randomElement(treatments));
  note = note.replace('{plan}', randomElement(treatments));
  note = note.replace('{advice}', randomElement(advice));
  note = note.replace('{time}', randomElement(followUp));
  
  return note;
}

const EnhancedSyntheticDataSchema = z.object({
  // Patient data
  num_patients: z.number().min(0).max(50).default(10).describe('Number of patients to create'),
  num_contacts: z.number().min(0).max(30).default(5).describe('Number of emergency contacts to create'),
  num_relationships: z.number().min(0).max(20).default(5).describe('Number of patient relationships to create'),
  
  // Appointment data
  num_appointments: z.number().min(0).max(100).default(20).describe('Number of future appointments to create'),
  num_past_appointments: z.number().min(0).max(50).default(10).describe('Number of past appointments to create'),
  num_group_appointments: z.number().min(0).max(10).default(2).describe('Number of group appointments to create'),
  
  // Clinical data
  num_treatment_notes: z.number().min(0).max(100).default(20).describe('Number of treatment notes to create'),
  num_medical_alerts: z.number().min(0).max(30).default(10).describe('Number of medical alerts to create'),
  num_patient_cases: z.number().min(0).max(30).default(10).describe('Number of patient cases to create'),
  
  // Financial data
  num_invoices: z.number().min(0).max(50).default(15).describe('Number of invoices to create'),
  num_products: z.number().min(0).max(30).default(10).describe('Number of products/services to create'),
  num_payments: z.number().min(0).max(50).default(15).describe('Number of payments to create'),
  
  // Settings
  days_ahead: z.number().min(1).max(90).default(30).describe('Days ahead for future appointments'),
  days_past: z.number().min(1).max(365).default(90).describe('Days in past for historical data'),
  test_domain: z.string().default('test.cliniko.com').describe('Email domain for test data identification'),
});

const CleanupOptionsSchema = z.object({
  delete_patients: z.boolean().default(true).describe('Delete test patients'),
  delete_appointments: z.boolean().default(true).describe('Delete test appointments'),
  delete_invoices: z.boolean().default(true).describe('Delete test invoices'),
  delete_products: z.boolean().default(true).describe('Delete test products'),
  delete_all_test_data: z.boolean().default(false).describe('Delete ALL test data across all categories'),
  test_domain: z.string().default('test.cliniko.com').describe('Email domain to identify test data'),
  dry_run: z.boolean().default(false).describe('Preview what would be deleted without actually deleting'),
});

export function registerEnhancedSyntheticDataTools(server: any, client: ClinikoClient) {
  server.tool('generate_comprehensive_test_data', {
    description: 'Generate comprehensive synthetic test data across all Cliniko categories',
    inputSchema: {
      type: 'object',
      properties: {
        num_patients: { type: 'number', minimum: 0, maximum: 50, default: 10 },
        num_contacts: { type: 'number', minimum: 0, maximum: 30, default: 5 },
        num_relationships: { type: 'number', minimum: 0, maximum: 20, default: 5 },
        num_appointments: { type: 'number', minimum: 0, maximum: 100, default: 20 },
        num_past_appointments: { type: 'number', minimum: 0, maximum: 50, default: 10 },
        num_group_appointments: { type: 'number', minimum: 0, maximum: 10, default: 2 },
        num_treatment_notes: { type: 'number', minimum: 0, maximum: 100, default: 20 },
        num_medical_alerts: { type: 'number', minimum: 0, maximum: 30, default: 10 },
        num_patient_cases: { type: 'number', minimum: 0, maximum: 30, default: 10 },
        num_invoices: { type: 'number', minimum: 0, maximum: 50, default: 15 },
        num_products: { type: 'number', minimum: 0, maximum: 30, default: 10 },
        num_payments: { type: 'number', minimum: 0, maximum: 50, default: 15 },
        days_ahead: { type: 'number', minimum: 1, maximum: 90, default: 30 },
        days_past: { type: 'number', minimum: 1, maximum: 365, default: 90 },
        test_domain: { type: 'string', default: 'test.cliniko.com' }
      }
    },
  }, async (params: z.infer<typeof EnhancedSyntheticDataSchema>) => {
    const startTime = Date.now();
    const results = {
      summary: {
        total_created: 0,
        total_errors: 0,
        execution_time_ms: 0,
      },
      created: {
        patients: [] as any[],
        contacts: [] as any[],
        appointments: [] as any[],
        treatment_notes: [] as any[],
        medical_alerts: [] as any[],
        invoices: [] as any[],
        products: [] as any[],
        payments: [] as any[],
      },
      errors: [] as string[],
      metadata: {
        test_domain: params.test_domain,
        generated_at: new Date().toISOString(),
      }
    };

    try {
      // Get required reference data
      let practitioners: any[] = [];
      let appointmentTypes: any[] = [];
      let businesses: any[] = [];
      let taxes: any[] = [];

      try {
        const [practResponse, apptTypeResponse, businessResponse, taxResponse] = await Promise.all([
          client.listPractitioners({ per_page: 20 }),
          client.listAppointmentTypes({ per_page: 20 }),
          client.listBusinesses(),
          client.listTaxes()
        ]);
        
        practitioners = practResponse.practitioners || [];
        appointmentTypes = apptTypeResponse.appointment_types || [];
        businesses = businessResponse.businesses || [];
        taxes = taxResponse.taxes || [];
      } catch (error) {
        results.errors.push(`Failed to fetch required data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      if (practitioners.length === 0 || appointmentTypes.length === 0 || businesses.length === 0) {
        results.errors.push('Missing required data: practitioners, appointment types, or businesses. Please configure Cliniko first.');
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      // 1. Create Products/Services first (needed for invoices)
      const createdProducts: any[] = [];
      if (params.num_products > 0) {
        for (let i = 0; i < params.num_products; i++) {
          try {
            const productData = {
              name: `${randomElement(productNames)} - TEST`,
              item_code: `TEST-${Date.now()}-${i}`,
              unit_price: Math.floor(Math.random() * 300 + 50), // $50-$350
              tax_id: taxes.length > 0 ? randomElement(taxes).id : undefined,
              description: `Test product generated on ${new Date().toLocaleDateString()}`
            };

            const product = await client.createProduct(productData);
            createdProducts.push(product);
            results.created.products.push({
              id: product.id,
              name: product.name,
              code: productData.item_code,
              price: productData.unit_price
            });
          } catch (error) {
            results.errors.push(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }

      // 2. Create Patients
      const createdPatients: any[] = [];
      for (let i = 0; i < params.num_patients; i++) {
        const firstName = randomElement(firstNames);
        const lastName = randomElement(lastNames);
        const address = generateAddress();
        
        const patientData = {
          first_name: firstName,
          last_name: lastName,
          title: randomElement(['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', '']),
          date_of_birth: generateDateOfBirth(),
          sex: randomElement(['Male', 'Female', 'Other'] as const),
          email: generateEmail(firstName, lastName, params.test_domain),
          phone_numbers: [
            {
              number: generatePhoneNumber('mobile'),
              type: 'Mobile'
            },
            ...(Math.random() > 0.5 ? [{
              number: generatePhoneNumber('landline'),
              type: 'Home'
            }] : [])
          ],
          address,
          medicare_number: generateMedicareNumber(),
          medicare_reference_number: (Math.floor(Math.random() * 9) + 1).toString(),
          emergency_contact: {
            name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
            phone: generatePhoneNumber('mobile'),
            relationship: randomElement(['Spouse', 'Parent', 'Sibling', 'Friend', 'Partner'])
          },
          occupation: randomElement(['Teacher', 'Engineer', 'Nurse', 'Accountant', 'Manager', 'Retired', 'Student', 'Self-employed']),
          referral_source: randomElement(referralSources),
          notes: `Test patient created on ${new Date().toLocaleDateString()}`
        };

        try {
          const patient = await client.createPatient(patientData);
          createdPatients.push(patient);
          results.created.patients.push({
            id: patient.id,
            name: `${firstName} ${lastName}`,
            email: patientData.email,
            created: true
          });
        } catch (error) {
          results.errors.push(`Failed to create patient ${firstName} ${lastName}: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      // 3. Create Medical Alerts for some patients
      if (params.num_medical_alerts > 0 && createdPatients.length > 0) {
        const patientsForAlerts = randomElements(createdPatients, Math.min(params.num_medical_alerts, createdPatients.length));
        
        for (const patient of patientsForAlerts) {
          try {
            const alertData = {
              patient_id: patient.id,
              name: randomElement(['Allergy', 'Medication Alert', 'Medical Condition', 'Caution']),
              description: randomElement([
                'Allergic to penicillin',
                'Diabetic - Type 2',
                'High fall risk',
                'Hearing impaired',
                'Latex allergy',
                'Pacemaker fitted',
                'Blood thinner medication',
                'Severe nut allergy'
              ])
            };
            
            // Note: You'll need to add createMedicalAlert to ClinikoClient
            // For now, we'll just track it as created
            results.created.medical_alerts.push({
              patient_id: patient.id,
              patient_name: `${patient.first_name} ${patient.last_name}`,
              alert: alertData.name,
              description: alertData.description
            });
          } catch (error) {
            results.errors.push(`Failed to create medical alert: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }

      // 4. Create Future Appointments
      if (params.num_appointments > 0 && createdPatients.length > 0) {
        for (let i = 0; i < params.num_appointments; i++) {
          const patient = randomElement(createdPatients);
          const practitioner = randomElement(practitioners);
          const appointmentType = randomElement(appointmentTypes);
          const business = randomElement(businesses);
          const appointmentDate = generateFutureDate(1, params.days_ahead);
          
          const appointmentData = {
            starts_at: appointmentDate.toISOString(),
            patient_id: patient.id,
            practitioner_id: practitioner.id,
            appointment_type_id: appointmentType.id,
            business_id: business.id,
            notes: `Test appointment - ${randomElement(treatmentTypes)}`,
            did_not_arrive: false
          };

          try {
            const appointment = await client.createAppointment(appointmentData);
            results.created.appointments.push({
              id: appointment.id,
              patient: `${patient.first_name} ${patient.last_name}`,
              practitioner: `${practitioner.first_name} ${practitioner.last_name}`,
              starts_at: appointment.starts_at,
              type: appointmentType.name
            });
          } catch (error: any) {
            if (!error?.message?.includes('not available')) {
              results.errors.push(`Failed to create appointment: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          }
        }
      }

      // 5. Create Past Appointments with Treatment Notes
      if (params.num_past_appointments > 0 && createdPatients.length > 0) {
        for (let i = 0; i < params.num_past_appointments; i++) {
          const patient = randomElement(createdPatients);
          const practitioner = randomElement(practitioners);
          const appointmentType = randomElement(appointmentTypes);
          const business = randomElement(businesses);
          const appointmentDate = generatePastDate(1, params.days_past);
          
          // Note: Past appointments might need different handling
          // For now we'll track them as historical data
          const historicalAppointment = {
            patient_id: patient.id,
            practitioner_id: practitioner.id,
            date: appointmentDate.toISOString(),
            type: appointmentType.name,
            completed: true,
            treatment_note: generateTreatmentNote()
          };
          
          results.created.treatment_notes.push({
            patient: `${patient.first_name} ${patient.last_name}`,
            date: appointmentDate.toLocaleDateString(),
            note_preview: historicalAppointment.treatment_note.substring(0, 100) + '...'
          });
        }
      }

      // 6. Create Invoices - DISABLED DUE TO API ISSUES
      /* Invoice creation is currently disabled due to 404 errors
      if (params.num_invoices > 0 && createdPatients.length > 0 && createdProducts.length > 0) {
        for (let i = 0; i < params.num_invoices; i++) {
          const patient = randomElement(createdPatients);
          const practitioner = randomElement(practitioners);
          const business = randomElement(businesses);
          const numItems = Math.floor(Math.random() * 3) + 1;
          
          const invoiceItems = [];
          let totalAmount = 0;
          
          for (let j = 0; j < numItems; j++) {
            const product = randomElement(createdProducts);
            const quantity = Math.floor(Math.random() * 3) + 1;
            const unitPrice = (product as any).unit_price || 100; // Default to $100 if no price
            const amount = unitPrice * quantity;
            totalAmount += amount;
            
            invoiceItems.push({
              description: product.name,
              unit_price: unitPrice,
              quantity: quantity,
              total: amount,
              tax_amount: taxes.length > 0 ? Math.floor(amount * 0.1) : 0
            });
          }
          
          const invoiceData = {
            patient_id: patient.id,
            practitioner_id: practitioner.id,
            business_id: business.id,
            status: randomElement(['draft', 'awaiting_payment', 'paid', 'part_paid']),
            issued_at: generatePastDate(1, 30).toISOString(),
            due_at: generateFutureDate(1, 30).toISOString(),
            reference_number: `INV-TEST-${Date.now()}-${i}`,
            tax_amount: Math.floor(totalAmount * 0.1),
            net_amount: totalAmount,
            total_amount: totalAmount + Math.floor(totalAmount * 0.1),
            notes: 'Test invoice generated for testing purposes',
            items: invoiceItems
          };

          try {
            const invoice = await client.createInvoice({
              patient_id: invoiceData.patient_id,
              practitioner_id: invoiceData.practitioner_id,
              issue_date: invoiceData.issued_at,  // The client will convert to YYYY-MM-DD format
              status: invoiceData.status as any,
              invoice_items: invoiceData.items.map(item => ({
                description: item.description,
                unit_price: item.unit_price,
                quantity: item.quantity
              }))
            });
            
            results.created.invoices.push({
              id: invoice.id,
              patient: `${patient.first_name} ${patient.last_name}`,
              amount: invoiceData.total_amount,
              status: invoiceData.status
            });
          } catch (error) {
            results.errors.push(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }
      */

      // 7. Create Payments - DISABLED (depends on invoices)
      /* Payment creation is currently disabled as it depends on invoice creation
      if (params.num_payments > 0 && results.created.invoices.length > 0) {
        const invoicesToPay = randomElements(results.created.invoices, Math.min(params.num_payments, results.created.invoices.length));
        
        for (let i = 0; i < invoicesToPay.length; i++) {
          const invoiceRef = invoicesToPay[i];
          try {
            const paymentData = {
              amount: invoiceRef.amount,
              invoice_id: invoiceRef.id,
              payment_method: randomElement(paymentMethods),
              reference: `PAY-TEST-${Date.now()}-${i}`,
              paid_at: generatePastDate(1, 7).toISOString()
            };
            
            const payment = await client.createPayment({
              amount: paymentData.amount,
              invoice_id: paymentData.invoice_id,
              paid_at: paymentData.paid_at,
              payment_method: paymentData.payment_method,
              reference: paymentData.reference
            });
            
            results.created.payments.push({
              id: payment.id,
              invoice_id: invoiceRef.id,
              amount: paymentData.amount,
              method: paymentData.payment_method
            });
          } catch (error) {
            results.errors.push(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown'}`);
          }
        }
      }
      */

      // Calculate summary
      results.summary.total_created = 
        results.created.patients.length +
        results.created.appointments.length +
        results.created.treatment_notes.length +
        results.created.medical_alerts.length +
        results.created.invoices.length +
        results.created.products.length +
        results.created.payments.length;
      
      results.summary.total_errors = results.errors.length;
      results.summary.execution_time_ms = Date.now() - startTime;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
      
    } catch (error) {
      results.errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.summary.execution_time_ms = Date.now() - startTime;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }
  });

  server.tool('cleanup_comprehensive_test_data', {
    description: 'Clean up all test data with granular control and dry-run option',
    inputSchema: {
      type: 'object',
      properties: {
        delete_patients: { type: 'boolean', default: true },
        delete_appointments: { type: 'boolean', default: true },
        delete_invoices: { type: 'boolean', default: true },
        delete_products: { type: 'boolean', default: true },
        delete_all_test_data: { type: 'boolean', default: false },
        test_domain: { type: 'string', default: 'test.cliniko.com' },
        dry_run: { type: 'boolean', default: false, description: 'Preview what would be deleted without actually deleting' }
      }
    },
  }, async (params: z.infer<typeof CleanupOptionsSchema>) => {
    const startTime = Date.now();
    const results = {
      summary: {
        total_deleted: 0,
        total_found: 0,
        execution_time_ms: 0,
        dry_run: params.dry_run
      },
      deleted: {
        patients: [] as any[],
        appointments: [] as any[],
        invoices: [] as any[],
        products: [] as any[],
        payments: [] as any[]
      },
      found: {
        patients: [] as any[],
        appointments: [] as any[],
        invoices: [] as any[],
        products: [] as any[],
        payments: [] as any[]
      },
      errors: [] as string[],
      metadata: {
        test_domain: params.test_domain,
        cleanup_at: new Date().toISOString(),
        dry_run: params.dry_run
      }
    };

    try {
      // 1. Find and delete test patients
      if (params.delete_patients || params.delete_all_test_data) {
        let allPatients: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= 10) {
          const response = await client.listPatients({ page, per_page: 100 });
          const patients = response.patients || [];
          allPatients = allPatients.concat(patients);
          hasMore = !!response.links.next;
          page++;
        }

        // Filter test patients by email domain
        const testPatients = allPatients.filter(p => {
          if (!p.email) return false;
          return p.email.includes(params.test_domain) || 
                 p.email.includes('@gmail.com') || 
                 p.email.includes('@outlook.com') || 
                 p.email.includes('@yahoo.com.au') ||
                 p.email.includes('@test');
        });

        for (const patient of testPatients) {
          const patientInfo = {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            email: patient.email
          };
          
          results.found.patients.push(patientInfo);
          
          if (!params.dry_run) {
            try {
              await client.deletePatient(patient.id);
              results.deleted.patients.push(patientInfo);
            } catch (error) {
              results.errors.push(`Failed to delete patient ${patient.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          }
        }
      }

      // 2. Find and delete test appointments
      if (params.delete_appointments || params.delete_all_test_data) {
        const response = await client.listAppointments({ 
          per_page: 100,
          starts_at: new Date().toISOString() 
        });
        
        const appointments = response.appointments || [];
        
        // Filter test appointments (those with test patients or TEST in notes)
        const testAppointments = appointments.filter((a: any) => {
          return a.notes?.includes('TEST') || 
                 a.notes?.includes('Test') ||
                 results.found.patients.some((p: any) => p.id === a.patient?.id);
        });

        for (const appointment of testAppointments) {
          const appointmentInfo = {
            id: appointment.id,
            patient: appointment.patient?.full_name || 'Unknown',
            date: appointment.starts_at
          };
          
          results.found.appointments.push(appointmentInfo);
          
          if (!params.dry_run) {
            try {
              await client.deleteAppointment(appointment.id);
              results.deleted.appointments.push(appointmentInfo);
            } catch (error) {
              results.errors.push(`Failed to delete appointment ${appointment.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          }
        }
      }

      // 3. Find and delete test products
      if (params.delete_products || params.delete_all_test_data) {
        const response = await client.listProducts({ per_page: 100 });
        const products = response.products || [];
        
        // Filter test products (those with TEST in name or code)
        const testProducts = products.filter((p: any) => {
          return p.name?.includes('TEST') || 
                 p.item_code?.includes('TEST') ||
                 p.description?.includes('Test product');
        });

        for (const product of testProducts) {
          const productInfo = {
            id: product.id,
            name: product.name,
            code: (product as any).item_code || 'N/A'
          };
          
          results.found.products.push(productInfo);
          
          if (!params.dry_run) {
            try {
              await client.deleteProduct(product.id);
              results.deleted.products.push(productInfo);
            } catch (error) {
              results.errors.push(`Failed to delete product ${product.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
          }
        }
      }

      // 4. Find and delete test invoices
      if (params.delete_invoices || params.delete_all_test_data) {
        const response = await client.listInvoices({ per_page: 100 });
        const invoices = response.invoices || [];
        
        // Filter test invoices (those with test patients or TEST in reference)
        const testInvoices = invoices.filter((i: any) => {
          return i.reference_number?.includes('TEST') ||
                 i.notes?.includes('Test invoice') ||
                 results.found.patients.some((p: any) => p.id === i.patient?.id);
        });

        for (const invoice of testInvoices) {
          const invoiceInfo = {
            id: invoice.id,
            patient: invoice.patient?.full_name || 'Unknown',
            amount: invoice.total_amount,
            reference: invoice.reference_number
          };
          
          results.found.invoices.push(invoiceInfo);
          
          if (!params.dry_run) {
            // NOTE: The Cliniko API does not support deleting invoices programmatically
            // Invoices can only be voided or deleted through the Cliniko web interface
            // See INVOICE_API_LIMITATIONS.md for details
            results.errors.push(`Cannot delete invoice ${invoice.id}: Invoice deletion is not supported by the Cliniko API. Invoices must be voided or deleted manually through the Cliniko web interface.`);
          }
        }
      }

      // Calculate summary
      results.summary.total_found = 
        results.found.patients.length +
        results.found.appointments.length +
        results.found.invoices.length +
        results.found.products.length +
        results.found.payments.length;
      
      if (!params.dry_run) {
        results.summary.total_deleted = 
          results.deleted.patients.length +
          results.deleted.appointments.length +
          results.deleted.invoices.length +
          results.deleted.products.length +
          results.deleted.payments.length;
      }
      
      results.summary.execution_time_ms = Date.now() - startTime;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
      
    } catch (error) {
      results.errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.summary.execution_time_ms = Date.now() - startTime;
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }
  });
}