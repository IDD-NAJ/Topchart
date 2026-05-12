import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function QuickActionCard({ title, description, icon: Icon, onClick }: QuickActionCardProps) {
  return (
    <Card className="hover:border-slate-300 transition-colors cursor-pointer border-slate-200" onClick={onClick}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 rounded-lg">
            <Icon className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
