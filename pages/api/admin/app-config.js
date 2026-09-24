import { updateAppConfig, getAppConfig, getAllAppConfigs } from '../../../utils/appConfigsStore';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      configs: getAllAppConfigs()
    });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { appId, config } = req.body || {};

    if (!appId || !config) {
      return res.status(400).json({ error: 'appId and config payload are required' });
    }

    const updated = updateAppConfig(appId, config);

    return res.status(200).json({
      success: true,
      message: `Configuration updated live for app ${appId}`,
      config: updated
    });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
