"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { STALE_TIME_CONFIG, queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Button, Popover, PopoverTrigger, PopoverContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input, Label, Checkbox, Textarea } from "@g4k/ui/components";
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
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    recurring: false,
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
      toast.success("Holiday added successfully");
    },
    onError: () => toast.error("Failed to add holiday"),
  });

  const editHoliday = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiFetch(`/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      setIsEditOpen(false);
      toast.success("Holiday updated successfully");
    },
    onError: () => toast.error("Failed to update holiday"),
  });

  const deleteHoliday = useMutation({
    mutationFn: (id: number) => apiFetch(`/holidays/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.holidays(currentYear) });
      toast.success("Holiday deleted successfully");
    },
    onError: () => toast.error("Failed to delete holiday"),
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
    });
    setIsAddOpen(true);
  };

  return (
    <Card className="border-none shadow-sm h-full flex flex-col bg-white dark:bg-neutral-900">
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
                  <Plus className="w-3 h-3 mr-1" /> Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Holiday</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="recurring-add" checked={formData.recurring} onCheckedChange={(c) => setFormData({ ...formData, recurring: !!c })} />
                    <Label htmlFor="recurring-add">Recurring annually</Label>
                  </div>
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
                
                const CellContent = (
                  <div
                    className={`relative flex flex-col items-center justify-center p-1 rounded-md text-xs transition-all min-h-[40px]
                      ${isCurrentMonth ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-600 opacity-50"}
                      ${holiday ? "bg-violet-50 dark:bg-violet-900/20 font-semibold border border-violet-100 dark:border-violet-800/50 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/40" : ""}`}
                  >
                    <span>{format(day, "d")}</span>
                    {holiday && (
                      <span className="w-1 h-1 rounded-full bg-violet-500 mt-0.5" />
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
                          <h4 className="font-semibold text-sm leading-none">{holiday.name}</h4>
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
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(holiday)}>
                                  <Edit2 className="w-3 h-3 text-neutral-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => {
                                  if (confirm("Are you sure you want to delete this holiday?")) {
                                    deleteHoliday.mutate(holiday.id);
                                  }
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
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
            <DialogTitle>Edit Holiday</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
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
    </Card>
  );
}
