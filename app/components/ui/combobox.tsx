"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export interface ComboboxItem {
  value: string;
  label: string;
  sublabel?: string;
}

interface ComboboxProps {
  items: ComboboxItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  accentColor?: "blue" | "orange" | "purple" | "emerald";
}

const accentClasses = {
  blue: {
    ring: "focus-visible:ring-blue-500/20",
    border: "focus-visible:border-blue-500/50",
    selected: "bg-blue-50 dark:bg-blue-900/20",
  },
  orange: {
    ring: "focus-visible:ring-orange-500/20",
    border: "focus-visible:border-orange-500/50",
    selected: "bg-orange-50 dark:bg-orange-900/20",
  },
  purple: {
    ring: "focus-visible:ring-purple-500/20",
    border: "focus-visible:border-purple-500/50",
    selected: "bg-purple-50 dark:bg-purple-900/20",
  },
  emerald: {
    ring: "focus-visible:ring-emerald-500/20",
    border: "focus-visible:border-emerald-500/50",
    selected: "bg-emerald-50 dark:bg-emerald-900/20",
  },
};

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  label,
  icon,
  disabled = false,
  className,
  accentColor = "blue",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = items.find(
    (item) => item.value.toLowerCase() === value.toLowerCase()
  );

  const accent = accentClasses[accentColor];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-14 text-left font-normal",
            accent.ring,
            accent.border,
            className
          )}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={cn(
                  "p-2 rounded-lg",
                  value ? accent.selected : "bg-muted"
                )}
              >
                {icon}
              </div>
            )}
            <div className="flex flex-col items-start">
              {label && (
                <span className="text-xs text-muted-foreground">{label}</span>
              )}
              <span
                className={cn(
                  "text-sm",
                  value ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {selectedItem ? selectedItem.label : placeholder}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-11" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 py-2.5"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    {item.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value.toLowerCase() === item.value.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

