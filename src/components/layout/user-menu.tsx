"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 pr-2 outline-none hover:bg-surface-2">
        <Avatar name={name} size={30} />
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-text-1 sm:inline">
          {name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="px-2.5 py-2">
          <p className="truncate text-[13px] font-medium text-text-0">{name}</p>
          <p className="truncate text-[12px] text-text-3">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon className="h-3.5 w-3.5" /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-danger hover:text-danger"
          onSelect={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
