interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}

export function StatCard({label, value, subtitle, valueColor = 'text-foreground'}: StatCardProps) {
  return (
    <div className="bg-content1 rounded-xl border border-divider p-4 flex flex-col gap-1 h-full">
      <span className="text-[12px] text-foreground-500 font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-[22px] font-medium leading-tight ${valueColor}`}>{value}</span>
      <span className="text-[11px] text-foreground-400 min-h-[14px]">{subtitle ?? ''}</span>
    </div>
  );
}
