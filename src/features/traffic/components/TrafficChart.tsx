import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AggregatedPageData } from "@/types";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";

interface TrafficChartProps {
  data: AggregatedPageData[];
  dateHeaders: string[];
  stats: { sessions: number; users: number; pageviews: number };
}

const COLORS = ["#2563eb", "#8b5cf6", "#10b981"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-lg shadow-lg">
        <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs font-medium mb-1"
            style={{ color: entry.color }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.name}: {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function TrafficChart({ data, dateHeaders, stats }: TrafficChartProps) {
  const chartData = useMemo(() => {
    const dailyMap: Record<string, any> = {};
    [...dateHeaders].reverse().forEach((date) => {
      dailyMap[date] = {
        name: format(parseISO(date), "MMM dd"),
        sessions: 0,
        users: 0,
      };
    });
    data.forEach((page) => {
      page.dailyTrend.forEach((day) => {
        if (dailyMap[day.date]) {
          dailyMap[day.date].sessions += day.sessions;
          dailyMap[day.date].users += day.users;
        }
      });
    });
    return Object.values(dailyMap);
  }, [data, dateHeaders]);

  const pieData = [
    { name: "Sessions", value: stats.sessions },
    { name: "Users", value: stats.users },
    { name: "Views", value: stats.pageviews },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Traffic Trend
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f3f4f6"
                strokeOpacity={0.2}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#colorSessions)"
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Metric Distribution
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Ratio of Sessions vs Users vs Views
        </p>
        <div className="flex-1 min-h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.sessions.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 uppercase font-semibold">
              Sessions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
