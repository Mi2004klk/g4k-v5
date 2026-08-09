"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Grid,
  List as ListIcon,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function DirectoryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["directory", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      return apiFetch(`/directory?${params.toString()}`);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiFetch(`/directory/${userId}/send-message`, { method: "POST" });
    },
    onSuccess: (res: any) => {
      toast.success(`Message session started! Conversation ID: ${res.conversation_id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation.");
    },
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Employee Directory
          </h1>
          <p className="text-xs text-neutral-500">
            Browse corporate team members, roles, contact info, and departments.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 px-2.5"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 px-2.5"
          >
            <ListIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search by name, email, designation, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid or List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try broadening your search term."
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user: any) => (
            <Card
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-white font-bold text-lg flex items-center justify-center shadow">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-medium truncate">
                      {user.designation?.name || "Team Member"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
                  {user.department && (
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{user.department.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMessageMutation.mutate(user.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs h-9 mt-2 group-hover:border-violet-500 group-hover:text-violet-600"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {users.map((user: any) => (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 font-bold text-violet-700 dark:text-violet-300 flex items-center justify-center">
                        {user.name.charAt(0)}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {user.designation?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                      {user.department?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{user.email}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendMessageMutation.mutate(user.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-violet-600 hover:text-violet-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <SheetHeader className="text-left space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white font-bold text-2xl flex items-center justify-center shadow-lg">
                  {selectedUser.name.charAt(0)}
                </div>
                <SheetTitle className="text-xl font-bold font-display">
                  {selectedUser.name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedUser.designation?.name || "Employee"} •{" "}
                  {selectedUser.department?.name || "Games4King"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-xs border-t border-b border-neutral-100 dark:border-neutral-800 py-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-neutral-400 font-medium">Email</div>
                    <div className="font-semibold">{selectedUser.email}</div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="text-neutral-400 font-medium">Phone</div>
                      <div className="font-semibold">{selectedUser.phone}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-neutral-400" />
                  <div>
                    <div className="text-neutral-400 font-medium">Employee Code</div>
                    <div className="font-mono font-semibold">
                      {selectedUser.employee_code || selectedUser.employee_id || "G4K001"}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => sendMessageMutation.mutate(selectedUser.id)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Initialize Direct Message</span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
