"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Clock, Plus, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem(props: { id: string, task: any, onLogTime: (task: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const t = props.task;

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 mb-2 shadow-sm relative group">
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="mt-1 cursor-grab opacity-50 hover:opacity-100 touch-none">
          <GripVertical className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-zinc-200">{t.title}</h4>
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{t.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-1 rounded-md">
              {t.assignee_name || 'Unassigned'}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); props.onLogTime(t); }}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
            >
              <Clock className="w-3 h-3" />
              {Number(t.logged_hours)} / {Number(t.estimated_hours)}h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoardPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState<any>(null);

  // Task form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estHours, setEstHours] = useState('0');

  // Time log form
  const [logHours, setLogHours] = useState('1');

  const fetchProject = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProject(data.data);
      setTasks(data.data.tasks || []);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id;
    const newStatus = over.id; // We use column ids as drop targets (todo, in_progress, etc)

    // Update local state optimistically
    const currentTask = tasks.find(t => t.id.toString() === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    setTasks(prev => prev.map(t => t.id.toString() === taskId ? { ...t, status: newStatus } : t));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      toast.error("Failed to save status");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          project_id: id,
          title, 
          description, 
          estimated_hours: estHours,
          // Omitting assignee picker for brevity
        })
      });
      if (res.ok) {
        toast.success("Task created");
        setShowTaskModal(false);
        setTitle('');
        setDescription('');
        fetchProject();
      }
    } catch (e) {
      toast.error("Failed to create task");
    }
  };

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTimeModal) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${showTimeModal.id}/log-time`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          hours: logHours,
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success("Time logged");
        setShowTimeModal(null);
        fetchProject();
      }
    } catch (e) {
      toast.error("Failed to log time");
    }
  };

  if (!project) return <div className="text-zinc-500">Loading...</div>;

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' }
  ];

  return (
    <div className="h-full flex flex-col space-y-6 pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
          <p className="text-zinc-400 mt-1">{project.description}</p>
        </div>
        <Button onClick={() => setShowTaskModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="w-80 shrink-0 flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-300">{col.title}</h3>
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                {/* Custom drop zone for columns without tasks */}
                <div id={col.id} className="flex-1 p-2 overflow-y-auto">
                  <SortableContext items={colTasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
                    {colTasks.map(t => (
                      <SortableItem key={t.id} id={t.id.toString()} task={t} onLogTime={setShowTimeModal} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-24 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg text-zinc-600 text-sm">
                        Drop here
                      </div>
                    )}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title</label>
                <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 h-20 resize-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Estimated Hours</label>
                <input type="number" step="0.5" required value={estHours} onChange={e=>setEstHours(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
                <Button type="submit">Create Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Log Time: {showTimeModal.title}</h2>
            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Hours to Log</label>
                <input type="number" step="0.5" required value={logHours} onChange={e=>setLogHours(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowTimeModal(null)}>Cancel</Button>
                <Button type="submit">Log Time</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
