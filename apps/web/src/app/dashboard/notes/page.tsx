import { QuickNotes } from "@/components/widgets/quick-notes";
import { PageContainer } from "@/components/layout/page-container";

export default function NotesPage() {
  return (
    <PageContainer 
      title="Quick Notes"
      description="Jot down quick thoughts and to-dos privately."
    >
      <div className="h-[calc(100vh-200px)]">
        <QuickNotes />
      </div>
    </PageContainer>
  );
}
