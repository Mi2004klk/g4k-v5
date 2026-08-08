"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setSettings(json.data || {});
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success("Settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-400" />
          System Settings
        </h1>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex items-center gap-4 border-b border-zinc-800 pb-2">
        {['company', 'working_hours', 'policies'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === tab ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {tab.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            {activeTab === tab && <div className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        {activeTab === 'company' && (
          <>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Company Name</label>
              <input type="text" value={settings.company_name || ''} onChange={e => handleChange('company_name', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Contact Email</label>
              <input type="email" value={settings.contact_email || ''} onChange={e => handleChange('contact_email', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Sentry DSN (Observability Stub)</label>
              <input type="text" value={settings.sentry_dsn || ''} onChange={e => handleChange('sentry_dsn', e.target.value)} placeholder="https://example@sentry.io/123" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono text-xs" />
            </div>
          </>
        )}

        {activeTab === 'working_hours' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Default Start Time</label>
                <input type="time" value={settings.work_start_time || '09:00'} onChange={e => handleChange('work_start_time', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Default End Time</label>
                <input type="time" value={settings.work_end_time || '18:00'} onChange={e => handleChange('work_end_time', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Timezone</label>
              <select value={settings.timezone || 'UTC'} onChange={e => handleChange('timezone', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500">
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
              </select>
            </div>
          </>
        )}

        {activeTab === 'policies' && (
          <>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Default Leave Quota (Days/Year)</label>
              <input type="number" value={settings.leave_quota || '20'} onChange={e => handleChange('leave_quota', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="strict_sessions" checked={settings.strict_session === true} onChange={e => handleChange('strict_session', e.target.checked)} className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-600" />
              <label htmlFor="strict_sessions" className="text-sm text-zinc-300">Enable Strict Session Timeouts (Auto-logout after 30 mins idle)</label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
