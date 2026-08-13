"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Edit2, MapPin, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Button, Popover, PopoverTrigger, PopoverContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Checkbox, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ConfirmDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger as TooltipTriggerComponent } from "@g4k/ui/components";
import { useCapabilities, hasCapability } from "@/lib/capabilities";
import { toast } from "sonner";

export function HolidayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const queryClient = useQueryClient();
  const { data: caps } = useCapabilities();
  const canManage = hasCapability(caps, "settings.manage");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    recurring: false,
    type: "holiday",
    location: "",
    start_time: "",
  });

  const { data: holidays, isLoading } = useQuery({
    queryKey: queryKeys.holidays(currentYear),
    queryFn: () => apiFetch(`/holidays?year=${currentYear}`),
    staleTime: STALE_TIME_CONFIG,
  });

  const addHoliday = useMutation({
    mutationFn: (data: any) => apiFetch("/holidays", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      setIsAddOpen(false);
      toast.success("Saved successfully");
    },
    onError: () => toast.error("Failed to save"),
  });

  const editHoliday = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiFetch(`/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHoliday) {
      editHoliday.mutate({ id: editingHoliday.id, data: formData });
    } else {
      addHoliday.mutate(formData);
    }
  };

  const openEdit = (h: any) => {
    setEditingHoliday(h);
    setFormData({
      name: h.name,
      date: h.date,
      description: h.description || "",
      recurring: h.recurring || false,
      type: h.type || "holiday",
      location: h.location || "",
      start_time: h.start_time || "",
    });
    setIsEditOpen(true);
  };

  const openAdd = () => {
    setEditingHoliday(null);
    setFormData({
      name: "",
      date: format(currentDate, "yyyy-MM-dd"),
      description: "",
      recurring: false,
      type: "holiday",
      location: "",
      start_time: "",
    });
    setIsAddOpen(true);
  };

  const HolidayFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="event">Company Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      </div>
      {formData.type === 'event' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="recurring-check" checked={formData.recurring} onCheckedChange={(c) => setFormData({ ...formData, recurring: !!c })} />
        <Label htmlFor="recurring-check">Recurring annually</Label>
      </div>
    </>
  );

  return (
    <Card className="h-full flex flex-col bg-card dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-e1 hover:shadow-e2 transition-shadow duration-150 rounded-xl overflow-hidden h-full">
      <CardHeader className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-violet-600" />
          {format(currentDate, "MMMM yyyy")}
        </CardTitle>
        <div className="flex items-center gap-1">
          {canManage && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={openAdd} className="mr-2 h-7 px-2 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Holiday/Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday or Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <HolidayFormFields />
                  <Button type="submit" disabled={addHoliday.isPending} className="w-full">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
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
            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[10px] font-semibold text-neutral-500">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {days.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const holiday = holidayList.find((h: any) => isSameDay(new Date(h.date), day));
                const isEvent = holiday?.type === 'event';
                
                const CellContent = (
                  <div
                    className={`relative flex flex-col items-center justify-center p-1 rounded-md text-xs transition-all min-h-[40px]
                      ${isCurrentMonth ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-600 opacity-50"}
                      ${holiday ? 
                        isEvent ? "bg-blue-50 dark:bg-blue-900/20 font-semibold border border-blue-100 dark:border-blue-800/50 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40" 
                                : "bg-violet-50 dark:bg-violet-900/20 font-semibold border border-violet-100 dark:border-violet-800/50 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40" 
                        : ""}`}
                  >
                    <span>{format(day, "d")}</span>
                    {holiday && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${isEvent ? 'bg-blue-500' : 'bg-violet-500'}`} />
                    )}
                  </div>
                );

                if (holiday) {
                  return (
                    <Popover key={idx}>
                      <PopoverTrigger asChild>
                        {CellContent}
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 z-50">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{isEvent ? 'Event' : 'Holiday'}</span>
                          </div>
                          <h4 className="font-semibold text-sm leading-none">{holiday.name}</h4>
                          {isEvent && (holiday.start_time || holiday.location) && (
                            <div className="flex flex-col gap-1 text-[11px] text-neutral-600 font-medium my-1">
                              {holiday.start_time && (
                                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-neutral-400" /> {holiday.start_time}</div>
                              )}
                              {holiday.location && (
                                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-neutral-400" /> {holiday.location}</div>
                              )}
                            </div>
                          )}
                          {holiday.description && (
                            <p className="text-xs text-neutral-500">{holiday.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 items-center justify-between">
                            {holiday.recurring ? (
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                Recurring
                              </span>
                            ) : <span></span>}
                            {canManage && (
                              <div className="flex items-center gap-1">
                                <TooltipProvider delayDuration={150}>
                                  <Tooltip>
                                    <TooltipTriggerComponent asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(holiday)} aria-label="Edit item">
                                        <Edit2 className="w-3 h-3 text-neutral-500" />
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
                                        <Trash2 className="w-3 h-3" />
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

                return <div key={idx}>{CellContent}</div>;
              })}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {formData.type === 'event' ? 'Event' : 'Holiday'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <HolidayFormFields />
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
        isLoading={deleteHoliday.isPending}
      />
    </Card>
  );
}
