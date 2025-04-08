import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <Card className="hover:border-[#00b0a6]/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#B0B8C5]">{title}</p>
            <p className="mt-2 text-3xl font-bold text-[#072446]">{value}</p>
            {description && (
              <p className="mt-1 text-sm text-[#B0B8C5]">{description}</p>
            )}
            {trend && (
              <p
                className={`mt-1 text-sm ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "+" : "-"}
                {trend.value}% from last month
              </p>
            )}
          </div>
          <div className="rounded-full bg-[#072446] p-3 text-[#00b0a6]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
