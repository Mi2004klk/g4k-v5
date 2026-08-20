import { Input } from "@g4k/ui/components";
import { Textarea } from "@g4k/ui/components";
import { Checkbox } from "@g4k/ui/components";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@g4k/ui/components";
import { RadioGroup, RadioGroupItem } from "@g4k/ui/components";

import { AppIcon, Slider } from "@g4k/ui/components";

export interface QAField {
  id: string | number;
  type?: string;
  field_type?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  config?: {
    scale_min?: number;
    scale_max?: number;
    scale_min_label?: string;
    scale_max_label?: string;
    rating_max?: number;
    rating_icon?: string;
  };
  validation?: {
    min?: number;
    max?: number;
    allowed_file_types?: string[];
    max_file_size_mb?: number;
  };
}

export function QAFieldRenderer({ field, value, onChange }: { field: QAField, value: any, onChange: (val: any) => void }) {
  const fieldType = field.field_type;

  if (fieldType === "textarea") {
    return (
      <Textarea
        className="w-full text-sm resize-y bg-white dark:bg-neutral-950"
        value={(value as string) || ""}
        placeholder={field.placeholder || "Your answer"}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    );
  }

  if (fieldType === "checkbox") {
    const isMultiChoice = field.options && field.options.length > 0;
    
    if (isMultiChoice) {
      const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
      return (
        <div className="flex flex-col gap-3 mt-2">
          {field.options?.map((opt) => (
            <div key={opt} className="flex items-center gap-3">
              <Checkbox
                id={`qa-${field.id}-${opt}`}
                checked={selectedValues.includes(opt)}
                onCheckedChange={(c) => {
                  if (c) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter(v => v !== opt));
                  }
                }}
              />
              <label htmlFor={`qa-${field.id}-${opt}`} className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                {opt}
              </label>
            </div>
          ))}
        </div>
      );
    }
    
    // Single checkbox fallback
    return (
      <div className="flex items-center gap-2 mt-1">
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

  if (fieldType === "multiple_choice" || fieldType === "boolean") {
    const isBool = fieldType === "boolean";
    const options = isBool ? ["Yes", "No"] : (field.options || []);
    
    return (
      <RadioGroup
        value={isBool ? (value === "true" || value === true ? "Yes" : (value === "false" || value === false ? "No" : "")) : String(value || "")}
        onValueChange={(val) => {
          if (isBool) onChange(val === "Yes" ? "true" : "false");
          else onChange(val);
        }}
        className="flex flex-col gap-3 mt-2"
      >
        {options.map((opt) => (
          <div key={opt} className="flex items-center space-x-3">
            <RadioGroupItem value={opt} id={`qa-${field.id}-${opt}`} />
            <label htmlFor={`qa-${field.id}-${opt}`} className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">{opt}</label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (fieldType === "dropdown" || fieldType === "select") {
    const options = field.options || [];
    return (
      <Select value={String(value || "")} onValueChange={onChange}>
        <SelectTrigger className="h-12 w-full md:w-1/2 text-sm bg-white dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700">
          <SelectValue placeholder="Choose" />
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

  if (fieldType === "linear_scale") {
    const min = field.config?.scale_min ?? 1;
    const max = field.config?.scale_max ?? 5;
    const minLabel = field.config?.scale_min_label;
    const maxLabel = field.config?.scale_max_label;
    
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    return (
      <div className="flex flex-col gap-4 mt-4 max-w-2xl">
        <div className="flex items-end justify-between px-2">
          {minLabel && <span className="text-xs font-medium text-neutral-500 w-24 text-center">{minLabel}</span>}
          
          <RadioGroup 
            value={String(value || "")}
            onValueChange={(v) => onChange(Number(v))}
            className="flex flex-1 justify-between px-4"
          >
            {range.map(num => (
              <div key={num} className="flex flex-col items-center gap-3">
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{num}</span>
                <RadioGroupItem value={String(num)} id={`scale-${field.id}-${num}`} className="w-5 h-5" />
              </div>
            ))}
          </RadioGroup>
          
          {maxLabel && <span className="text-xs font-medium text-neutral-500 w-24 text-center">{maxLabel}</span>}
        </div>
      </div>
    );
  }

  if (fieldType === "rating") {
    const max = field.config?.rating_max ?? 5;
    const range = Array.from({ length: max }, (_, i) => i + 1);
    const currentValue = Number(value) || 0;

    return (
      <div className="flex items-center gap-2 mt-2">
        {range.map(num => (
          <button 
            key={num}
            type="button"
            className="p-1 transition-transform hover:scale-110 active:scale-95"
            onClick={() => onChange(num)}
          >
            <AppIcon 
              name={num <= currentValue ? "star" : "starOutline"} 
              className={num <= currentValue ? "text-amber-400 w-8 h-8" : "text-neutral-300 dark:text-neutral-700 w-8 h-8"} 
            />
          </button>
        ))}
      </div>
    );
  }

  if (fieldType === "slider") {
    const min = field.config?.scale_min ?? 0;
    const max = field.config?.scale_max ?? 100;
    const val = Number(value) || min;

    return (
      <div className="flex items-center gap-6 mt-4 w-full md:w-2/3">
        <span className="text-sm font-medium text-neutral-500 w-8 text-right">{min}</span>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[val]}
          onValueChange={(vals) => onChange(vals[0])}
          className="flex-1"
        />
        <span className="text-sm font-medium text-neutral-500 w-8">{max}</span>
        <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold px-3 py-1 rounded-md min-w-[3rem] text-center ml-2 border border-primary-100 dark:border-primary-800">
          {val}
        </div>
      </div>
    );
  }

  if (fieldType === "date" || fieldType === "time" || fieldType === "datetime") {
    const typeMap = { date: "date", time: "time", datetime: "datetime-local" };
    return (
      <Input
        className="h-12 text-sm bg-white dark:bg-neutral-950 w-full md:w-auto"
        type={typeMap[fieldType as keyof typeof typeMap]}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  
  if (fieldType === "file_upload") {
    return (
      <div className="mt-2 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-8 text-center hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-400 transition-colors bg-white dark:bg-neutral-950 cursor-pointer group">
        <input type="file" className="hidden" id={`file-${field.id}`} onChange={(e) => onChange(e.target.files?.[0]?.name || "File selected")} />
        <label htmlFor={`file-${field.id}`} className="cursor-pointer flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
            <AppIcon name="upload" />
          </div>
          <span className="text-sm font-semibold text-primary-600">Click to upload or drag and drop</span>
          <span className="text-xs text-neutral-500">
            {field.validation?.allowed_file_types?.length ? field.validation.allowed_file_types.join(", ") : "Any file type"} 
            {" up to "}{field.validation?.max_file_size_mb || 10}MB
          </span>
          {value && <div className="mt-4 text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg font-medium border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"><AppIcon name="check" size="xs"/> {String(value)}</div>}
        </label>
      </div>
    );
  }

  // Fallback to text input for "text", "number", "email", "url", "phone"
  const inputType = fieldType === "number" || fieldType === "email" || fieldType === "url" || fieldType === "tel" || fieldType === "phone" ? fieldType : "text";
  
  return (
    <Input
      className="h-12 text-sm bg-white dark:bg-neutral-950 md:w-1/2"
      type={inputType === "phone" || inputType === "tel" ? "tel" : inputType}
      value={(value as any) || ""}
      placeholder={field.placeholder || "Your answer"}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
