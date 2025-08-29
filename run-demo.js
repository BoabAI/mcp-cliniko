#!/usr/bin/env node
import 'dotenv/config';
import { ClinikoClient } from './dist/cliniko-client.js';

// Load API key from .env file
const API_KEY = process.env.CLINIKO_API_KEY;

if (!API_KEY) {
  console.error('❌ CLINIKO_API_KEY not found in environment');
  process.exit(1);
}

console.log('🚀 Starting Cliniko Invoice Generation Demo\n');

const client = new ClinikoClient(API_KEY);

async function runDemo() {
  const startTime = Date.now();
  const targetDate = new Date().toISOString().split('T')[0]; // Today's date
  
  const results = {
    phase: '',
    cleared_data: false,
    generated: {
      patients: 0,
      appointments: 0,
      invoices: 0,
    },
    invoices: [],
    errors: [],
    execution_time_ms: 0,
  };

  try {
    // Phase 1: Clear existing test data
    console.log('📧 Phase 1: Clearing existing test data...');
    results.phase = 'Clearing existing test data...';
    
    try {
      const testPatientsResponse = await client.listPatients({ per_page: 100 });
      const testPatients = (testPatientsResponse.patients || []).filter(p => 
        p.email && (p.email.includes('@test.cliniko.com') || p.email.includes('@gmail.com'))
      );

      console.log(`  Found ${testPatients.length} test patients to remove`);

      // Delete test appointments first
      for (const patient of testPatients) {
        try {
          const appointmentsResponse = await client.listAppointments({ 
            patient_id: patient.id,
            per_page: 100 
          });
          
          for (const appointment of (appointmentsResponse.appointments || [])) {
            try {
              await client.cancelAppointment(appointment.id);
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          // Continue
        }
      }

      // Delete test patients
      for (const patient of testPatients) {
        try {
          await client.deletePatient(patient.id);
        } catch (e) {
          // Continue
        }
      }

      results.cleared_data = true;
      console.log('  ✅ Test data cleared\n');
    } catch (error) {
      console.log('  ⚠️ Warning: Could not clear all test data\n');
    }

    // Phase 2: Get required reference data
    console.log('📊 Phase 2: Fetching reference data...');
    results.phase = 'Fetching reference data...';
    
    const [practResponse, apptTypeResponse, businessResponse] = await Promise.all([
      client.listPractitioners({ per_page: 20 }),
      client.listAppointmentTypes({ per_page: 20 }),
      client.listBusinesses()
    ]);
    
    const practitioners = practResponse.practitioners || [];
    const appointmentTypes = apptTypeResponse.appointment_types || [];
    const businesses = businessResponse.businesses || [];

    console.log(`  Found ${practitioners.length} practitioners`);
    console.log(`  Found ${appointmentTypes.length} appointment types`);
    console.log(`  Found ${businesses.length} businesses\n`);

    if (practitioners.length === 0 || appointmentTypes.length === 0 || businesses.length === 0) {
      throw new Error('Missing required data: practitioners, appointment types, or businesses. Please configure Cliniko first.');
    }

    // Phase 3: Generate test patients (reduced to 5 for quick demo)
    const NUM_PATIENTS = 5;
    const NUM_APPOINTMENTS = 10;
    
    console.log(`👥 Phase 3: Generating ${NUM_PATIENTS} test patients...`);
    results.phase = `Generating ${NUM_PATIENTS} test patients...`;
    
    const createdPatients = [];
    const firstNames = ['James', 'Emma', 'Oliver', 'Charlotte', 'William'];
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson'];
    
    for (let i = 0; i < NUM_PATIENTS; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      
      const patientData = {
        first_name: firstName,
        last_name: `${lastName}_TEST`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@test.cliniko.com`,
        date_of_birth: `${1950 + Math.floor(Math.random() * 50)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      };

      try {
        const patient = await client.createPatient(patientData);
        createdPatients.push(patient);
        results.generated.patients++;
        console.log(`  ✅ Created patient: ${firstName} ${lastName}_TEST`);
      } catch (error) {
        console.log(`  ❌ Failed to create patient ${i + 1}`);
      }
    }
    console.log('');

    // Phase 4: Generate test appointments
    console.log(`📅 Phase 4: Generating ${NUM_APPOINTMENTS} test appointments for ${targetDate}...`);
    results.phase = `Generating ${NUM_APPOINTMENTS} test appointments...`;
    
    const createdAppointments = [];
    const startHour = 9;
    const appointmentInterval = 30; // 30 minutes between appointments
    
    for (let i = 0; i < NUM_APPOINTMENTS; i++) {
      const patient = createdPatients[i % createdPatients.length];
      const practitioner = practitioners[i % practitioners.length];
      const appointmentType = appointmentTypes[i % appointmentTypes.length];
      const business = businesses[0];
      
      const minutesFromStart = i * appointmentInterval;
      const appointmentHour = startHour + Math.floor(minutesFromStart / 60);
      const appointmentMinute = minutesFromStart % 60;
      
      const startsAt = `${targetDate}T${String(appointmentHour).padStart(2, '0')}:${String(appointmentMinute).padStart(2, '0')}:00Z`;
      
      const appointmentData = {
        patient_id: patient.id,
        practitioner_id: practitioner.id,
        appointment_type_id: appointmentType.id,
        business_id: business.id,
        starts_at: startsAt,
        notes: `Test appointment for invoice demo`
      };

      try {
        const appointment = await client.createAppointment(appointmentData);
        createdAppointments.push(appointment);
        results.generated.appointments++;
        console.log(`  ✅ Created appointment at ${appointmentHour}:${String(appointmentMinute).padStart(2, '0')}`);
      } catch (error) {
        console.log(`  ❌ Failed to create appointment ${i + 1}`);
      }
    }
    console.log('');

    // Phase 5: Generate invoices
    console.log(`💰 Phase 5: Generating invoices for appointments on ${targetDate}...`);
    results.phase = `Generating invoices...`;
    
    // Group appointments by patient
    const appointmentsByPatient = {};
    for (const appointment of createdAppointments) {
      const patientId = appointment.patient.id;
      if (!appointmentsByPatient[patientId]) {
        appointmentsByPatient[patientId] = [];
      }
      appointmentsByPatient[patientId].push(appointment);
    }

    // Create one invoice per patient
    for (const [patientId, patientAppointments] of Object.entries(appointmentsByPatient)) {
      const firstAppointment = patientAppointments[0];
      
      const invoiceItems = patientAppointments.map(apt => ({
        description: `${apt.appointment_type.name} - ${new Date(apt.starts_at).toLocaleTimeString()}`,
        unit_price: Math.floor(Math.random() * 100) + 50, // $50-$150
        quantity: 1
      }));

      const invoiceData = {
        patient_id: Number(patientId),
        practitioner_id: firstAppointment.practitioner.id,
        issue_date: targetDate,
        status: 'draft',
        appointment_ids: patientAppointments.map(a => a.id),
        invoice_items: invoiceItems,
        notes: `Invoice for appointments on ${targetDate}`
      };

      try {
        const invoice = await client.createInvoice(invoiceData);
        results.invoices.push(invoice);
        results.generated.invoices++;
        console.log(`  ✅ Created invoice for patient ${firstAppointment.patient.first_name} ${firstAppointment.patient.last_name}`);
      } catch (error) {
        console.log(`  ❌ Failed to create invoice for patient ${patientId}`);
      }
    }

    // Phase 6: Display results
    results.execution_time_ms = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO COMPLETE!');
    console.log('='.repeat(60) + '\n');
    
    console.log('📊 Summary:');
    console.log(`  ✅ Test data cleared: ${results.cleared_data ? 'Yes' : 'No'}`);
    console.log(`  👥 Patients created: ${results.generated.patients}/${NUM_PATIENTS}`);
    console.log(`  📅 Appointments created: ${results.generated.appointments}/${NUM_APPOINTMENTS}`);
    console.log(`  📄 Invoices generated: ${results.generated.invoices}`);
    console.log(`  ⏱️ Execution time: ${(results.execution_time_ms / 1000).toFixed(2)} seconds`);
    console.log(`  📆 Target Date: ${targetDate}\n`);
    
    if (results.invoices.length > 0) {
      console.log('📄 Generated Invoices:');
      console.log('-'.repeat(60));
      
      let totalValue = 0;
      results.invoices.forEach((inv, idx) => {
        console.log(`\nInvoice ${idx + 1} (#${inv.invoice_number || inv.id})`);
        console.log(`  Patient: ${inv.patient?.first_name} ${inv.patient?.last_name}`);
        console.log(`  Practitioner: ${inv.practitioner?.name || 'Unknown'}`);
        console.log(`  Status: ${inv.status}`);
        console.log(`  Total: $${inv.total || 0}`);
        console.log(`  Items: ${inv.invoice_items?.length || 0} service(s)`);
        totalValue += (inv.total || 0);
      });
      
      console.log('\n' + '-'.repeat(60));
      console.log(`💰 Total Invoice Value: $${totalValue.toFixed(2)}\n`);
    }
    
    console.log('✨ Next Steps:');
    console.log('  1. View invoices in Cliniko dashboard');
    console.log('  2. Process payments for the invoices');
    console.log('  3. Generate reports for the billing period\n');

  } catch (error) {
    console.error(`\n❌ Demo failed: ${error.message}\n`);
    results.errors.push(error.message);
    results.execution_time_ms = Date.now() - startTime;
  }

  return results;
}

// Run the demo
runDemo().catch(console.error);