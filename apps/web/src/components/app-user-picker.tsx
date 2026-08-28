"use client";

import React, { useState, useMemo } from "react";
import { UserPicker, UserPickerProps, UserPickerUser } from "@g4k/ui/components";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { resolveAvatarUrl } from "@/lib/utils";
import { useDebouncedValidation } from "@g4k/ui/hooks";

export type AppUserPickerProps = Omit<UserPickerProps, "users" | "isLoading" | "search" | "onSearchChange">;

export function AppUserPicker(props: AppUserPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValidation(search, (v) => v, 300) || "";

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users-search", debouncedSearch],
    queryFn: () => apiFetch(`/chat/users?search=${encodeURIComponent(debouncedSearch)}`),
  });

  const users: UserPickerUser[] = useMemo(() => {
    return Array.isArray(usersData?.data) ? usersData.data : (Array.isArray(usersData) ? usersData : []);
  }, [usersData]);

  return (
    <UserPicker
      {...props}
      users={users}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      resolveAvatar={resolveAvatarUrl}
    />
  );
}
