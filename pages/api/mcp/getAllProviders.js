// MCP-based proxy for RapidAPI providers via mcp-remote
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;
  if (!apiKey || !apiHost) {
    return res.status(500).json({ error: 'RapidAPI credentials not configured' });
  }

  // MCP command via npx mcp-remote https://mcp.rapidapi.com --header x-api-host: <host> --header x-api-key: <key>
  const args = [
    'mcp-remote',
    'https://mcp.rapidapi.com',
    '--header',
    `x-api-host: ${apiHost}`,
    '--header',
    `x-api-key: ${apiKey}`,
  ];

  try {
    // Run the MCP remote command and capture stdout
    const { stdout } = await execFileAsync('npx', args);
    // Expect JSON; if not, return as text
    let data;
    try { data = JSON.parse(stdout); } catch {
      data = stdout;
    }
    res.status(200).json(data);
  } catch (err) {
    console.error('MCP getAllProviders error:', err);
    res.status(500).json({ error: err.message || 'MCP command failed' });
  }
}
