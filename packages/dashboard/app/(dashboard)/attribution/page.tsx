'use client';

import { useState, useEffect } from 'react';
import { KpiCard, Panel, AsciiHr, Tag, DonutChart, AsciiBars, ToastHost } from '@/components/terminal';
import { api, AttributionResponse, AttributionCampaign } from '@/lib/api';

export default function AttributionPage() {
  const [data, setData] = useState<AttributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAttributionAnalytics();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const installData = (data?.installs_by_campaign ?? []).map(c => ({
    value: c.campaign_id ?? 'Unattributed',
    count: c.install_count ?? 0,
  })).filter(c => c.count > 0);

  const purchaseData = (data?.purchases_by_campaign ?? []).map(c => ({
    value: c.campaign_id ?? 'Unattributed',
    count: c.purchase_count ?? 0,
  })).filter(c => c.count > 0);

  const totalInstalls = installData.reduce((s, c) => s + c.count, 0);
  const totalPurchases = purchaseData.reduce((s, c) => s + c.count, 0);

  // Build combined campaign table
  const allCampaigns = Array.from(new Set([
    ...installData.map(c => c.value),
    ...purchaseData.map(c => c.value),
  ]));

  const campaignRows = allCampaigns.map(id => ({
    campaign: id,
    installs: installData.find(c => c.value === id)?.count ?? 0,
    purchases: purchaseData.find(c => c.value === id)?.count ?? 0,
  })).sort((a, b) => b.installs - a.installs);

  const maxInstalls = Math.max(1, ...campaignRows.map(r => r.installs));

  return (
    <>
      <ToastHost />
      <div>
        <div className="mh-page-head">
          <div>
            <div className="crumb">minihog · attribution</div>
            <h1>Campaign Attribution</h1>
            <div className="subtitle">Last-click attribution for installs and purchases</div>
          </div>
          <button className="mh-btn ghost" onClick={loadData} disabled={loading}>
            {loading ? <span className="mh-loading">refreshing</span> : '↻ Refresh'}
          </button>
        </div>

        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--fg-3)' }}>
            <span className="mh-loading">loading attribution</span>
          </div>
        )}

        {error && (
          <div className="mh-tag bad" style={{ padding: '10px 14px', fontSize: 12, marginBottom: 20 }}>
            × {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPI row */}
            <div className="mh-kpi-grid" style={{ marginBottom: 20 }}>
              <KpiCard
                label="Attributed Installs"
                value={totalInstalls}
                glyph="⬇"
              />
              <KpiCard
                label="Attributed Purchases"
                value={totalPurchases}
                glyph="⬡"
              />
              <KpiCard
                label="Active Campaigns"
                value={allCampaigns.length}
                glyph="↬"
              />
            </div>

            <AsciiHr label="campaign breakdown" />

            {/* Campaign table */}
            <Panel
              title="Campaign Performance"
              meta={`${allCampaigns.length} campaigns`}
              right={<Tag kind="acc">last-click · 24h window</Tag>}
              style={{ marginBottom: 16 }}
            >
              {campaignRows.length === 0 ? (
                <div className="mh-muted-card">No attributed campaigns yet. Track clicks via POST /click.</div>
              ) : (
                <table className="mh-t">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th className="num">Installs</th>
                      <th className="num">Purchases</th>
                      <th style={{ width: 160 }}>Install Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignRows.map(row => {
                      const barLen = Math.max(1, Math.round((row.installs / maxInstalls) * 20));
                      return (
                        <tr key={row.campaign}>
                          <td style={{ color: 'var(--fg-hi)', fontWeight: 600 }}>{row.campaign}</td>
                          <td className="num" style={{ color: 'var(--acc)', fontWeight: 700 }}>
                            {row.installs.toLocaleString('en-US')}
                          </td>
                          <td className="num">
                            {row.purchases.toLocaleString('en-US')}
                          </td>
                          <td>
                            <span style={{ color: 'var(--acc)', letterSpacing: -1, fontSize: 12 }}>
                              {'█'.repeat(barLen)}
                            </span>
                            <span style={{ color: 'var(--bd-2)', letterSpacing: -1, fontSize: 12 }}>
                              {'░'.repeat(20 - barLen)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Panel>

            {/* Charts */}
            {(installData.length > 0 || purchaseData.length > 0) && (
              <>
                <AsciiHr label="distribution charts" />
                <div className="mh-grid-2" style={{ gap: 16 }}>
                  <Panel title="Installs by Campaign" meta={`total: ${totalInstalls.toLocaleString('en-US')}`}>
                    {installData.length > 0 ? (
                      <DonutChart
                        rows={installData.slice(0, 6)}
                        valueKey="count"
                        nameKey="value"
                        size={160}
                      />
                    ) : (
                      <div className="mh-muted-card">No install data.</div>
                    )}
                  </Panel>
                  <Panel title="Purchases by Campaign" meta={`total: ${totalPurchases.toLocaleString('en-US')}`}>
                    {purchaseData.length > 0 ? (
                      <DonutChart
                        rows={purchaseData.slice(0, 6)}
                        valueKey="count"
                        nameKey="value"
                        size={160}
                      />
                    ) : (
                      <div className="mh-muted-card">No purchase data.</div>
                    )}
                  </Panel>
                </div>

                {installData.length > 0 && (
                  <>
                    <AsciiHr label="install volume" />
                    <Panel title="Install Bar Chart" meta="by campaign">
                      <AsciiBars
                        rows={installData.slice(0, 8)}
                        valueKey="count"
                        nameKey="value"
                        barWidth={32}
                      />
                    </Panel>
                  </>
                )}
              </>
            )}

            <AsciiHr label="notes" />

            <Panel title="Attribution Notes" meta="last-click model">
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span style={{ color: 'var(--acc)', marginRight: 8 }}>▸</span>
                  Attribution uses a <span style={{ color: 'var(--fg-hi)' }}>last-click model</span> with a configurable lookback window (default 24h).
                </div>
                <div>
                  <span style={{ color: 'var(--acc)', marginRight: 8 }}>▸</span>
                  Track ad clicks via <code style={{ background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 2, color: 'var(--fg-hi)', fontSize: 11 }}>POST /click &#123; device_id, campaign_id &#125;</code>
                </div>
                <div>
                  <span style={{ color: 'var(--acc)', marginRight: 8 }}>▸</span>
                  Track installs via <code style={{ background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 2, color: 'var(--fg-hi)', fontSize: 11 }}>POST /install &#123; device_id &#125;</code> — attribution runs automatically.
                </div>
                <div>
                  <span style={{ color: 'var(--fg-3)', marginRight: 8 }}>i</span>
                  <span style={{ color: 'var(--fg-3)' }}>
                    Configure <code style={{ fontSize: 11 }}>ATTRIBUTION_WINDOW_HOURS</code> in your API environment to change the lookback period.
                  </span>
                </div>
              </div>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
