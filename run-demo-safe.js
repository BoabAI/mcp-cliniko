#!/usr/bin/env node
import 'dotenv/config';
import { ClinikoClient } from './dist/cliniko-client.js';

// Load API key from .env file
const API_KEY = process.env.CLINIKO_API_KEY;

if (!API_KEY) {
  console.error('❌ CLINIKO_API_KEY not found in environment');
  process.exit(1);
}

console.log('🚀 Starting Cliniko Invoice Generation Demo (Rate-Limited Version)\n');
console.log('⚠️  Note: This demo includes delays to respect Cliniko API rate limits\n');

const client = new ClinikoClient(API_KEY);

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runDemoSafely() {
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
    // Phase 1: Skip clearing for now to reduce API calls
    console.log('📧 Phase 1: Skipping test data clearing to reduce API calls...\n');
    results.phase = 'Skipped clearing';
    
    // Phase 2: Get required reference data with delays
    console.log('📊 Phase 2: Fetching reference data (with rate limiting)...');
    results.phase = 'Fetching reference data...';
    
    console.log('  Fetching practitioners...');
    await delay(1000);
    const practResponse = await client.listPractitioners({ per_page: 5 });
    const practitioners = practResponse.practitioners || [];
    console.log(`  ✅ Found ${practitioners.length} practitioners`);
    
    console.log('  Fetching appointment types...');
    await delay(1000);
    const apptTypeResponse = await client.listAppointmentTypes({ per_page: 5 });
    const appointmentTypes = apptTypeResponse.appointment_types || [];
    console.log(`  ✅ Found ${appointmentTypes.length} appointment types`);
    
    console.log('  Fetching businesses...');
    await delay(1000);
    const businessResponse = await client.listBusinesses();
    const businesses = businessResponse.businesses || [];
    console.log(`  ✅ Found ${businesses.length} businesses\n`);

    if (practitioners.length === 0 || appointmentTypes.length === 0 || businesses.length === 0) {
      throw new Error('Missing required data: practitioners, appointment types, or businesses. Please configure Cliniko first.');
    }

    // Phase 3: Generate only 2 test patients for minimal demo
    const NUM_PATIENTS = 2;
    const NUM_APPOINTMENTS = 3;
    
    console.log(`👥 Phase 3: Generating ${NUM_PATIENTS} test patients (minimal demo)...`);
    results.phase = `Generating ${NUM_PATIENTS} test patients...`;
    
    const createdPatients = [];
    const firstNames = ['Demo', 'Test'];
    const lastNames = ['User', 'Patient'];
    
    for (let i = 0; i < NUM_PATIENTS; i++) {
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const timestamp = Date.now();
      
      const patientData = {
        first_name: firstName,
        last_name: `${lastName}_TEST_${timestamp}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${timestamp}@test.cliniko.com`,
        date_of_birth: `1980-01-01`,
      };

      try {
        console.log(`  Creating patient ${i + 1}/${NUM_PATIENTS}...`);
        await delay(2000); // 2 second delay between API calls
        const patient = await client.createPatient(patientData);
        createdPatients.push(patient);
        results.generated.patients++;
        console.log(`  ✅ Created patient: ${firstName} ${patientData.last_name}`);
      } catch (error) {
        console.log(`  ❌ Failed to create patient ${i + 1}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('  ⚠️  Rate limit hit - waiting 5 seconds...');
          await delay(5000);
        }
      }
    }
    console.log('');

    if (createdPatients.length === 0) {
      throw new Error('Could not create any test patients due to API limits');
    }

    // Phase 4: Generate test appointments
    console.log(`📅 Phase 4: Generating ${NUM_APPOINTMENTS} test appointments for ${targetDate}...`);
    results.phase = `Generating ${NUM_APPOINTMENTS} test appointments...`;
    
    const createdAppointments = [];
    const startHour = 10;
    
    for (let i = 0; i < NUM_APPOINTMENTS; i++) {
      const patient = createdPatients[i % createdPatients.length];
      const practitioner = practitioners[0]; // Use first practitioner
      const appointmentType = appointmentTypes[0]; // Use first appointment type
      const business = businesses[0];
      
      const appointmentHour = startHour + i;
      const startsAt = `${targetDate}T${String(appointmentHour).padStart(2, '0')}:00:00Z`;
      
      const appointmentData = {
        patient_id: patient.id,
        practitioner_id: practitioner.id,
        appointment_type_id: appointmentType.id,
        business_id: business.id,
        starts_at: startsAt,
        notes: `Test appointment for invoice demo`
      };

      try {
        console.log(`  Creating appointment ${i + 1}/${NUM_APPOINTMENTS} at ${appointmentHour}:00...`);
        await delay(2000); // 2 second delay between API calls
        const appointment = await client.createAppointment(appointmentData);
        createdAppointments.push(appointment);
        results.generated.appointments++;
        console.log(`  ✅ Created appointment at ${appointmentHour}:00`);
      } catch (error) {
        console.log(`  ❌ Failed to create appointment ${i + 1}: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('  ⚠️  Rate limit hit - waiting 5 seconds...');
          await delay(5000);
        }
      }
    }
    console.log('');

    if (createdAppointments.length === 0) {
      console.log('⚠️  No appointments created - skipping invoice generation');
      throw new Error('Could not create any appointments due to API limits');
    }

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
    let invoiceCount = 0;
    for (const [patientId, patientAppointments] of Object.entries(appointmentsByPatient)) {
      invoiceCount++;
      const firstAppointment = patientAppointments[0];
      
      const invoiceItems = patientAppointments.map(apt => ({
        description: `${apt.appointment_type.name} - Appointment`,
        unit_price: 75, // Fixed price for demo
        quantity: 1
      }));

      const invoiceData = {
        patient_id: Number(patientId),
        practitioner_id: firstAppointment.practitioner.id,
        issue_date: targetDate,
        status: 'draft',
        appointment_ids: patientAppointments.map(a => a.id),
        invoice_items: invoiceItems,
        notes: `Demo invoice for appointments on ${targetDate}`
      };

      try {
        console.log(`  Creating invoice ${invoiceCount} for ${firstAppointment.patient.first_name}...`);
        await delay(2000); // 2 second delay between API calls
        const invoice = await client.createInvoice(invoiceData);
        results.invoices.push(invoice);
        results.generated.invoices++;
        console.log(`  ✅ Created invoice #${invoice.invoice_number || invoice.id}`);
      } catch (error) {
        console.log(`  ❌ Failed to create invoice: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('  ⚠️  Rate limit hit - waiting 5 seconds...');
          await delay(5000);
        }
      }
    }

    // Phase 6: Display results
    results.execution_time_ms = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO COMPLETE!');
    console.log('='.repeat(60) + '\n');
    
    console.log('📊 Summary:');
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
        console.log(`  Status: ${inv.status}`);
        console.log(`  Total: $${inv.total || 0}`);
        console.log(`  Items: ${inv.invoice_items?.length || inv.line_items?.length || 0} service(s)`);
        totalValue += (inv.total || 0);
      });
      
      console.log('\n' + '-'.repeat(60));
      console.log(`💰 Total Invoice Value: $${totalValue.toFixed(2)}\n`);
    }
    
    console.log('✨ Next Steps:');
    console.log('  1. View invoices in your Cliniko dashboard');
    console.log('  2. Test the MCP tools through Claude Desktop');
    console.log('  3. Use demo_invoice_generation tool for full demo\n');
    
    console.log('📝 Note: This was a minimal demo due to API rate limits.');
    console.log('   The MCP tools handle this better with built-in delays.\n');

  } catch (error) {
    console.error(`\n❌ Demo failed: ${error.message}\n`);
    
    if (error.message.includes('429')) {
      console.log('💡 Tip: Cliniko has strict API rate limits (200 requests per 5 min window)');
      console.log('   Wait a few minutes before trying again.');
      console.log('   The MCP tools include better rate limiting.\n');
    }
    
    results.errors.push(error.message);
    results.execution_time_ms = Date.now() - startTime;
  }

  return results;
}

// Run the demo
runDemoSafely().catch(console.error);