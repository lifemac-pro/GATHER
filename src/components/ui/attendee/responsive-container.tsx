"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidthOnMobile?: boolean;
}

/**
 * A responsive container component that adjusts padding and width based on screen size
 */
export function ResponsiveContainer({
  children,
  className,
  fullWidthOnMobile = true,
}: ResponsiveContainerProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 md:py-8",
        fullWidthOnMobile ? "lg:container" : "container",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A responsive grid component that adjusts columns based on screen size
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 },
}: {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}) {
  const getGridCols = () => {
    const { default: defaultCols, sm, md, lg, xl } = cols;
    
    return cn(
      `grid grid-cols-${defaultCols} gap-4`,
      sm && `sm:grid-cols-${sm}`,
      md && `md:grid-cols-${md}`,
      lg && `lg:grid-cols-${lg}`,
      xl && `xl:grid-cols-${xl}`
    );
  };

  return (
    <div className={cn(getGridCols(), className)}>
      {children}
    </div>
  );
}

/**
 * A responsive section component with proper spacing
 */
export function ResponsiveSection({
  children,
  className,
  title,
  description,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
