import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Section component - Wrapper for page sections with optional title and action
 * 
 * @example
 * <Section
 *   title="Properti Pilihan"
 *   description="Rekomendasi kos terbaik untuk Anda"
 *   action={<Button>Lihat Semua</Button>}
 * >
 *   <PropertyList />
 * </Section>
 */
export function Section({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className={cn("flex items-start justify-between gap-4", headerClassName)}>
          {title && (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

