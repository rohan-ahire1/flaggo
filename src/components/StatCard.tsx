import Icon, { type IconName } from "./Icon";

export default function StatCard({
  label,
  value,
  tone = "blue",
  icon
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "green" | "orange" | "red";
  icon?: IconName;
}) {
  const color = {
    blue: "text-flaggo-blue",
    green: "text-flaggo-green",
    orange: "text-flaggo-orange",
    red: "text-flaggo-red"
  }[tone];
  return (
    <div className="rounded-[22px] border border-flaggo-border bg-white p-4 shadow-card">
      <div className={`flex items-center gap-1.5 font-display text-2xl font-black ${color}`}>
        {icon && <Icon name={icon} size={18} />}
        {value}
      </div>
      <div className="mt-0.5 text-sm font-bold text-flaggo-muted">{label}</div>
    </div>
  );
}
