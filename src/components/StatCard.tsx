export default function StatCard({ label, value, tone = "blue" }: { label: string; value: string | number; tone?: "blue" | "green" | "orange" | "red" }) {
  const color = {
    blue: "text-flaggo-blue",
    green: "text-flaggo-green",
    orange: "text-flaggo-orange",
    red: "text-flaggo-red"
  }[tone];
  return (
    <div className="rounded-[22px] border border-flaggo-border bg-white p-4 shadow-sm">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-sm font-bold text-flaggo-muted">{label}</div>
    </div>
  );
}
