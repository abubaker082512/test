import React, { useEffect, useState } from 'react'

export default function AdminPanel() {
  const [health, setHealth] = useState(null);
  const [providers, setProviders] = useState(0);
  const [games, setGames] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const h = await fetch('/api/rapid/health');
        const healthJson = await h.json();
        setHealth(healthJson);
        const p = await fetch('/api/rapid/getAllProviders');
        const pData = await p.json();
        const countP = (Array.isArray(pData?.providers) ? pData.providers.length : Array.isArray(pData?.data) ? pData.data.length : 0);
        setProviders(countP);
        const g = await fetch('/api/rapid/getAllGamesByProvider?provider=SPRIBE');
        const gData = await g.json();
        const countG = Array.isArray(gData?.data) ? gData.data.length : 0;
        setGames(countG);
      } catch (e) {
        console.error('AdminPanel fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Telemetry / stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await fetch('/api/rapid/stats');
        const s = await r.json();
        setStats(s);
      } catch (e) {
        console.error('Failed to fetch telemetry stats', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="admin-panel">
      <h2>Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Health</div>
          <div className="stat-value">{health?.status ?? 'loading...'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Providers</div>
          <div className="stat-value">{providers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Games</div>
          <div className="stat-value">{games}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{stats?.totalRequests ?? 0}</div>
        </div>
      </div>
      {loading && <div>Loading…</div>}
      <section className="telemetry-section" aria-label="Telemetry Details" style={{ marginTop: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: '#ccc' }}>Telemetry</h3>
        {stats ? (
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#ddd' }}>
            Avg duration: {Math.round(stats.avgDurationMs)} ms
            <br />
            Per-endpoint:
            <div style={{ marginTop: 6 }}>
              {Object.entries(stats.perEndpoint || {}).length === 0 && <span>(no endpoint data)</span>}
              {Object.entries(stats.perEndpoint || {}).map(([ep, d]) => (
                <div key={ep}>{ep}: {d.requests} reqs, {d.success} successes, {d.errors} errors</div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#ccc' }}>Fetching telemetry data…</div>
        )}
      </section>
    </div>
  )
}
