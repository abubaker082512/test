// Direct physical endpoint for SoftAggregator callback fallback (/sg/callback)
// Ensures that even if rewrites or proxy layers fail, SoftAggregator gets a 200 JSON reply.
import handler from '../api/softaggregator/callback.js';

export async function getServerSideProps(context) {
  const { req, res } = context;
  try {
    await handler(req, res);
  } catch (err) {
    if (!res.writableEnded) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ error: 2, balance: 0, message: err.message }));
    }
  }
  return { props: {} };
}

export default function SgCallbackPage() {
  return null;
}
