# MCP Cliniko Server

A Model Context Protocol (MCP) server that provides integration with the Cliniko API for healthcare practice management.

## Features

### Tools (Actions)
- **Patient Management**
  - `list_patients` - Search and list patients
  - `get_patient` - Get patient by ID
  - `create_patient` - Create new patient
  - `update_patient` - Update patient details
  - `delete_patient` - Archive patient

- **Appointment Management**
  - `list_appointments` - Search and list appointments
  - `get_appointment` - Get appointment by ID
  - `create_appointment` - Book new appointment
  - `update_appointment` - Modify appointment
  - `cancel_appointment` - Cancel appointment
  - `delete_appointment` - Delete appointment
  - `get_available_times` - Get practitioner availability

- **Invoice Management**
  - `list_invoices` - List and filter invoices
  - `get_invoice` - Get invoice details
  - `create_invoice` - Create new invoice
  - `update_invoice` - Update invoice status or details
  - `delete_invoice` - Delete draft invoice
  
- **Invoice Items**
  - `list_invoice_items` - List items on an invoice
  - `add_invoice_item` - Add item to invoice
  - `update_invoice_item` - Modify invoice item
  - `delete_invoice_item` - Remove item from invoice

- **Payment Processing**
  - `list_payments` - List payments with filtering
  - `create_payment` - Record a payment
  - `delete_payment` - Delete payment record

- **Products & Services**
  - `list_products` - List billable products/services
  - `get_product` - Get product details
  - `create_product` - Create new product/service
  
- **Tax Configuration**
  - `list_taxes` - List available tax rates
  - `get_tax` - Get tax details

- **Complex Workflows**
  - `create_invoice_from_appointments` - Generate invoices from appointments
  - `bulk_invoice_generation` - Bulk create invoices for date range
  - `list_patient_cases` - List patient cases
  - `list_invoices_for_case` - Get invoices for a case

- **Supporting Tools**
  - `list_practitioners` - List all practitioners
  - `list_appointment_types` - List appointment types
  - `list_businesses` - List businesses

- **Test Data**
  - `generate_test_data` - Generate synthetic Australian healthcare data
  - `cleanup_test_data` - Remove test patients

### Resources (Data Access)
- `patient://{id}` - Individual patient data
- `patients://list` - All patients
- `appointment://{id}` - Individual appointment
- `appointments://list` - All appointments
- `appointments://today` - Today's appointments
- `practitioners://list` - All practitioners
- `businesses://list` - All businesses
- `appointment-types://list` - All appointment types

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-cliniko.git
cd mcp-cliniko
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Cliniko API key:
```bash
cp .env.example .env
# Edit .env and add your Cliniko API key
```

4. Build the project:
```bash
npm run build
```

## Configuration

### Environment Variables
- `CLINIKO_API_KEY` - Your Cliniko API key (required)

### Getting a Cliniko API Key
1. Log into your Cliniko account
2. Go to Settings → Integrations → API Keys
3. Create a new API key
4. Copy the key to your `.env` file

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Testing with MCP Inspector
```bash
npm run inspect
```

### Integration with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

## Examples

### Using Tools

**List Patients:**
```json
{
  "tool": "list_patients",
  "arguments": {
    "q": "Smith",
    "per_page": 10
  }
}
```

**Create Patient:**
```json
{
  "tool": "create_patient",
  "arguments": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "0412345678",
    "date_of_birth": "1980-01-15",
    "medicare_number": "1234567890"
  }
}
```

**Book Appointment:**
```json
{
  "tool": "create_appointment",
  "arguments": {
    "starts_at": "2024-01-20T10:00:00Z",
    "patient_id": 123,
    "practitioner_id": 456,
    "appointment_type_id": 789,
    "business_id": 101
  }
}
```

**Generate Test Data:**
```json
{
  "tool": "generate_test_data",
  "arguments": {
    "num_patients": 5,
    "num_appointments": 10,
    "days_ahead": 7
  }
}
```

### Using Resources

Resources provide read-only access to Cliniko data:

- `patient://123` - Get patient with ID 123
- `patients://list` - List all patients
- `appointments://today` - Get today's appointments

## API Rate Limits

Cliniko API has a rate limit of 200 requests per minute. The server does not implement rate limiting internally, so be mindful of this limit when making bulk operations.

## Error Handling

The server uses standard HTTP error conventions:
- 400 - Bad Request
- 401 - Unauthorized (check API key)
- 404 - Resource not found
- 429 - Rate limit exceeded
- 500 - Internal server error

## Development

### Project Structure
```
mcp-cliniko/
├── src/
│   ├── index.ts              # Main server
│   ├── cliniko-client.ts     # API client
│   ├── types.ts              # TypeScript types
│   ├── tools/                # MCP tools
│   │   ├── patients.ts
│   │   ├── appointments.ts
│   │   └── synthetic-data.ts
│   └── resources/            # MCP resources
│       └── index.ts
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env
```

### Building
```bash
npm run build
```

### Type Checking
```bash
npx tsc --noEmit
```

## License

MIT

## Support

For Cliniko API documentation, visit: https://docs.api.cliniko.com/

For MCP documentation, visit: https://modelcontextprotocol.io/# mcp-cliniko
