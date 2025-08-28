import { z } from 'zod';
import { ClinikoClient } from '../cliniko-client.js';

const InvoiceCreateSchema = z.object({
  patient_id: z.number().describe('Patient ID'),
  practitioner_id: z.number().describe('Practitioner ID'),
  issued_at: z.string().describe('Invoice date (ISO 8601 format)'),
  status: z.enum(['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off']).optional().default('draft').describe('Invoice status'),
  notes: z.string().optional().describe('Invoice notes'),
  payment_terms: z.number().optional().describe('Payment terms in days'),
  appointment_ids: z.array(z.number()).optional().describe('Associated appointment IDs'),
  invoice_items: z.array(z.object({
    description: z.string().describe('Item description'),
    unit_price: z.number().describe('Unit price'),
    quantity: z.number().default(1).describe('Quantity'),
    discount_percentage: z.number().optional().default(0).describe('Discount percentage'),
    tax_id: z.number().optional().describe('Tax ID'),
    product_id: z.number().optional().describe('Product ID'),
  })).optional().describe('Invoice line items'),
});

const InvoiceListSchema = z.object({
  patient_id: z.number().optional().describe('Filter by patient ID'),
  practitioner_id: z.number().optional().describe('Filter by practitioner ID'),
  issued_at_from: z.string().optional().describe('Filter by issued date from (ISO 8601)'),
  issued_at_to: z.string().optional().describe('Filter by issued date to (ISO 8601)'),
  status: z.enum(['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off']).optional().describe('Filter by status'),
  page: z.number().optional().describe('Page number'),
  per_page: z.number().optional().describe('Results per page (max 100)'),
});

const PaymentCreateSchema = z.object({
  invoice_id: z.number().describe('Invoice ID'),
  amount: z.number().describe('Payment amount'),
  paid_at: z.string().describe('Payment date (ISO 8601 format)'),
  payment_method: z.enum(['cash', 'credit_card', 'eft', 'cheque', 'other']).optional().default('cash').describe('Payment method'),
  reference: z.string().optional().describe('Payment reference'),
});

const ProductCreateSchema = z.object({
  name: z.string().describe('Product/service name'),
  item_code: z.string().describe('Product/service code'),
  unit_price: z.number().describe('Unit price'),
  description: z.string().optional().describe('Description'),
  tax_id: z.number().optional().describe('Tax ID'),
});

export function registerInvoiceTools(server: any, client: ClinikoClient) {
  // List invoices
  server.tool('list_invoices', {
    description: 'List or filter invoices',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Filter by patient ID' },
        practitioner_id: { type: 'number', description: 'Filter by practitioner ID' },
        issued_at_from: { type: 'string', description: 'Filter by issued date from (ISO 8601)' },
        issued_at_to: { type: 'string', description: 'Filter by issued date to (ISO 8601)' },
        status: { 
          type: 'string', 
          enum: ['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off'],
          description: 'Filter by status' 
        },
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' }
      }
    },
  }, async (params: z.infer<typeof InvoiceListSchema>) => {
    try {
      const response = await client.listInvoices(params);
      const invoices = response.invoices || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${response.total_entries || 0} invoice(s):\n\n${
            invoices.map((inv: any) => 
              `Invoice #${inv.invoice_number || inv.id} - ${inv.patient?.name || 'Unknown'} - ${inv.status} - $${inv.total || 0}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get invoice
  server.tool('get_invoice', {
    description: 'Get details of a specific invoice',
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
- Total: $${invoice.total}
- Outstanding: $${invoice.amount_outstanding}
- Issued: ${invoice.issued_at}
- Notes: ${invoice.notes || 'None'}`
        }],
        data: invoice
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting invoice: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Create invoice
  server.tool('create_invoice', {
    description: 'Create a new invoice',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' },
        practitioner_id: { type: 'number', description: 'Practitioner ID' },
        issued_at: { type: 'string', description: 'Invoice date (ISO 8601)' },
        status: { 
          type: 'string',
          enum: ['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off'],
          description: 'Invoice status (default: draft)' 
        },
        notes: { type: 'string', description: 'Invoice notes' },
        payment_terms: { type: 'number', description: 'Payment terms in days' },
        appointment_ids: { 
          type: 'array',
          items: { type: 'number' },
          description: 'Associated appointment IDs' 
        },
        invoice_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string', description: 'Item description' },
              unit_price: { type: 'number', description: 'Unit price' },
              quantity: { type: 'number', description: 'Quantity (default: 1)' },
              discount_percentage: { type: 'number', description: 'Discount percentage' },
              tax_id: { type: 'number', description: 'Tax ID' },
              product_id: { type: 'number', description: 'Product ID' }
            },
            required: ['description', 'unit_price']
          },
          description: 'Invoice line items'
        }
      },
      required: ['patient_id', 'practitioner_id', 'issued_at']
    },
  }, async (params: z.infer<typeof InvoiceCreateSchema>) => {
    try {
      const invoice = await client.createInvoice(params);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice created successfully:
- Invoice #${invoice.invoice_number || invoice.id}
- Patient: ${invoice.patient?.name}
- Status: ${invoice.status}
- Total: $${invoice.total}`
        }],
        data: invoice
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating invoice: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Update invoice
  server.tool('update_invoice', {
    description: 'Update an existing invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' },
        status: { 
          type: 'string',
          enum: ['draft', 'awaiting_payment', 'part_paid', 'paid', 'void', 'write_off'],
          description: 'New status' 
        },
        notes: { type: 'string', description: 'Invoice notes' },
        payment_terms: { type: 'number', description: 'Payment terms in days' }
      },
      required: ['invoice_id']
    },
  }, async ({ invoice_id, ...updates }: any) => {
    try {
      const invoice = await client.updateInvoice(invoice_id, updates);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice #${invoice.invoice_number || invoice.id} updated successfully`
        }],
        data: invoice
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating invoice: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Delete invoice
  server.tool('delete_invoice', {
    description: 'Delete an invoice (only if draft status)',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' }
      },
      required: ['invoice_id']
    },
  }, async ({ invoice_id }: { invoice_id: number }) => {
    try {
      await client.deleteInvoice(invoice_id);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice ${invoice_id} deleted successfully`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting invoice: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List invoice items
  server.tool('list_invoice_items', {
    description: 'List all items for an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' }
      },
      required: ['invoice_id']
    },
  }, async ({ invoice_id }: { invoice_id: number }) => {
    try {
      const response = await client.listInvoiceItems(invoice_id);
      const items = response.invoice_items || [];
      
      return {
        content: [{
          type: 'text',
          text: `Invoice items:\n\n${
            items.map((item: any) => 
              `- ${item.description}: ${item.quantity} x $${item.unit_price} = $${item.total_amount}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing invoice items: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Add invoice item
  server.tool('add_invoice_item', {
    description: 'Add an item to an existing invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' },
        description: { type: 'string', description: 'Item description' },
        unit_price: { type: 'number', description: 'Unit price' },
        quantity: { type: 'number', description: 'Quantity (default: 1)' },
        discount_percentage: { type: 'number', description: 'Discount percentage' },
        tax_id: { type: 'number', description: 'Tax ID' },
        product_id: { type: 'number', description: 'Product ID' }
      },
      required: ['invoice_id', 'description', 'unit_price']
    },
  }, async ({ invoice_id, ...item }: any) => {
    try {
      const invoiceItem = await client.addInvoiceItem(invoice_id, item);
      
      return {
        content: [{
          type: 'text',
          text: `Item added to invoice: ${invoiceItem.description} - $${invoiceItem.total_amount}`
        }],
        data: invoiceItem
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error adding invoice item: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Update invoice item
  server.tool('update_invoice_item', {
    description: 'Update an invoice item',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' },
        item_id: { type: 'number', description: 'Invoice item ID' },
        description: { type: 'string', description: 'Item description' },
        unit_price: { type: 'number', description: 'Unit price' },
        quantity: { type: 'number', description: 'Quantity' },
        discount_percentage: { type: 'number', description: 'Discount percentage' }
      },
      required: ['invoice_id', 'item_id']
    },
  }, async ({ invoice_id, item_id, ...updates }: any) => {
    try {
      const item = await client.updateInvoiceItem(invoice_id, item_id, updates);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice item updated successfully`
        }],
        data: item
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating invoice item: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Delete invoice item
  server.tool('delete_invoice_item', {
    description: 'Remove an item from an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' },
        item_id: { type: 'number', description: 'Invoice item ID' }
      },
      required: ['invoice_id', 'item_id']
    },
  }, async ({ invoice_id, item_id }: any) => {
    try {
      await client.deleteInvoiceItem(invoice_id, item_id);
      
      return {
        content: [{
          type: 'text',
          text: `Invoice item removed successfully`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting invoice item: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List payments
  server.tool('list_payments', {
    description: 'List payments with filtering',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Filter by invoice ID' },
        patient_id: { type: 'number', description: 'Filter by patient ID' },
        created_at_from: { type: 'string', description: 'Filter by created date from (ISO 8601)' },
        created_at_to: { type: 'string', description: 'Filter by created date to (ISO 8601)' },
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' }
      }
    },
  }, async (params: any) => {
    try {
      const response = await client.listPayments(params);
      const payments = response.payments || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${response.total_entries || 0} payment(s):\n\n${
            payments.map((pay: any) => 
              `Payment for invoice #${pay.invoice?.invoice_number} - $${pay.amount} - ${pay.payment_method} - ${pay.paid_at}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing payments: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Create payment
  server.tool('create_payment', {
    description: 'Record a payment for an invoice',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'number', description: 'Invoice ID' },
        amount: { type: 'number', description: 'Payment amount' },
        paid_at: { type: 'string', description: 'Payment date (ISO 8601)' },
        payment_method: { 
          type: 'string',
          enum: ['cash', 'credit_card', 'eft', 'cheque', 'other'],
          description: 'Payment method (default: cash)' 
        },
        reference: { type: 'string', description: 'Payment reference' }
      },
      required: ['invoice_id', 'amount', 'paid_at']
    },
  }, async (params: z.infer<typeof PaymentCreateSchema>) => {
    try {
      const payment = await client.createPayment(params);
      
      return {
        content: [{
          type: 'text',
          text: `Payment recorded successfully:
- Amount: $${payment.amount}
- Method: ${payment.payment_method}
- Date: ${payment.paid_at}
- Reference: ${payment.reference || 'None'}`
        }],
        data: payment
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating payment: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Delete payment
  server.tool('delete_payment', {
    description: 'Delete a payment record',
    inputSchema: {
      type: 'object',
      properties: {
        payment_id: { type: 'number', description: 'Payment ID' }
      },
      required: ['payment_id']
    },
  }, async ({ payment_id }: { payment_id: number }) => {
    try {
      await client.deletePayment(payment_id);
      
      return {
        content: [{
          type: 'text',
          text: `Payment ${payment_id} deleted successfully`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting payment: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List products
  server.tool('list_products', {
    description: 'List all billable products/services',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' }
      }
    },
  }, async (params: any) => {
    try {
      const response = await client.listProducts(params);
      const products = response.products || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${response.total_entries || 0} product(s):\n\n${
            products.map((prod: any) => 
              `${prod.name} (${prod.item_code}) - $${prod.unit_price}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing products: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get product
  server.tool('get_product', {
    description: 'Get a specific product/service',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: 'Product ID' }
      },
      required: ['product_id']
    },
  }, async ({ product_id }: { product_id: number }) => {
    try {
      const product = await client.getProduct(product_id);
      
      return {
        content: [{
          type: 'text',
          text: `Product: ${product.name}
- Code: ${product.item_code}
- Price: $${product.unit_price}
- Description: ${product.description || 'None'}
- Tax: ${product.tax?.name || 'None'}`
        }],
        data: product
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting product: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Create product
  server.tool('create_product', {
    description: 'Create a billable product/service',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product/service name' },
        item_code: { type: 'string', description: 'Product/service code' },
        unit_price: { type: 'number', description: 'Unit price' },
        description: { type: 'string', description: 'Description' },
        tax_id: { type: 'number', description: 'Tax ID' }
      },
      required: ['name', 'item_code', 'unit_price']
    },
  }, async (params: z.infer<typeof ProductCreateSchema>) => {
    try {
      const product = await client.createProduct(params);
      
      return {
        content: [{
          type: 'text',
          text: `Product created successfully:
- Name: ${product.name}
- Code: ${product.item_code}
- Price: $${product.unit_price}`
        }],
        data: product
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating product: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List taxes
  server.tool('list_taxes', {
    description: 'List all tax configurations',
    inputSchema: {
      type: 'object',
      properties: {}
    },
  }, async () => {
    try {
      const response = await client.listTaxes();
      const taxes = response.taxes || [];
      
      return {
        content: [{
          type: 'text',
          text: `Available taxes:\n\n${
            taxes.map((tax: any) => 
              `${tax.name} - ${tax.rate}%`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing taxes: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Get tax
  server.tool('get_tax', {
    description: 'Get a specific tax configuration',
    inputSchema: {
      type: 'object',
      properties: {
        tax_id: { type: 'number', description: 'Tax ID' }
      },
      required: ['tax_id']
    },
  }, async ({ tax_id }: { tax_id: number }) => {
    try {
      const tax = await client.getTax(tax_id);
      
      return {
        content: [{
          type: 'text',
          text: `Tax: ${tax.name} - ${tax.rate}%`
        }],
        data: tax
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting tax: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Complex workflow: Create invoice from appointments
  server.tool('create_invoice_from_appointments', {
    description: 'Create an invoice from one or more appointments',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' },
        appointment_ids: { 
          type: 'array',
          items: { type: 'number' },
          description: 'Appointment IDs to invoice' 
        },
        auto_detect_services: { 
          type: 'boolean', 
          description: 'Auto-detect services from appointments (default: true)' 
        },
        combine_into_single: { 
          type: 'boolean', 
          description: 'Combine into single invoice (default: true)' 
        }
      },
      required: ['patient_id', 'appointment_ids']
    },
  }, async ({ patient_id, appointment_ids, auto_detect_services = true, combine_into_single = true }: any) => {
    try {
      const invoices = [];
      const allItems = [];
      let practitioner_id = null;
      let issued_at = new Date().toISOString();

      // Get appointment details
      for (const appointment_id of appointment_ids) {
        const appointment = await client.getAppointment(appointment_id);
        
        if (!practitioner_id) {
          practitioner_id = appointment.practitioner.id;
        }

        // Create invoice item for appointment
        const item = {
          description: `${appointment.appointment_type.name} - ${appointment.starts_at}`,
          unit_price: 100, // Default price, should be fetched from appointment type or products
          quantity: 1,
          discount_percentage: 0
        };

        if (combine_into_single) {
          allItems.push(item);
        } else {
          // Create individual invoice
          const invoice = await client.createInvoice({
            patient_id,
            practitioner_id: appointment.practitioner.id,
            issued_at: appointment.starts_at,
            appointment_ids: [appointment_id],
            invoice_items: [item]
          });
          invoices.push(invoice);
        }
      }

      if (combine_into_single && allItems.length > 0) {
        // Create single combined invoice
        const invoice = await client.createInvoice({
          patient_id,
          practitioner_id: practitioner_id!,
          issued_at,
          appointment_ids,
          invoice_items: allItems
        });
        invoices.push(invoice);
      }

      return {
        content: [{
          type: 'text',
          text: `Created ${invoices.length} invoice(s) from ${appointment_ids.length} appointment(s)`
        }],
        data: { invoices }
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating invoice from appointments: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Bulk invoice generation
  server.tool('bulk_invoice_generation', {
    description: 'Generate invoices in bulk for a date range',
    inputSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'Start date (ISO 8601)' },
        date_to: { type: 'string', description: 'End date (ISO 8601)' },
        practitioner_id: { type: 'number', description: 'Filter by practitioner ID' },
        status_filter: { 
          type: 'string',
          description: 'Appointment status filter (default: attended)' 
        },
        grouping: { 
          type: 'string',
          enum: ['patient', 'practitioner', 'appointment'],
          description: 'Grouping strategy (default: patient)' 
        },
        skip_invoiced: { 
          type: 'boolean',
          description: 'Skip already invoiced appointments (default: true)' 
        }
      },
      required: ['date_from', 'date_to']
    },
  }, async ({ date_from, date_to, practitioner_id, status_filter = 'attended', grouping = 'patient', skip_invoiced = true }: any) => {
    try {
      // Get all appointments in range
      const response = await client.listAppointments({
        starts_at: date_from,
        ends_at: date_to,
        practitioner_id,
        per_page: 100
      });
      
      const appointments = response.appointments || [];
      const invoices = [];

      // Group appointments
      const grouped: { [key: string]: any[] } = {};
      
      appointments.forEach((apt: any) => {
        const key = grouping === 'patient' ? apt.patient?.id : 
                   grouping === 'practitioner' ? apt.practitioner.id : 
                   apt.id;
        
        if (key) {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(apt);
        }
      });

      // Create invoices for each group
      for (const [groupKey, groupAppointments] of Object.entries(grouped)) {
        if (groupAppointments.length > 0) {
          const firstApt = groupAppointments[0];
          const items = groupAppointments.map((apt: any) => ({
            description: `${apt.appointment_type.name} - ${apt.starts_at}`,
            unit_price: 100, // Default price
            quantity: 1
          }));

          try {
            const invoice = await client.createInvoice({
              patient_id: firstApt.patient?.id || 0,
              practitioner_id: firstApt.practitioner.id,
              issued_at: new Date().toISOString(),
              appointment_ids: groupAppointments.map((a: any) => a.id),
              invoice_items: items
            });
            invoices.push(invoice);
          } catch (err) {
            // Continue with next group
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Generated ${invoices.length} invoice(s) from ${appointments.length} appointment(s)`
        }],
        data: { generated: invoices.length, invoices }
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error generating bulk invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // Patient cases
  server.tool('list_patient_cases', {
    description: 'List all cases for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'number', description: 'Patient ID' }
      },
      required: ['patient_id']
    },
  }, async ({ patient_id }: { patient_id: number }) => {
    try {
      const response = await client.listPatientCases(patient_id);
      const cases = response.cases || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${cases.length} case(s) for patient:\n\n${
            cases.map((c: any) => 
              `Case ${c.id}: ${c.name} - ${c.status}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing patient cases: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });

  // List invoices for case
  server.tool('list_invoices_for_case', {
    description: 'List all invoices associated with a case',
    inputSchema: {
      type: 'object',
      properties: {
        case_id: { type: 'number', description: 'Case ID' }
      },
      required: ['case_id']
    },
  }, async ({ case_id }: { case_id: number }) => {
    try {
      const response = await client.getCaseInvoices(case_id);
      const invoices = response.invoices || [];
      
      return {
        content: [{
          type: 'text',
          text: `Found ${invoices.length} invoice(s) for case:\n\n${
            invoices.map((inv: any) => 
              `Invoice #${inv.invoice_number || inv.id} - ${inv.status} - $${inv.total}`
            ).join('\n')
          }`
        }],
        data: response
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing case invoices: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  });
}