"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Input, Button } from "@g4k/ui/components";
import { AppIcon, IconName } from "@g4k/ui/components";
import { useIsMobile } from "@g4k/ui/hooks";

interface OneFieldFormProps {
  title: string;
  placeholder?: string;
  buttonLabel?: string;
  icon?: IconName;
  onSubmit: (value: string) => Promise<void> | void;
  isPending?: boolean;
  trigger?: React.ReactNode;
}

export function OneFieldForm({
  title,
  placeholder = "Type here...",
  buttonLabel = "Save",
  icon = "plus",
  onSubmit,
  isPending,
  trigger
}: OneFieldFormProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    await onSubmit(value);
    setValue("");
    setOpen(false);
  };

  if (!isMobile) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-xs h-8 flex-1"
          disabled={isPending}
        />
        <Button
          size="sm"
          type="submit"
          disabled={!value.trim() || isPending}
          className="h-8 shrink-0"
        >
          {isPending ? <AppIcon name="loading" size="sm" className="animate-spin" /> : <AppIcon name={icon} size="sm" />}
        </Button>
      </form>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full h-10 border-dashed text-neutral-500 hover:text-neutral-700">
            <AppIcon name={icon} className="mr-2" /> Add {title}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[auto] min-h-[40dvh] p-4 rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left text-xl font-bold">Add {title}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="text-base h-12 rounded-xl"
            disabled={isPending}
          />
          <Button
            size="lg"
            type="submit"
            disabled={!value.trim() || isPending}
            className="w-full h-12 text-base font-bold rounded-xl shadow-e1"
          >
            {isPending ? <AppIcon name="loading" size="sm" className="mr-2 animate-spin" /> : null}
            {buttonLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
