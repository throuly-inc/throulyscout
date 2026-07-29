import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/calculator";

interface Point {
  month: number;
  balance: number;
  goal: number;
}

interface Props {
  data: Point[];
  goal: number;
  currentSavings: number;
}

const fmtAxis = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

export function TrajectoryChart({ data, goal, currentSavings }: Props) {
  return (
    <div className="w-full h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(m) => (m % 6 === 0 ? `${m}mo` : "")}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtAxis}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => [formatCurrency(v), "Balance"]}
            labelFormatter={(m) => `Month ${m}`}
          />
          {goal > 0 && (
            <ReferenceLine
              y={goal}
              stroke="hsl(var(--success))"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${formatCurrency(goal)}`,
                position: "insideTopRight",
                fill: "hsl(var(--success))",
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#savingsFill)"
          />
          <ReferenceDot
            x={0}
            y={currentSavings}
            r={4}
            fill="hsl(var(--accent))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
