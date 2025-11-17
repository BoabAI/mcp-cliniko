# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

```bash
# Build the TypeScript project
npm run build

# Run in development mode (with hot reload)
npm run dev

# Test with MCP Inspector
npm run inspect

# Run demo workflow (patients → appointments → invoices)
node run-demo-safe.js

# Run specific tests
node test-invoice-readonly.js
```

## Critical Architecture Knowledge

### Invoice API is READ-ONLY
**⚠️ MOST IMPORTANT:** The Cliniko API does NOT support creating, updating, or deleting invoices. This is a fundamental API limitation, not a bug in our code. Any invoice creation must happen through:
1. Cliniko web interface
2. Automated rules in Cliniko settings
3. Third-party integrations that use Cliniko's internal mechanisms

When users ask about invoice creation, always explain this limitation and offer alternatives.

### MCP Server Architecture
This is a Model Context Protocol (MCP) server that bridges Claude Desktop to Cliniko's API. The flow is:
1. Claude Desktop → MCP request → `src/index.ts` (entry point)
2. Tool handler → `src/cliniko-client.ts` (API wrapper)
3. Cliniko API → Response → Format → Claude Desktop

The server uses stdio transport (stdin/stdout) for communication.

### Authentication Pattern
```typescript
// Always use Basic Auth with API key as username
headers: {
  'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
  'Accept': 'application/json',
  'User-Agent': 'MCP-Cliniko/1.0'
}
```

### Tool Registration Pattern
All tools follow this structure in `src/tools/*.ts`:
```typescript
export function register<ToolName>(registry: ToolRegistry) {
  registry.registerTool(
    'tool_name',
    zodSchema,
    async (args) => {
      // Implementation using clinikoClient
    }
  );
}
```

## Key Implementation Details

### Rate Limiting
- Cliniko API: 200 requests per minute
- Demo tools implement delays: `await new Promise(resolve => setTimeout(resolve, 300))`
- No built-in client-side rate limiting in `cliniko-client.ts`

### Error Handling Pattern
```typescript
try {
  const result = await clinikoClient.method();
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error.message || 'Operation failed'
  };
}
```

### Pagination Pattern
All list endpoints support:
- `per_page`: Number of items (max 100)
- `page`: Page number
- `q`: Query string for searching

### Date/Time Handling
- All dates in ISO 8601 format: `2024-01-15T09:00:00+11:00`
- Cliniko uses business timezone (usually Australian)
- Availability checks require timezone-aware comparisons

## Common Development Tasks

### Adding a New Tool
1. Create file in `src/tools/your-tool.ts`
2. Define Zod schema for validation
3. Implement the tool handler
4. Export registration function
5. Import and register in `src/index.ts`:
   ```typescript
   import { registerYourTool } from './tools/your-tool';
   registerYourTool(toolRegistry);
   ```

### Testing API Endpoints
Use the MCP Inspector for interactive testing:
```bash
npm run inspect
# Then use the web interface to test tools with JSON payloads
```

### Debugging API Calls
The `cliniko-client.ts` already includes comprehensive error details. Check:
- Response status codes
- Error messages from Cliniko
- Rate limit headers in responses

## Important File Locations

- **API Client:** `src/cliniko-client.ts` - All API methods
- **Type Definitions:** `src/types.ts` - TypeScript interfaces
- **Tool Implementations:** `src/tools/*.ts` - MCP tool handlers
- **Demo Workflows:** `run-demo-safe.js` - Full testing workflow
- **Environment Config:** `.env` - API key configuration

## Known Constraints & Workarounds

### Invoice Creation Workaround
Since we can't create invoices via API:
1. Generate appointments first
2. Fetch the auto-generated invoices
3. Display invoice data for review
4. User must finalize in Cliniko web UI

### Test Data Management
The synthetic data generator creates realistic Australian healthcare data:
- Medicare numbers follow valid format
- Phone numbers use Australian patterns
- Addresses use real Australian suburbs
- Names from curated Australian lists

Always clean up test data after testing:
```javascript
// Demo tools include cleanup
cleanupBeforeDemo: true  // Removes all test patients first
```

## Integration Points

### Claude Desktop Config
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "cliniko": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "CLINIKO_API_KEY": "your-key-your-email@example.com"
      }
    }
  }
}
```

### Environment Variables
Required: `CLINIKO_API_KEY` in format `apikey-useremail@example.com`

## Testing Checklist

When modifying core functionality:
1. [ ] Run `npm run build` - TypeScript compiles without errors
2. [ ] Run `npm run inspect` - MCP Inspector can list tools
3. [ ] Test with `run-demo-safe.js` - Full workflow executes
4. [ ] Verify rate limiting delays are present
5. [ ] Check error messages don't expose API keys