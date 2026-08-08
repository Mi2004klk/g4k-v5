"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer, BarChart2 } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('productivity');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${activeTab}?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleExportCsv = () => {
    const token = localStorage.getItem("token");
    // Simple way to trigger download since it's a streamed response
    // For production with auth, we fetch as blob and create object URL
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${activeTab}/export?start_date=${startDate}&end_date=${endDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_report_${startDate}_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Export failed"));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto printable-area">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-indigo-400" />
            Reports & Analytics
          </h1>
          <p className="text-zinc-400 mt-1">Generate and export organization metrics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> PDF / Print
          </Button>
          <Button onClick={handleExportCsv} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-zinc-800 pb-2 no-print">
        {['productivity', 'attendance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === tab ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-2">
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300" />
          <span className="text-zinc-500">to</span>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-zinc-300" />
          <Button variant="secondary" size="sm" onClick={fetchData}>Apply</Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-black">{activeTab.toUpperCase()} REPORT</h1>
        <p className="text-gray-500">Generated on {format(new Date(), 'MMM d, yyyy')}</p>
        <p className="text-gray-500">Period: {startDate} to {endDate}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden print:border-none print:bg-white print:text-black">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 opacity-20" />
            No records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/50 border-b border-zinc-800 print:bg-gray-100 print:text-black print:border-gray-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Employee</th>
                  {activeTab === 'productivity' ? (
                    <>
                      <th className="px-6 py-4 font-semibold">Task</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Logged Hours</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">In/Out</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 print:border-gray-200 print:text-black">
                    <td className="px-6 py-4 font-medium text-white print:text-black">{row.name}</td>
                    {activeTab === 'productivity' ? (
                      <>
                        <td className="px-6 py-4 text-zinc-300 print:text-gray-800">{row.title}</td>
                        <td className="px-6 py-4">
                          <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs print:bg-transparent print:text-black print:border">{row.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-zinc-300 print:text-gray-800">{row.logged_hours}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-zinc-300 print:text-gray-800">{row.date}</td>
                        <td className="px-6 py-4 text-zinc-300 print:text-gray-800">{row.status}</td>
                        <td className="px-6 py-4 text-zinc-300 print:text-gray-800">
                          {row.check_in ? format(new Date(row.check_in), 'HH:mm') : '-'} / {row.check_out ? format(new Date(row.check_out), 'HH:mm') : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .no-print { display: none !important; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  );
}
