import { Input } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";

export function QAFieldRenderer({ field, value, onChange }: { field: any, value: any, onChange: (val: any) => void }) {
  if (field.type === "textarea") {
    return (
      <Textarea
        className="w-full text-xs resize-y"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2 mt-1">
        <Checkbox
          id={`qa-${field.id}`}
          checked={value === "true" || value === true}
          onCheckedChange={(c) => onChange(c ? "true" : "false")}
        />
        <label htmlFor={`qa-${field.id}`} className="text-xs text-neutral-600 dark:text-neutral-300">
          {field.label}
        </label>
      </div>
    );
  }

  if (field.type === "select") {
    const options = field.options || [];
    return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: string) => (
            <SelectItem key={opt} value={opt} className="text-xs">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "slider") {
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={field.min || 0}
          max={field.max || 100}
          value={value || field.min || 0}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-primary-600"
        />
        <span className="text-xs font-mono w-8 text-right">{value || field.min || 0}</span>
      </div>
    );
  }

  // Fallback to text input
  return (
    <Input
      className="h-8 text-xs"
      type={field.type === "number" ? "number" : "text"}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
