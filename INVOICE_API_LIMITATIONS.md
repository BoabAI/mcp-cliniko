# Cliniko Invoice API Limitations

## ⚠️ CRITICAL: The Cliniko API is READ-ONLY for Invoices

### Summary
The Cliniko API **does not support creating, updating, or deleting invoices programmatically**. All invoice operations must be performed through the Cliniko web interface or through automated rules configured within Cliniko itself.

## What the API Can Do (READ Operations)

✅ **Supported Operations:**
- `GET /invoices` - List all invoices with filtering options
- `GET /invoices/{id}` - Get a specific invoice by ID
- `GET /appointments/{id}/invoices` - Get invoices for a specific appointment
- `GET /patients/{id}/invoices` - Get invoices for a specific patient
- `GET /cases/{id}/invoices` - Get invoices for a specific case
- `GET /invoices/{id}/invoice_items` - List items in an invoice

## What the API Cannot Do (WRITE Operations)

❌ **Unsupported Operations:**
- `POST /invoices` - **Cannot create new invoices**
- `PUT /invoices/{id}` - **Cannot update existing invoices**
- `DELETE /invoices/{id}` - **Cannot delete invoices**
- `POST /invoices/{id}/invoice_items` - **Cannot add items to invoices**
- `PUT /invoices/{id}/invoice_items/{id}` - **Cannot update invoice items**
- `DELETE /invoices/{id}/invoice_items/{id}` - **Cannot delete invoice items**

## How to Create Invoices in Cliniko

Since the API doesn't support invoice creation, you have these options:

### 1. Manual Creation in Web Interface

#### From an Appointment:
1. Navigate to the appointment in Cliniko
2. Click the "Create Invoice" button
3. Review the auto-populated information
4. Add any additional items or adjustments
5. Save the invoice

#### Bulk Invoice Creation:
1. Go to **Invoices → Bulk Invoice**
2. Select your date range and filters
3. Select the appointments to invoice
4. Generate invoices in bulk

#### Manual Invoice Creation:
1. Go to **Invoices → New Invoice**
2. Select the patient and practitioner
3. Add appointment(s) or custom line items
4. Set payment terms and due date
5. Save the invoice

### 2. Automated Invoice Creation Rules

Configure automatic invoice creation in Cliniko:
1. Go to **Settings → Billing → Invoice Settings**
2. Set up automatic invoice creation rules based on:
   - Appointment completion
   - Appointment types
   - Service providers
   - Patient groups

### 3. Third-Party Integrations

Use integration platforms for more complex automation:

#### Zapier Integration:
- Trigger: Appointment marked as completed in Cliniko
- Action: Create invoice (requires manual setup in Cliniko first)

#### Pipedream Integration:
- Monitor appointment completions via API polling
- Trigger notifications for manual invoice creation
- Automate follow-up reminders

#### QuickBooks/Xero Integration:
- Sync appointment data to accounting software
- Create invoices in accounting system
- Sync payment status back to Cliniko

## Code Changes Required

### ClinikoClient Class Updates

The following methods have been removed from the ClinikoClient class as they are not supported by the API:

```typescript
// ❌ REMOVED - Not supported by API
// async createInvoice(invoice: any): Promise<Invoice>
// async updateInvoice(id: number, invoice: any): Promise<Invoice>
// async deleteInvoice(id: number): Promise<void>
// async addInvoiceItem(invoiceId: number, item: any): Promise<InvoiceItem>
// async updateInvoiceItem(invoiceId: number, itemId: number, item: any): Promise<InvoiceItem>
// async deleteInvoiceItem(invoiceId: number, itemId: number): Promise<void>

// ✅ AVAILABLE - Read-only operations
async listInvoices(params?: {...}): Promise<ClinikoListResponse<Invoice>>
async getInvoice(id: number): Promise<Invoice>
async getAppointmentInvoices(appointmentId: number): Promise<ClinikoListResponse<Invoice>>
async getPatientInvoices(patientId: number): Promise<ClinikoListResponse<Invoice>>
async listInvoiceItems(invoiceId: number): Promise<ClinikoListResponse<InvoiceItem>>
```

### Updated Demo Tools

The demo tools have been updated to:
1. Generate test patients and appointments successfully
2. Provide clear instructions on how to create invoices manually
3. Check for and display existing invoices (read-only)
4. Include proper rate limiting for API calls

## Workaround Strategies

### For Applications Requiring Invoice Creation:

1. **Hybrid Approach:**
   - Use API to create appointments and manage patients
   - Provide UI guidance for users to create invoices in Cliniko
   - Use API to verify invoice creation and track status

2. **Webhook Alternative:**
   - Since Cliniko lacks webhooks, implement polling:
   - Periodically check for new appointments
   - Alert staff to create corresponding invoices
   - Monitor invoice creation via API reads

3. **Business Process Adjustment:**
   - Configure Cliniko's built-in automation rules
   - Train staff on bulk invoice creation
   - Use appointment notes to track billing requirements

## Best Practices

1. **Set Clear Expectations:**
   - Inform users that invoice creation is manual
   - Provide detailed instructions for Cliniko web interface
   - Document the workflow clearly

2. **Implement Verification:**
   - After manual creation, use API to verify invoices exist
   - Check invoice details match appointment data
   - Monitor for missing invoices

3. **Rate Limiting:**
   - Cliniko API has strict limits (200 requests per 5 minutes)
   - Implement delays between API calls
   - Use batch operations where possible

## Future Considerations

The Cliniko API may add invoice creation capabilities in the future. Monitor:
- [Cliniko API Documentation](https://docs.api.cliniko.com/)
- [GitHub Issues for API Feature Requests](https://github.com/redguava/cliniko-api/issues)
- Cliniko's official announcements for API updates

## Support Resources

- [Cliniko Help - Invoicing & Payments](https://help.cliniko.com/en/collections/107604-invoicing-payments)
- [Cliniko API Documentation](https://docs.api.cliniko.com/)
- [Cliniko Support](https://www.cliniko.com/support/)

---

*Last Updated: 2024*
*Note: This limitation is based on the current Cliniko API v1. Always check the latest API documentation for updates.*