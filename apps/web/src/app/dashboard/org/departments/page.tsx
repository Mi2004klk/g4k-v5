"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

type Department = {
  id: number;
  name: string;
  description: string;
  teams: any[];
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/org/departments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const deleteDepartment = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/org/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDepartments(departments.filter((d) => d.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteDepartment(row.original.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Departments</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable columns={columns} data={departments} />
        )}
      </div>
    </div>
  );
}
