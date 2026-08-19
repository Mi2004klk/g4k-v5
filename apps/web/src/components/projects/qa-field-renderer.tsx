import { Input } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { RadioGroup, RadioGroupItem } from "@g4k/ui/components";

export interface QAField {
  id: string | number;
  type: string;
  field_type?: string;
  label?: string;
  options?: string[];
  min?: number;
  max?: number;
}

export function QAFieldRenderer({ field, value, onChange }: { field: QAField, value: string | boolean | number, onChange: (val: string | boolean | number) => void }) {
  const fieldType = field.field_type ?? field.type;

  if (fieldType === "textarea") {
    return (
      <Textarea
        className="w-full text-sm resize-y bg-white dark:bg-neutral-950"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  if (fieldType === "checkbox") {
    return (
      <div className="flex items-center gap-2 mt-1 bg-white dark:bg-neutral-950 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <Checkbox
          id={`qa-${field.id}`}
          checked={value === "true" || value === true}
          onCheckedChange={(c) => onChange(c ? "true" : "false")}
        />
        <label htmlFor={`qa-${field.id}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {field.label}
        </label>
      </div>
    );
  }

  if (fieldType === "boolean") {
    return (
      <RadioGroup
        value={String(value)}
        onValueChange={onChange}
        className="flex gap-4 mt-2"
      >
        <div className="flex items-center space-x-2 bg-white dark:bg-neutral-950 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg flex-1 cursor-pointer hover:border-primary-500 transition-colors">
          <RadioGroupItem value="true" id={`qa-${field.id}-yes`} />
          <label htmlFor={`qa-${field.id}-yes`} className="text-sm font-medium cursor-pointer flex-1">Yes</label>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-neutral-950 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg flex-1 cursor-pointer hover:border-primary-500 transition-colors">
          <RadioGroupItem value="false" id={`qa-${field.id}-no`} />
          <label htmlFor={`qa-${field.id}-no`} className="text-sm font-medium cursor-pointer flex-1">No</label>
        </div>
      </RadioGroup>
    );
  }

  if (fieldType === "multiple_choice" || fieldType === "select") {
    const options = field.options || [];
    // If it's a small number of options, we might render radio buttons.
    // But Select is generally safer for many options.
    return (
      <Select value={String(value || "")} onValueChange={onChange}>
        <SelectTrigger className="h-10 text-sm bg-white dark:bg-neutral-950">
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: string) => (
            <SelectItem key={opt} value={opt} className="text-sm">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (fieldType === "slider") {
    return (
      <div className="flex items-center gap-4 bg-white dark:bg-neutral-950 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 mt-2">
        <input
          type="range"
          min={field.min || 0}
          max={field.max || 100}
          value={(value as any) || field.min || 0}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-primary-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-bold w-12 text-center bg-neutral-100 dark:bg-neutral-900 py-1 rounded">{value || field.min || 0}</span>
      </div>
    );
  }

  if (fieldType === "date") {
    return (
      <Input
        className="h-10 text-sm bg-white dark:bg-neutral-950 w-full sm:w-auto"
        type="date"
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  
  if (fieldType === "file_upload") {
    return (
      <div className="mt-2 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-6 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors bg-white dark:bg-neutral-950 cursor-pointer">
        <input type="file" className="hidden" id={`file-${field.id}`} onChange={(e) => onChange(e.target.files?.[0]?.name || "File selected")} />
        <label htmlFor={`file-${field.id}`} className="cursor-pointer flex flex-col items-center gap-2">
          <span className="text-sm font-medium text-primary-600">Click to upload or drag and drop</span>
          <span className="text-xs text-neutral-500">PDF, JPG, PNG up to 10MB</span>
          {value && <div className="mt-3 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-medium">Selected: {String(value)}</div>}
        </label>
      </div>
    );
  }

  // Fallback to text input for "text", "number", etc.
  return (
    <Input
      className="h-10 text-sm bg-white dark:bg-neutral-950"
      type={fieldType === "number" ? "number" : "text"}
      value={(value as any) || ""}
      placeholder="Type your answer here..."
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
