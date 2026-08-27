"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { AppIcon } from "@g4k/ui/components";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Button, Popover, PopoverTrigger, PopoverContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Checkbox, Textarea, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger as TooltipTriggerComponent, DatePicker, SemanticCalendar } from "@g4k/ui/components";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { toast } from "sonner";
import { z } from "zod";
import { FormError } from "@/components/forms/form-error";

interface Holiday {
  id: number;
  name: string;
  date: string;
  description?: string;
  recurring?: boolean;
}

interface ApiError extends Error {
  errors?: Record<string, string[]>;
}

const holidaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  recurring: z.boolean(),
});

export function HolidayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const canManage = hasCapability(caps, "settings.manage");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    recurring: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: holidays, isLoading } = useQuery({
    queryKey: queryKeys.holidays(currentYear),
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: STALE_TIME_CONFIG,
  });

  const addHoliday = useMutation({
    mutationFn: (data: z.infer<typeof holidaySchema>) => apiFetch("/holidays", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      setIsAddOpen(false);
      toast.success("Saved successfully");
    },
    onError: () => toast.error("Failed to save"),
  });

  const editHoliday = useMutation({
    mutationFn: ({ id, data }: { id: number, data: z.infer<typeof holidaySchema> }) => apiFetch(`/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      setIsEditOpen(false);
      toast.success("Updated successfully");
    },
    onError: () => toast.error("Failed to update"),
  });

  const deleteHoliday = useMutation({
    mutationFn: (id: number) => apiFetch(`/holidays/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      toast.success("Deleted successfully");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const holidayList = Array.isArray(holidays) ? holidays : (holidays?.data || []);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const promptDelete = (id: number) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = holidaySchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0].toString()] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    if (editingHoliday) {
      editHoliday.mutate({ id: editingHoliday.id, data: formData });
    } else {
      addHoliday.mutate(formData);
    }
  };

  const openEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setFormData({
      name: h.name,
      date: h.date,
      description: h.description || "",
      recurring: h.recurring || false,
    });
    setFieldErrors({});
    setIsEditOpen(true);
  };

  const openAdd = () => {
    setEditingHoliday(null);
    setFormData({
      name: "",
      date: format(currentDate, "yyyy-MM-dd"),
      description: "",
      recurring: false,
    });
    setFieldErrors({});
    setIsAddOpen(true);
  };

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <AppIcon name="calendar" className=" text-primary-600" />
          {format(currentDate, "MMMM yyyy")}
        </CardTitle>
        <div className="flex items-center gap-1">
          {canManage && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openAdd} className="mr-2 h-7 px-2 text-xs">
                  <AppIcon name="plus" size="xs" className=" mr-1" /> Add Holiday/Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday or Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2 flex flex-col">
                    <Label>Date</Label>
                    <DatePicker 
                      value={formData.date ? new Date(formData.date) : undefined} 
                      onChange={(date) => setFormData({ ...formData, date: date ? format(date, "yyyy-MM-dd") : "" })} 
                      className="w-full"
                    />
                    <FormError errors={fieldErrors.date} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <FormError errors={fieldErrors.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="recurring-check" checked={formData.recurring} onCheckedChange={(c) => setFormData({ ...formData, recurring: !!c })} />
                    <Label htmlFor="recurring-check">Recurring annually</Label>
                  </div>
                  <Button type="submit" disabled={addHoliday.isPending} className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7" aria-label="Previous month">
            <AppIcon name="chevronLeft" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7" aria-label="Next month">
            <AppIcon name="chevronRight" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <SemanticCalendar
              currentDate={currentDate}
              renderDay={(day, { isCurrentMonth, isWeekend }) => {
                const holiday = holidayList.find((h: Holiday) => isSameDay(new Date(h.date), day));
                
                const CellContent = (
                  <div
                    className={`relative flex flex-col items-center justify-center p-1 rounded-[var(--radius)] text-xs transition-all min-h-[80px] sm:min-h-[100px] w-full
                      ${isCurrentMonth ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-600 opacity-50"}
                      ${holiday ? 
                        "bg-primary-50 dark:bg-primary-900/20 font-semibold border border-primary-100 dark:border-primary-800/50 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40" 
                        : isWeekend ? "bg-neutral-50 dark:bg-neutral-800/40 text-neutral-500" : ""}`}
                  >
                    <span>{format(day, "d")}</span>
                    {holiday && (
                      <span className={`w-1 h-1 rounded-full mt-1 bg-primary-500`} />
                    )}
                    {!holiday && isWeekend && isCurrentMonth && (
                      <span className="text-xs text-neutral-400 mt-0.5">Off</span>
                    )}
                  </div>
                );

                if (holiday) {
                  return (
                    <Popover key={day.toISOString()}>
                      <PopoverTrigger asChild>
                        {CellContent}
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 z-50">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">Holiday</span>
                          </div>
                          <h4 className="font-semibold text-sm">{holiday.name}</h4>
                          {holiday.description && (
                            <p className="text-xs text-neutral-500">{holiday.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 items-center justify-between">
                            {holiday.recurring ? (
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                Recurring
                              </span>
                            ) : <span></span>}
                            {canManage && (
                              <div className="flex items-center gap-1">
                                <TooltipProvider delayDuration={150}>
                                  <Tooltip>
                                    <TooltipTriggerComponent asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(holiday)} aria-label="Edit item">
                                        <AppIcon name="edit" size="xs" className=" text-neutral-500" />
                                      </Button>
                                    </TooltipTriggerComponent>
                                    <TooltipContent className="text-xs">Edit item</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider delayDuration={150}>
                                  <Tooltip>
                                    <TooltipTriggerComponent asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" aria-label="Delete item" onClick={() => {
                                        setConfirmState({ isOpen: true, id: holiday.id });
                                      }}>
                                        <AppIcon name="trash" size="xs" />
                                      </Button>
                                    </TooltipTriggerComponent>
                                    <TooltipContent className="text-xs">Delete item</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }

                return <div key={day.toISOString()}>{CellContent}</div>;
              }}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <Label>Date</Label>
              <DatePicker 
                value={formData.date ? new Date(formData.date) : undefined} 
                onChange={(date) => setFormData({ ...formData, date: date ? format(date, "yyyy-MM-dd") : "" })} 
                className="w-full"
              />
              <FormError errors={fieldErrors.date} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <FormError errors={fieldErrors.name} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="recurring-edit" checked={formData.recurring} onCheckedChange={(c) => setFormData({ ...formData, recurring: !!c })} />
              <Label htmlFor="recurring-edit">Recurring annually</Label>
            </div>
            <Button type="submit" disabled={editHoliday.isPending} className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDialog
        open={confirmState.isOpen}
        onOpenChange={(open) => { if (!open) setConfirmState({ isOpen: false, id: null }) }}
        onConfirm={() => {
          if (confirmState.id) {
            deleteHoliday.mutate(confirmState.id);
            setConfirmState({ isOpen: false, id: null });
          }
        }}
        title="Delete Item"
        description="Are you sure you want to delete this? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteHoliday.isPending}
      />
    </Card>
  );
}
