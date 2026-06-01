// MCP-based proxy for RapidAPI: Get all games by provider via mcp-remote
import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const provider = req.query.provider || 'SPRIBE';
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;
  if (!apiKey || !apiHost) {
    return res.status(500).json({ error: 'RapidAPI credentials not configured' });
  }

  const args = [
    'mcp-remote',
    'https://mcp.rapidapi.com',
    '--header',
    `x-api-host: ${apiHost}`,
    '--header',
    `x-api-key: ${apiKey}`,
  ];

  // The provider can be passed to the MCP layer via a subsequent endpoint; if MCP supports query string, adapt here
  try {
    const { stdout } = await execFileAsync('npx', args);
    let data;
    try { data = JSON.parse(stdout); } catch {
      data = stdout;
    }
    res.status(200).json(data);
  } catch (err) {
    console.error('MCP getAllGamesByProvider error:', err);
    res.status(500).json({ error: err.message || 'MCP command failed' });
  }
}
