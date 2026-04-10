import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground",
        className,
      )}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge };
