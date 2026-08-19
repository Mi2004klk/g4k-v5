import { QuickNotes } from "@/components/widgets/quick-notes";
import { AppIcon } from "@g4k/ui/components";

export default function NotesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <AppIcon name="dashboard" size="xs" /> Dashboard / Quick Notes
      </div>
      <div className="h-[calc(100vh-200px)]">
        <QuickNotes />
      </div>
    </div>
  );
}
