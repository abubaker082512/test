import { getStats } from '../../../utils/telemetry';

export default function handler(req, res) {
  const stats = getStats ? getStats() : {
    totalRequests: 0,
    success: 0,
    errors: 0,
    avgDurationMs: 0,
    perEndpoint: {}
  };
  res.status(200).json(stats);
}
