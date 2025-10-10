import { cn } from "@/lib/utils";

interface PriceProps {
  amount: number;
  className?: string;
  showPrefix?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Price component - Format currency to IDR
 * 
 * @example
 * <Price amount={1500000} />
 * // Output: Rp 1.500.000
 * 
 * <Price amount={1500000} showPrefix={false} />
 * // Output: 1.500.000
 */
export function Price({ amount, className, showPrefix = true, size = "md" }: PriceProps) {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Remove "Rp" prefix if showPrefix is false
  const display = showPrefix ? formatted : formatted.replace("Rp", "").trim();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span className={cn("font-semibold tabular-nums", sizeClasses[size], className)}>
      {display}
    </span>
  );
}

/**
 * Format number to IDR string (utility function)
 */
export function formatIDR(amount: number, showPrefix = true): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return showPrefix ? formatted : formatted.replace("Rp", "").trim();
}

