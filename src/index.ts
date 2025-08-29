#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ClinikoClient } from './cliniko-client.js';
import { registerPatientTools } from './tools/patients.js';
import { registerAppointmentTools } from './tools/appointments.js';
import { registerSyntheticDataTools } from './tools/synthetic-data.js';
import { registerEnhancedSyntheticDataTools } from './tools/synthetic-data-enhanced.js';
import { registerInvoiceTools } from './tools/invoices.js';
import { registerDemoInvoiceTools } from './tools/demo-invoice-generation.js';
import { registerResources } from './resources/index.js';

const API_KEY = process.env.CLINIKO_API_KEY;

if (!API_KEY) {
  // Exit silently if no API key - MCP protocol doesn't allow stderr output
  process.exit(1);
}

// Initialize MCP server
const server = new Server(
  {
    name: 'mcp-cliniko',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize Cliniko client
const clinikoClient = new ClinikoClient(API_KEY);

// Track registered tools and resources
const tools = new Map();
const resources = new Map();

// Helper to register tools
const toolRegistry = {
  tool(name: string, schema: any, handler: any) {
    tools.set(name, { schema, handler });
  }
};

// Helper to register resources
const resourceRegistry = {
  resource(uriTemplate: string, options: any, handler: any) {
    resources.set(uriTemplate, { ...options, handler, uriTemplate });
  }
};

// Register all tools
registerPatientTools(toolRegistry, clinikoClient);
registerAppointmentTools(toolRegistry, clinikoClient);
registerSyntheticDataTools(toolRegistry, clinikoClient);
registerEnhancedSyntheticDataTools(toolRegistry, clinikoClient);
registerInvoiceTools(toolRegistry, clinikoClient);
registerDemoInvoiceTools(toolRegistry, clinikoClient);

// Register all resources
registerResources(resourceRegistry, clinikoClient);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolList = Array.from(tools.entries()).map(([name, tool]) => ({
    name,
    description: tool.schema.description || name,
    inputSchema: tool.schema.inputSchema
  }));

  return { tools: toolList };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  const tool = tools.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    // Parse and validate arguments
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
    
    // Call the tool handler
    const result = await tool.handler(parsedArgs);
    return result;
  } catch (error) {
    throw error;
  }
});

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resourceList = Array.from(resources.entries()).map(([uri, resource]) => ({
    uri,
    name: resource.description,
    description: resource.description,
    mimeType: resource.mimeType,
  }));

  return { resources: resourceList };
});

// Handle list prompts request (we don't have prompts, but need to respond)
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: [] };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  // Find matching resource handler
  for (const [template, resource] of resources.entries()) {
    // Simple pattern matching for {id} parameters
    const pattern = template.replace(/\{(\w+)\}/g, '([^/]+)');
    const regex = new RegExp(`^${pattern}$`);
    const match = uri.match(regex);
    
    if (match) {
      const params: any = {};
      const paramNames = template.match(/\{(\w+)\}/g)?.map((p: string) => p.slice(1, -1)) || [];
      paramNames.forEach((name: string, index: number) => {
        params[name] = match[index + 1];
      });
      
      try {
        const result = await resource.handler(params);
        return result;
      } catch (error) {
        throw error;
      }
    }
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Main server loop
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Keep the process running
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

// Start the server
main().catch((error) => {
  process.exit(1);
});