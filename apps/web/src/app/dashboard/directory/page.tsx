"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";

type User = {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  department: { name: string } | null;
  designation: { name: string } | null;
  phone: string | null;
};

export default function DirectoryPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDirectory = async (searchQuery = "") => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);

    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_URL + "/directory");
      if (searchQuery) url.searchParams.append("search", searchQuery);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data); // data is paginated
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory(search);
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
      cell: ({ row }) => <a href={`mailto:${row.original.email}`} className="text-indigo-400 hover:underline">{row.original.email}</a>
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "-"
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
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Directory</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Search name, email, id..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-white w-64"
          />
        </form>
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
