import { getAppConfig, getAllAppConfigs } from '../../utils/appConfigsStore';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { appId, all } = req.query;

    if (all === 'true') {
      return res.status(200).json({
        success: true,
        configs: getAllAppConfigs()
      });
    }

    const config = getAppConfig(appId || 'winxpro');
    return res.status(200).json({
      success: true,
      config
    });
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
