import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { mockAttribution } from '@/lib/mock-data';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

const COLORS = ['hsl(210,100%,55%)', 'hsl(190,90%,50%)', 'hsl(160,80%,45%)', 'hsl(280,70%,55%)', 'hsl(30,90%,55%)'];

const Attribution = () => {
  const [, setRefresh] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attribution & Campaign Analytics</h1>
        <Button variant="outline" size="sm" onClick={() => setRefresh(r => r + 1)}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installs */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Installs by Campaign</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={mockAttribution.installs_by_campaign} dataKey="install_count" nameKey="campaign_id" cx="50%" cy="50%" outerRadius={90} label={({ campaign_id }) => campaign_id}>
                {mockAttribution.installs_by_campaign.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {mockAttribution.installs_by_campaign.map((c, i) => (
              <div key={c.campaign_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-mono">{c.campaign_id}</span>
                </div>
                <span className="font-mono font-bold">{c.install_count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchases */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Purchases by Campaign</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={mockAttribution.purchases_by_campaign} dataKey="purchase_count" nameKey="campaign_id" cx="50%" cy="50%" outerRadius={90} label={({ campaign_id }) => campaign_id}>
                {mockAttribution.purchases_by_campaign.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220,22%,10%)', border: '1px solid hsl(220,18%,18%)', borderRadius: '8px', color: 'hsl(210,20%,92%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {mockAttribution.purchases_by_campaign.map((c, i) => (
              <div key={c.campaign_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-mono">{c.campaign_id}</span>
                </div>
                <span className="font-mono font-bold">{c.purchase_count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attribution;
