import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileQuestion, Search, Package, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: "default" | "search" | "error";
}

const variantConfig = {
  default: {
    icon: Package,
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted/30",
  },
  search: {
    icon: Search,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

/**
 * EmptyState component - Display when no data is available
 * 
 * @example
 * <EmptyState
 *   title="Tidak ada booking"
 *   description="Anda belum memiliki booking aktif"
 *   action={{
 *     label: "Cari Properti",
 *     onClick: () => router.push("/properties")
 *   }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center",
        config.bgColor,
        className
      )}
    >
      <div className={cn("mb-4 rounded-full bg-background p-3", config.iconColor)}>
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

