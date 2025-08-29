import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

// Schema definitions
const InvoiceListSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  patient_id: z.number().optional(),
  practitioner_id: z.number().optional(),
  issued_at_from: z.string().optional(),
  issued_at_to: z.string().optional(),
  status: z.string().optional(),
});

export function registerInvoiceTools(server: any, client: ClinikoClient) {
  // NOTE: The Cliniko API is READ-ONLY for invoices
  // Invoices cannot be created, updated, or deleted via the API
  // They must be managed through the Cliniko web interface
  
  // List invoices (READ-ONLY)
  server.tool('list_invoices', {
    description: 'List invoices with filtering options (READ-ONLY - invoices must be created in Cliniko web interface)',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page' },
        patient_id: { type: 'number', description: 'Filter by patient ID' },
        practitioner_id: { type: 'number', description: 'Filter by practitioner ID' },
        issued_at_from: { type: 'string', description: 'Filter from date (YYYY-MM-DD)' },
        issued_at_to: { type: 'string', description: 'Filter to date (YYYY-MM-DD)' },
        status: { 
          type: 'string',
          enum: ['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off'],
          description: 'Filter by status' 
        }
      }
    },
  }, async (params: z.infer<typeof InvoiceListSchema>) => {
    try {
      const result = await client.listInvoices(params);
      const invoices = result.invoices || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${invoices.length} invoices${result.total_entries ? ` (${result.total_entries} total)` : ''}:\n\n` +
            invoices.map((inv: any) => 
              `- Invoice #${inv.invoice_number || inv.id}: ${inv.patient?.name} - ${inv.status} ($${inv.total || 0})`
            ).join('\n')
        }],
        data: result
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get single invoice (READ-ONLY)
  server.tool('get_invoice', {
    description: 'Get details of a specific invoice (READ-ONLY)',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' }
      },
      required: ['invoice_id']
    },
  }, async ({ invoice_id }: { invoice_id: number }) => {
    try {
      const invoice = await client.getInvoice(invoice_id);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice #${invoice.invoice_number || invoice.id}:
- Patient: ${invoice.patient?.name}
- Practitioner: ${invoice.practitioner?.name}
- Status: ${invoice.status}
- Issue Date: ${invoice.issued_at}
- Total: $${invoice.total || 0}
- Items: ${invoice.invoice_items?.length || 0} items`
        }],
        data: invoice
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching invoice: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get appointment invoices (READ-ONLY)
  server.tool('get_appointment_invoices', {
    description: 'Get invoices for a specific appointment (READ-ONLY)',
    inputSchema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'number', description: 'Appointment ID' }
      },
      required: ['appointment_id']
    },
  }, async ({ appointment_id }: { appointment_id: number }) => {
    try {
      const result = await client.getAppointmentInvoices(appointment_id);
      const invoices = result.invoices || [];
      
      return {
        content: [{
          type: 'text',
          text: invoices.length > 0 
            ? `Found ${invoices.length} invoice(s) for appointment ${appointment_id}:\n\n` +
              invoices.map((inv: any) => 
                `- Invoice #${inv.invoice_number || inv.id}: ${inv.status} ($${inv.total || 0})`
              ).join('\n')
            : `No invoices found for appointment ${appointment_id}. Invoices must be created manually in Cliniko.`
        }],
        data: result
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching appointment invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get patient invoices (READ-ONLY)
  server.tool('get_patient_invoices', {
    description: 'Get invoices for a specific patient (READ-ONLY)',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' }
      },
      required: ['patient_id']
    },
  }, async ({ patient_id }: { patient_id: number }) => {
    try {
      const result = await client.getPatientInvoices(patient_id);
      const invoices = result.invoices || [];
      
      return {
        content: [{
          type: 'text',
          text: invoices.length > 0
            ? `Found ${invoices.length} invoice(s) for patient ${patient_id}:\n\n` +
              invoices.map((inv: any) => 
                `- Invoice #${inv.invoice_number || inv.id}: ${inv.issued_at} - ${inv.status} ($${inv.total || 0})`
              ).join('\n')
            : `No invoices found for patient ${patient_id}. Invoices must be created manually in Cliniko.`
        }],
        data: result
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching patient invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List invoice items (READ-ONLY)
  server.tool('list_invoice_items', {
    description: 'List items in an invoice (READ-ONLY)',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' }
      },
      required: ['invoice_id']
    },
  }, async ({ invoice_id }: { invoice_id: number }) => {
    try {
      const result = await client.listInvoiceItems(invoice_id);
      const items = result.invoice_items || [];
      
      return {
        content: [{
          type: 'text',
          text: `Invoice #${invoice_id} has ${items.length} items:\n\n` +
            items.map((item: any) => 
              `- ${item.description}: $${item.unit_price} x ${item.quantity} = $${item.total}`
            ).join('\n')
        }],
        data: result
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching invoice items: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Invoice creation instructions tool
  server.tool('how_to_create_invoices', {
    description: 'Get instructions on how to create invoices in Cliniko (manual process)',
    inputSchema: {
      type: 'object',
      properties: {}
    },
  }, async () => {
    return {
      content: [{
        type: 'text',
        text: `⚠️ IMPORTANT: The Cliniko API is READ-ONLY for invoices.

Invoices CANNOT be created programmatically via the API.
They must be created through the Cliniko web interface.

📝 HOW TO CREATE INVOICES IN CLINIKO:

Option 1: From an Appointment
1. Go to the appointment in Cliniko
2. Click "Create Invoice" button
3. Review and save the invoice

Option 2: Bulk Invoice Creation
1. Go to Invoices → Bulk Invoice
2. Select date range and filters
3. Select appointments to invoice
4. Generate invoices in bulk

Option 3: Manual Invoice Creation
1. Go to Invoices → New Invoice
2. Select patient and practitioner
3. Add appointment(s) or line items
4. Set payment terms and save

🔄 AUTOMATION OPTIONS:
• Set up automatic invoice creation rules in Settings
• Use third-party integrations (Zapier, Pipedream)
• Configure appointment type billing defaults

For more details, see the INVOICE_API_LIMITATIONS.md file in this repository.`
      }]
    };
  });
}