# Cliniko Invoice Generation Demo

This guide demonstrates how to use the Cliniko MCP server to clear test data, generate patients and appointments, and create invoices for a specific date.

## Prerequisites

1. **Cliniko API Key**: Set your Cliniko API key as an environment variable:
   ```bash
   export CLINIKO_API_KEY="your-api-key-here"
   ```

2. **Cliniko Account Setup**: Ensure your Cliniko account has:
   - At least one practitioner
   - At least one appointment type
   - At least one business location

## Available Demo Tools

### 1. `demo_invoice_generation`
Complete demo that clears test data, generates patients and appointments, then creates and displays invoices.

**Parameters:**
- `target_date` (optional): Date for invoice generation (YYYY-MM-DD format). Defaults to today.
- `num_patients` (optional): Number of test patients to create (1-50, default: 20)
- `num_appointments` (optional): Number of test appointments to create (1-100, default: 40)  
- `clear_existing` (optional): Clear existing test data first (default: true)
- `display_format` (optional): How to display invoices - 'summary', 'detailed', or 'json' (default: 'detailed')

### 2. `display_invoices_for_date`
Display all invoices for a specific date with various formatting options.

**Parameters:**
- `date` (required): Date to display invoices for (YYYY-MM-DD)
- `display_format` (optional): 'summary', 'detailed', or 'json' (default: 'detailed')
- `status_filter` (optional): Filter by status - 'all', 'draft', 'awaiting_payment', 'paid', 'void' (default: 'all')

## Usage Examples

### Example 1: Basic Demo with Defaults
Generate 20 patients, 40 appointments, and create invoices for today:

```json
{
  "tool": "demo_invoice_generation"
}
```

### Example 2: Custom Demo for Specific Date
Generate test data and invoices for a specific date:

```json
{
  "tool": "demo_invoice_generation",
  "arguments": {
    "target_date": "2025-01-15",
    "num_patients": 20,
    "num_appointments": 40,
    "clear_existing": true,
    "display_format": "detailed"
  }
}
```

### Example 3: Quick Test with Summary
Small test with just 5 patients and 10 appointments:

```json
{
  "tool": "demo_invoice_generation",
  "arguments": {
    "num_patients": 5,
    "num_appointments": 10,
    "display_format": "summary"
  }
}
```

### Example 4: Display Existing Invoices
View all invoices for a specific date:

```json
{
  "tool": "display_invoices_for_date",
  "arguments": {
    "date": "2025-01-15",
    "display_format": "detailed"
  }
}
```

### Example 5: Filter Draft Invoices
View only draft invoices for a date:

```json
{
  "tool": "display_invoices_for_date",
  "arguments": {
    "date": "2025-01-15",
    "status_filter": "draft",
    "display_format": "summary"
  }
}
```

## Demo Workflow

The `demo_invoice_generation` tool performs the following steps:

1. **Clear Test Data** (if enabled):
   - Removes all test patients (those with @test.cliniko.com or @gmail.com emails)
   - Cancels and removes associated appointments
   
2. **Fetch Reference Data**:
   - Gets practitioners, appointment types, and business locations

3. **Generate Test Patients**:
   - Creates specified number of patients with test emails
   - Uses realistic Australian names and demographics

4. **Generate Test Appointments**:
   - Creates appointments distributed throughout the target date
   - Appointments scheduled between 9 AM and 5 PM
   - Randomly assigns practitioners and appointment types

5. **Create Invoices**:
   - Groups appointments by patient
   - Creates one invoice per patient for all their appointments
   - Adds appropriate line items with descriptions and prices

6. **Display Results**:
   - Shows summary or detailed view of created invoices
   - Includes total values and outstanding amounts

## Output Formats

### Summary Format
Provides a high-level overview:
- Number of patients, appointments, and invoices created
- Total invoice value
- Execution time
- Any warnings or errors

### Detailed Format  
Includes everything from summary plus:
- Individual invoice details (patient, practitioner, status, total)
- Line items for each invoice
- Outstanding amounts
- Next steps recommendations

### JSON Format
Raw JSON output for programmatic processing

## Test Data Characteristics

- **Patient Emails**: All test patients have emails ending in `@test.cliniko.com`
- **Patient Names**: Last names include "_TEST" suffix for easy identification
- **Appointment Notes**: Include "Test appointment for invoice demo"
- **Invoice Notes**: Include "Invoice for appointments on [date]"

## Cleanup

The demo automatically cleans up test data when `clear_existing` is true. You can also manually clean up using the existing `cleanup_comprehensive_test_data` tool:

```json
{
  "tool": "cleanup_comprehensive_test_data",
  "arguments": {
    "delete_patients": true,
    "delete_appointments": true,
    "delete_invoices": true,
    "delete_all_test_data": true
  }
}
```

## Troubleshooting

### Common Issues

1. **"Missing required data" error**: 
   - Ensure your Cliniko account has practitioners, appointment types, and business locations configured

2. **"Failed to create patient" errors**:
   - Check API key permissions
   - Verify Cliniko API rate limits haven't been exceeded

3. **No invoices generated**:
   - Verify appointments were created successfully
   - Check that target date matches appointment dates

4. **Cleanup fails**:
   - Some test data may be referenced by other records
   - Try running cleanup multiple times or manually delete through Cliniko UI

## Integration with Claude Desktop

To use these tools in Claude Desktop:

1. Add the MCP server to your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "cliniko": {
         "command": "node",
         "args": ["/path/to/mcp-cliniko/dist/index.js"],
         "env": {
           "CLINIKO_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

2. Restart Claude Desktop to load the MCP server

3. Use the tools by asking Claude to:
   - "Run the Cliniko invoice demo"
   - "Generate test invoices for January 15th"
   - "Show me all draft invoices from today"

## Security Notes

- Test data uses obviously fake email domains (@test.cliniko.com)
- Patient last names include "_TEST" suffix
- All test data can be identified and cleaned up programmatically
- Never use real patient data for testing
- Always use a test/sandbox Cliniko account for demos

## Additional Tools

The Cliniko MCP server also provides many other tools:

- **Patient Management**: create, update, list, search patients
- **Appointment Management**: create, update, cancel appointments
- **Invoice Management**: create, update, list invoices and payments
- **Synthetic Data**: generate comprehensive test data across all categories

Use `list_tools` to see all available tools and their descriptions.