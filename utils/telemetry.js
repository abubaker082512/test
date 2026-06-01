// Lightweight in-memory telemetry for API usage
export const telemetry = {
  totalRequests: 0,
  success: 0,
  errors: 0,
  totalDurationMs: 0,
  perEndpoint: {}
};

export function record(endpoint, status, durationMs) {
  telemetry.totalRequests += 1;
  telemetry.totalDurationMs += (durationMs || 0);
  if (status === 'success' || status === 'ok') {
    telemetry.success += 1;
  } else {
    telemetry.errors += 1;
  }
  if (!telemetry.perEndpoint[endpoint]) telemetry.perEndpoint[endpoint] = { requests: 0, success: 0, errors: 0, duration: 0 };
  const e = telemetry.perEndpoint[endpoint];
  e.requests += 1;
  if (status === 'success' || status === 'ok') e.success += 1; else e.errors += 1;
  e.duration += (durationMs || 0);
}

export function getStats() {
  const avg = telemetry.totalRequests ? (telemetry.totalDurationMs / telemetry.totalRequests) : 0;
  return {
    totalRequests: telemetry.totalRequests,
    success: telemetry.success,
    errors: telemetry.errors,
    avgDurationMs: avg,
    perEndpoint: telemetry.perEndpoint,
  };
}
