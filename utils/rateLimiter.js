// Very simple in-memory request rate limiter per IP
// Not suitable for multi-instance deployments without shared store (Redis, etc.)
const rateMap = new Map();

function getIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    (req.connection && req.connection.remoteAddress) ||
    'unknown'
  );
}

export function isAllowed(req, limit = 60, windowMs = 60000) {
  const ip = getIp(req);
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (now - rec.start > windowMs) {
    rateMap.set(ip, { count: 1, start: now });
    return true;
  }
  if (rec.count >= limit) {
    return false;
  }
  rec.count += 1;
  return true;
}
