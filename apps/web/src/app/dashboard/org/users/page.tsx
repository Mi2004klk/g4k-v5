"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  department: { name: string } | null;
  designation: { name: string } | null;
  status: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/org/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/org/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "employee_id",
      header: "Employee ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => row.original.department?.name || "-",
    },
    {
      id: "designation",
      header: "Designation",
      cell: ({ row }) => row.original.designation?.name || "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {row.original.status.toUpperCase()}
        </span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="text-blue-500 hover:text-blue-700"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteUser(row.original.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </div>
    </div>
  );
}
