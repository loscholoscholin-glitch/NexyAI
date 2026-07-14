import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class McpService {
  private client: Client | null = null;
  private transport: SSEClientTransport | null = null;
  public isConnected = false;

  async connect(url: string) {
    if (this.isConnected && this.client) return;

    try {
      this.transport = new SSEClientTransport(new URL(url));
      this.client = new Client(
        {
          name: "NexyAI-Client",
          version: "2.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      
      await this.client.connect(this.transport);
      this.isConnected = true;
    } catch (err) {
      this.isConnected = false;
      this.client = null;
      this.transport = null;
      console.error("MCP Connection error:", err);
      throw new Error("No se pudo conectar al servidor MCP. Verifica que esté en línea y permita CORS.");
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
    this.isConnected = false;
    this.client = null;
    this.transport = null;
  }

  async getTools() {
    if (!this.client || !this.isConnected) return [];
    
    try {
      const response = await this.client.request(ListToolsRequestSchema, {});
      return response.tools || [];
    } catch (err) {
      console.error("Error fetching MCP tools:", err);
      return [];
    }
  }

  async callTool(name: string, args: Record<string, unknown>) {
    if (!this.client || !this.isConnected) throw new Error("MCP no está conectado.");
    
    try {
      const response = await this.client.request(CallToolRequestSchema, {
        name,
        arguments: args
      });
      return response;
    } catch (err) {
      console.error(`Error calling MCP tool ${name}:`, err);
      throw err;
    }
  }
}

// Instancia global del servicio MCP
export const mcpGlobalClient = new McpService();
