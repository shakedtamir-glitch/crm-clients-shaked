"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={6}
        align="end"
        className={cn(
          "z-50 min-w-[180px] rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl data-[state=open]:animate-fade-in",
          className
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof RadixDropdown.Item>) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-text-1 outline-none transition-colors hover:bg-surface-3 hover:text-text-0 data-[highlighted]:bg-surface-3 data-[highlighted]:text-text-0",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof RadixDropdown.Separator>) {
  return <RadixDropdown.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
