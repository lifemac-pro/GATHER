import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  value?: string | number;
  icon?: React.ReactNode;
  color?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, value, icon, color, ...props }, ref) => (
    <div
  ref={ref}
  className={cn(
    "rounded-lg border shadow-sm transition-all hover:shadow-md p-3 md:p-4",
    "bg-white dark:bg-[#0A2A4A] border-gray-200 dark:border-gray-700",
    className
  )}
  {...props}
>

      {title && (
        <div className="flex flex-row items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>

          {icon && <div className={`p-2 rounded-full text-white ${color}`}>{icon}</div>}

        </div>
      )}
      {value && <p className="text-xl font-bold mt-1">{value}</p>}

      {props.children}
    </div>
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-4 md:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg md:text-xl", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm md:text-base text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 md:p-6 flex flex-col space-y-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center justify-between p-4 md:p-6", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
