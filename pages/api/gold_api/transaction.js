import { handleTransaction } from '../../../utils/nexusSeamless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 1,
      code: 7777777,
      msg: 'NexusGGR transaction endpoint ready'
    });
  }

  const result = handleTransaction(req.body || {});
  return res.status(200).json(result);
}
