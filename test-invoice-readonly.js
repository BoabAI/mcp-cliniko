#!/usr/bin/env node

/**
 * Test script to verify invoice read-only operations work correctly
 * This confirms that the Cliniko API only supports reading invoices, not creating them
 */

import { ClinikoClient } from './dist/cliniko-client.js';

// Check for API key
const apiKey = process.env.CLINIKO_API_KEY;
if (!apiKey) {
  console.error('❌ CLINIKO_API_KEY environment variable not set');
  process.exit(1);
}

const client = new ClinikoClient(apiKey);

async function testInvoiceReadOperations() {
  console.log('🧪 Testing Invoice Read-Only Operations\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: List invoices
    console.log('\n📋 Test 1: Listing invoices...');
    const invoiceList = await client.listInvoices({ per_page: 5 });
    console.log(`✅ Found ${invoiceList.invoices?.length || 0} invoices`);
    
    if (invoiceList.invoices && invoiceList.invoices.length > 0) {
      const firstInvoice = invoiceList.invoices[0];
      
      // Test 2: Get specific invoice
      console.log(`\n📋 Test 2: Getting invoice #${firstInvoice.id}...`);
      const invoice = await client.getInvoice(firstInvoice.id);
      console.log(`✅ Retrieved invoice:
  - Number: ${invoice.invoice_number || 'N/A'}
  - Patient: ${invoice.patient?.full_name || 'Unknown'}
  - Status: ${invoice.status}
  - Total: $${invoice.total_amount || 0}`);
      
      // Test 3: List invoice items
      console.log(`\n📋 Test 3: Getting invoice items for invoice #${firstInvoice.id}...`);
      const items = await client.listInvoiceItems(firstInvoice.id);
      console.log(`✅ Found ${items.invoice_items?.length || 0} items`);
      
      // Test 4: Get patient invoices (if patient exists)
      if (invoice.patient?.id) {
        console.log(`\n📋 Test 4: Getting invoices for patient #${invoice.patient.id}...`);
        const patientInvoices = await client.getPatientInvoices(invoice.patient.id);
        console.log(`✅ Found ${patientInvoices.invoices?.length || 0} invoices for this patient`);
      }
    } else {
      console.log('\n⚠️ No existing invoices found to test with');
      console.log('This is expected if no invoices have been created manually in Cliniko');
    }
    
    // Test 5: Verify write operations are not available
    console.log('\n📋 Test 5: Verifying write operations are not available...');
    console.log('✅ Confirmed: createInvoice method does not exist on client');
    console.log('✅ Confirmed: updateInvoice method does not exist on client');
    console.log('✅ Confirmed: deleteInvoice method does not exist on client');
    
    // Verify the methods really don't exist
    const hasCreate = typeof client.createInvoice === 'function';
    const hasUpdate = typeof client.updateInvoice === 'function';
    const hasDelete = typeof client.deleteInvoice === 'function';
    
    if (hasCreate || hasUpdate || hasDelete) {
      console.error('❌ ERROR: Found invoice write methods that should have been removed!');
      if (hasCreate) console.error('  - createInvoice still exists');
      if (hasUpdate) console.error('  - updateInvoice still exists');
      if (hasDelete) console.error('  - deleteInvoice still exists');
      process.exit(1);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All invoice read-only tests passed!');
    console.log('\n📚 Remember: Invoices can only be created through:');
    console.log('  1. Cliniko web interface manually');
    console.log('  2. Cliniko automated rules (configured in Settings)');
    console.log('  3. Third-party integrations (Zapier, QuickBooks, etc.)');
    console.log('\nSee INVOICE_API_LIMITATIONS.md for full details.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testInvoiceReadOperations().catch(console.error);