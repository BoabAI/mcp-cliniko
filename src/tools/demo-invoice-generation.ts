import { ClinikoClient } from '../cliniko-client.js';

// Helper function to add delay for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function registerDemoInvoiceTools(toolRegistry: any, clinikoClient: ClinikoClient) {
  toolRegistry.register(
    'demo_invoice_generation',
    {
      description: 'Demo: Generate test patients and appointments, then show how to create invoices. NOTE: Cliniko API is READ-ONLY for invoices - they must be created via the web interface.',
      inputSchema: {
        type: 'object',
        properties: {
          target_date: {
            type: 'string',
            description: 'Target date for appointments (YYYY-MM-DD format). Defaults to today'
          },
          num_patients: {
            type: 'number',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Number of test patients to generate (max 10 for rate limits)'
          },
          num_appointments: {
            type: 'number',
            minimum: 1,
            maximum: 20,
            default: 10,
            description: 'Number of appointments to generate (max 20 for rate limits)'
          },
          clear_existing: {
            type: 'boolean',
            default: true,
            description: 'Clear existing test data before generating new data'
          },
          display_format: {
            type: 'string',
            enum: ['summary', 'detailed', 'json'],
            default: 'detailed',
            description: 'How to display the results'
          }
        }
      }
    },
    async (args: any) => {
      const startTime = Date.now();
      const target_date = args.target_date || new Date().toISOString().split('T')[0];
      const num_patients = args.num_patients || 5;
      const num_appointments = args.num_appointments || 10;
      
      const results = {
        phase: '',
        cleared_data: false,
        generated: {
          patients: 0,
          appointments: 0,
          invoices_found: 0,
        },
        invoices: [] as any[],
        errors: [] as string[],
        execution_time_ms: 0,
        invoice_creation_instructions: true
      };

      try {
        // Phase 1: Clear existing test data if requested
        if (args.clear_existing) {
          console.log('📧 Phase 1: Clearing existing test data...\n');
          results.phase = 'Clearing existing test data';
          
          try {
            const testPatientsResponse = await clinikoClient.listPatients({ per_page: 100 });
            const testPatients = (testPatientsResponse.patients || []).filter((p: any) => 
              p.email && (p.email.includes('@test.cliniko.com') || p.last_name?.includes('_TEST'))
            );

            console.log(`  Found ${testPatients.length} test patients to remove`);

            for (const patient of testPatients) {
              try {
                await delay(500); // Rate limiting
                await clinikoClient.deletePatient(patient.id);
                console.log(`  ✅ Deleted patient: ${patient.first_name} ${patient.last_name}`);
              } catch (e) {
                // Continue
              }
            }

            results.cleared_data = true;
            console.log('  ✅ Test data cleared\n');
          } catch (error: any) {
            console.log('  ⚠️ Warning: Could not clear all test data\n');
          }
        }

        // Phase 2: Get required reference data
        console.log('📊 Phase 2: Fetching reference data...\n');
        results.phase = 'Fetching reference data';
        
        await delay(1000);
        const [practResponse, apptTypeResponse, businessResponse] = await Promise.all([
          clinikoClient.listPractitioners({ per_page: 20 }),
          clinikoClient.listAppointmentTypes({ per_page: 20 }),
          clinikoClient.listBusinesses()
        ]);
        
        const practitioners = practResponse.practitioners || [];
        const appointmentTypes = apptTypeResponse.appointment_types || [];
        const businesses = businessResponse.businesses || [];

        console.log(`  Found ${practitioners.length} practitioners`);
        console.log(`  Found ${appointmentTypes.length} appointment types`);
        console.log(`  Found ${businesses.length} businesses\n`);

        if (practitioners.length === 0 || appointmentTypes.length === 0 || businesses.length === 0) {
          throw new Error('Missing required data: practitioners, appointment types, or businesses');
        }

        // Phase 3: Generate test patients
        console.log(`👥 Phase 3: Generating ${num_patients} test patients...\n`);
        results.phase = 'Generating test patients';
        
        const createdPatients: any[] = [];
        const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        
        for (let i = 0; i < num_patients; i++) {
          const firstName = firstNames[i % firstNames.length];
          const lastName = lastNames[i % lastNames.length];
          const timestamp = Date.now();
          
          const patientData = {
            first_name: firstName,
            last_name: `${lastName}_TEST_${timestamp}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${timestamp}@test.cliniko.com`,
            date_of_birth: `1980-01-${String(i + 1).padStart(2, '0')}`,
          };

          try {
            console.log(`  Creating patient ${i + 1}/${num_patients}...`);
            await delay(1000); // Rate limiting
            const patient = await clinikoClient.createPatient(patientData);
            createdPatients.push(patient);
            results.generated.patients++;
            console.log(`  ✅ Created: ${firstName} ${patientData.last_name}`);
          } catch (error: any) {
            console.log(`  ❌ Failed to create patient ${i + 1}: ${error.message}`);
            if (error.message.includes('429')) {
              console.log('  ⚠️ Rate limit hit - waiting 5 seconds...');
              await delay(5000);
            }
          }
        }
        console.log('');

        if (createdPatients.length === 0) {
          throw new Error('Could not create any test patients');
        }

        // Phase 4: Generate test appointments
        console.log(`📅 Phase 4: Generating ${num_appointments} test appointments for ${target_date}...\n`);
        results.phase = 'Generating test appointments';
        
        const createdAppointments: any[] = [];
        const startHour = 9;
        const minuteInterval = 30;
        
        for (let i = 0; i < num_appointments; i++) {
          const patient = createdPatients[i % createdPatients.length];
          const practitioner = practitioners[i % practitioners.length];
          const appointmentType = appointmentTypes[i % appointmentTypes.length];
          const business = businesses[0];
          
          const totalMinutes = i * minuteInterval;
          const appointmentHour = startHour + Math.floor(totalMinutes / 60);
          const appointmentMinute = totalMinutes % 60;
          
          const startsAt = `${target_date}T${String(appointmentHour).padStart(2, '0')}:${String(appointmentMinute).padStart(2, '0')}:00Z`;
          
          const appointmentData = {
            patient_id: patient.id,
            practitioner_id: practitioner.id,
            appointment_type_id: appointmentType.id,
            business_id: business.id,
            starts_at: startsAt,
            notes: `Test appointment for invoice demo`
          };

          try {
            console.log(`  Creating appointment ${i + 1}/${num_appointments} at ${appointmentHour}:${String(appointmentMinute).padStart(2, '0')}...`);
            await delay(1000); // Rate limiting
            const appointment = await clinikoClient.createAppointment(appointmentData);
            createdAppointments.push(appointment);
            results.generated.appointments++;
            console.log(`  ✅ Created appointment at ${appointmentHour}:${String(appointmentMinute).padStart(2, '0')}`);
          } catch (error: any) {
            console.log(`  ❌ Failed to create appointment ${i + 1}: ${error.message}`);
            if (error.message.includes('429')) {
              console.log('  ⚠️ Rate limit hit - waiting 5 seconds...');
              await delay(5000);
            }
          }
        }
        console.log('');

        // Phase 5: Invoice Creation Instructions
        console.log('💰 Phase 5: Invoice Creation Instructions\n');
        console.log('=' .repeat(60));
        console.log('⚠️  IMPORTANT: CLINIKO API LIMITATIONS');
        console.log('=' .repeat(60));
        console.log('\n  The Cliniko API is READ-ONLY for invoices.');
        console.log('  Invoices CANNOT be created programmatically via the API.\n');
        
        console.log('📝 HOW TO CREATE INVOICES IN CLINIKO:\n');
        console.log('  Option 1: From an Appointment');
        console.log('  --------------------------------');
        console.log('  1. Go to the appointment in Cliniko');
        console.log('  2. Click "Create Invoice" button');
        console.log('  3. Review and save the invoice\n');
        
        console.log('  Option 2: Bulk Invoice Creation');
        console.log('  --------------------------------');
        console.log('  1. Go to Invoices → Bulk Invoice');
        console.log('  2. Select date range and filters');
        console.log('  3. Select appointments to invoice');
        console.log('  4. Generate invoices in bulk\n');
        
        console.log('  Option 3: Manual Invoice Creation');
        console.log('  ---------------------------------');
        console.log('  1. Go to Invoices → New Invoice');
        console.log('  2. Select patient and practitioner');
        console.log('  3. Add appointment(s) or line items');
        console.log('  4. Set payment terms and save\n');
        
        console.log('🔄 AUTOMATION OPTIONS:\n');
        console.log('  • Set up automatic invoice creation rules in Settings');
        console.log('  • Use third-party integrations (Zapier, Pipedream)');
        console.log('  • Configure appointment type billing defaults\n');

        // Phase 6: Check for existing invoices
        console.log('🔍 Phase 6: Checking for existing invoices...\n');
        results.phase = 'Checking for invoices';
        
        let totalInvoicesFound = 0;
        for (const appointment of createdAppointments) {
          try {
            await delay(500);
            const invoicesResponse = await clinikoClient.getAppointmentInvoices(appointment.id);
            if (invoicesResponse.invoices && invoicesResponse.invoices.length > 0) {
              results.invoices.push(...invoicesResponse.invoices);
              totalInvoicesFound += invoicesResponse.invoices.length;
              console.log(`  ✅ Found ${invoicesResponse.invoices.length} invoice(s) for appointment ${appointment.id}`);
            }
          } catch (error: any) {
            // Silently skip 404s
          }
        }
        
        results.generated.invoices_found = totalInvoicesFound;
        
        if (totalInvoicesFound === 0) {
          console.log('  ℹ️ No invoices found for the created appointments.');
          console.log('  This is expected - please create them manually in Cliniko.\n');
        }

        // Calculate execution time
        results.execution_time_ms = Date.now() - startTime;
        
        // Final summary
        console.log('\n' + '='.repeat(60));
        console.log('🎉 DEMO COMPLETE!');
        console.log('='.repeat(60) + '\n');
        
        console.log('📊 Summary:');
        console.log(`  ✅ Test data cleared: ${results.cleared_data ? 'Yes' : 'No'}`);
        console.log(`  👥 Patients created: ${results.generated.patients}/${num_patients}`);
        console.log(`  📅 Appointments created: ${results.generated.appointments}/${num_appointments}`);
        console.log(`  📄 Existing invoices found: ${results.generated.invoices_found}`);
        console.log(`  ⏱️ Execution time: ${(results.execution_time_ms / 1000).toFixed(2)} seconds`);
        console.log(`  📆 Target Date: ${target_date}\n`);
        
        console.log('✨ Next Steps:');
        console.log('  1. Log into Cliniko web interface');
        console.log('  2. Navigate to the appointments for ' + target_date);
        console.log('  3. Create invoices using one of the methods above');
        console.log('  4. Use display_invoices_for_date tool to view them\n');

        return {
          success: true,
          message: `Demo complete. Created ${results.generated.patients} patients and ${results.generated.appointments} appointments. Please create invoices manually in Cliniko.`,
          results
        };

      } catch (error: any) {
        console.error(`\n❌ Demo failed: ${error.message}\n`);
        
        if (error.message.includes('429')) {
          console.log('💡 Tip: Cliniko has strict rate limits (200 requests per 5 min)');
          console.log('   Wait a few minutes before trying again.\n');
        }
        
        results.errors.push(error.message);
        results.execution_time_ms = Date.now() - startTime;
        
        return {
          success: false,
          message: `Demo failed: ${error.message}`,
          results
        };
      }
    }
  );

  // Tool to display existing invoices for a date
  toolRegistry.register(
    'display_invoices_for_date',
    {
      description: 'Display all existing invoices for a specific date (READ-ONLY). Invoices must be created manually in Cliniko.',
      inputSchema: {
        type: 'object',
        properties: {
          target_date: {
            type: 'string',
            description: 'Date to display invoices for (YYYY-MM-DD format)'
          },
          display_format: {
            type: 'string',
            enum: ['summary', 'detailed', 'json'],
            default: 'detailed',
            description: 'How to display the invoices'
          }
        },
        required: ['target_date']
      }
    },
    async (args: any) => {
      const { target_date, display_format = 'detailed' } = args;
      
      try {
        console.log(`🔍 Fetching existing invoices for ${target_date}...\n`);
        console.log('⚠️ NOTE: Invoices are read-only via API.');
        console.log('   Any invoices shown were created manually in Cliniko.\n');
        
        const invoicesResponse = await clinikoClient.listInvoices({
          issued_at_from: target_date,
          issued_at_to: target_date,
          per_page: 100
        });
        
        const invoices = invoicesResponse.invoices || [];
        
        if (invoices.length === 0) {
          return {
            success: false,
            message: `No invoices found for ${target_date}. Invoices must be created manually in the Cliniko web interface.`,
            results: {
              target_date,
              invoice_count: 0,
              display_format,
              note: 'The Cliniko API is read-only for invoices. Please create them via the web interface.'
            }
          };
        }

        console.log(`Found ${invoices.length} invoice(s) for ${target_date}\n`);
        
        if (display_format === 'json') {
          return {
            success: true,
            message: `Found ${invoices.length} invoices`,
            results: {
              target_date,
              invoice_count: invoices.length,
              invoices
            }
          };
        }

        let totalValue = 0;
        
        if (display_format === 'summary') {
          console.log('📄 Invoice Summary:');
          console.log('-'.repeat(60));
          
          invoices.forEach((inv: any, idx: number) => {
            console.log(`\nInvoice ${idx + 1}: #${inv.invoice_number || inv.id}`);
            console.log(`  Patient: ${inv.patient?.first_name} ${inv.patient?.last_name}`);
            console.log(`  Total: $${inv.total || 0}`);
            console.log(`  Status: ${inv.status}`);
            totalValue += (inv.total || 0);
          });
        } else {
          // Detailed format
          console.log('📄 Detailed Invoices:');
          console.log('='.repeat(60));
          
          invoices.forEach((inv: any, idx: number) => {
            console.log(`\nInvoice ${idx + 1}:`);
            console.log(`  Number: #${inv.invoice_number || inv.id}`);
            console.log(`  Patient: ${inv.patient?.first_name} ${inv.patient?.last_name}`);
            console.log(`  Practitioner: ${inv.practitioner?.name || 'Unknown'}`);
            console.log(`  Issue Date: ${inv.issued_at}`);
            console.log(`  Status: ${inv.status}`);
            console.log(`  Payment Terms: ${inv.payment_terms || 'Not specified'}`);
            console.log(`  Total: $${inv.total || 0}`);
            
            if (inv.invoice_items && inv.invoice_items.length > 0) {
              console.log(`  Items:`);
              inv.invoice_items.forEach((item: any) => {
                console.log(`    - ${item.description}: $${item.unit_price} x ${item.quantity}`);
              });
            }
            
            if (inv.notes) {
              console.log(`  Notes: ${inv.notes}`);
            }
            
            totalValue += (inv.total || 0);
          });
        }
        
        console.log('\n' + '-'.repeat(60));
        console.log(`💰 Total Invoice Value: $${totalValue.toFixed(2)}\n`);

        return {
          success: true,
          message: `Displayed ${invoices.length} invoices totaling $${totalValue.toFixed(2)}`,
          results: {
            target_date,
            invoice_count: invoices.length,
            total_value: totalValue,
            display_format
          }
        };

      } catch (error: any) {
        console.error(`❌ Error fetching invoices: ${error.message}\n`);
        
        return {
          success: false,
          message: `Failed to fetch invoices: ${error.message}`,
          error: error.message
        };
      }
    }
  );
}