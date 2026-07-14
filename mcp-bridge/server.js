import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const app = express();
app.use(cors({ origin: '*' })); // Permite que NexyAI se conecte

let transport;

app.get('/sse', async (req, res) => {
  console.log("Nueva conexión SSE recibida de NexyAI");
  transport = new SSEServerTransport('/message', res);
  await transport.start();
  
  // Aquí inicializamos el cliente stdio hacia Roblox
  const robloxProcess = new StdioClientTransport({
    command: 'cmd.exe',
    args: ['/c', 'cd /d %LOCALAPPDATA%\\Roblox && .\\mcp.bat']
  });
  
  // Proxying de mensajes (muy simplificado)
  // Nota: Para un proxy robusto, se debe interceptar y reenviar JSON-RPC bidireccionalmente.
  // Este es un esqueleto.
});

app.post('/message', async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).send('Transport no encontrado');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Puente Roblox MCP escuchando en http://localhost:${PORT}/sse`);
});
