import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  className?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, trend, className }) => {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 animate-fade-in", className)}>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground font-mono">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
};

export default KpiCard;
