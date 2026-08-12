const fs = require('fs');
let code = fs.readFileSync('apps/web/src/components/chat/message-composer.tsx', 'utf8');

const importAdd = `import { FileUploadPopup } from "@g4k/ui/components";`;
code = code.replace('import { Button } from "@g4k/ui/components";', 'import { Button } from "@g4k/ui/components";\n' + importAdd);

// Add state for FileUploadPopup
const stateAdd = `
  const [showUploadPopup, setShowUploadPopup] = useState(false);
`;
code = code.replace('const textareaRef = useRef<HTMLTextAreaElement>(null);', 'const textareaRef = useRef<HTMLTextAreaElement>(null);\n' + stateAdd);

// Modify Paperclip button onClick and remove input file
const fileInputRemove = `      <input \n        type="file" \n        className="hidden" \n        ref={fileInputRef} \n        onChange={(e) => {\n          if (e.target.files && e.target.files[0]) {\n            setText(text + \` [File: \${e.target.files[0].name}]\`);\n          }\n        }} \n      />`;

const paperclipBtnOld = `      <Button 
        size="icon" 
        variant="ghost" 
        className="h-9 w-9 text-neutral-400 shrink-0" 
        aria-label="Add attachment"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="w-4 h-4" />
      </Button>`;

const newPaperclipLogic = `      <FileUploadPopup 
        open={showUploadPopup} 
        onOpenChange={setShowUploadPopup} 
        title="Share File" 
        description="Select a file to share in this conversation."
        maxSizeMB={10}
        acceptedTypes={[]} 
        onUpload={async (file) => {
          onSend(text.trim() || '', selectedMentions, file);
          setText("");
          setSelectedMentions([]);
          setShowUploadPopup(false);
        }} 
      />

      <Button 
        size="icon" 
        variant="ghost" 
        className="h-9 w-9 text-neutral-400 shrink-0" 
        aria-label="Add attachment"
        onClick={() => setShowUploadPopup(true)}
      >
        <Paperclip className="w-4 h-4" />
      </Button>`;

code = code.replace(fileInputRemove, '');
code = code.replace(paperclipBtnOld, newPaperclipLogic);

// Change onSend prop type
code = code.replace('onSend: (body: string, mentions?: number[]) => void;', 'onSend: (body: string, mentions?: number[], attachment?: File | null) => void;');

fs.writeFileSync('apps/web/src/components/chat/message-composer.tsx', code);
console.log('Patched message-composer.tsx');
