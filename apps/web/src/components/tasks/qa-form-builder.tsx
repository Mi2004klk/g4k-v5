"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@g4k/ui/components";
import { Input } from "@g4k/ui/components";
import { Card, CardHeader, CardTitle, CardContent } from "@g4k/ui/components";
import { Plus, X, Trash2, ArrowUp, ArrowDown, CheckCircle, Loader2 } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";

export function QAFormBuilder() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<any[]>([
    { label: "Check Code Formatting", field_type: "checkbox", required: true },
  ]);

  const addField = () => {
    setFields([...fields, { label: "New Checkpoint", field_type: "input", required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const createFormMutation = useMutation({
    mutationFn: async () => {
      return apiFetch("/qa-forms", {
        method: "POST",
        body: JSON.stringify({ title, description, fields }),
      });
    },
    onSuccess: () => {
      toast.success("QA Form Template created successfully.");
      setTitle("");
      setDescription("");
      setFields([{ label: "Check Code Formatting", field_type: "checkbox", required: true }]);
      queryClient.invalidateQueries({ queryKey: queryKeys.qaForms });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create QA form.");
    },
  });

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-violet-600" />
          Create QA Form Template
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Form Title (e.g. Code Review Checklist)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xs h-9"
          />
          <Input
            placeholder="Description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs h-9"
          />
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-neutral-500">Checklist Fields</h4>
          {fields.map((field, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Field Label"
                value={field.label}
                onChange={(e) => updateField(index, "label", e.target.value)}
                className="text-xs h-8 flex-1"
              />
              <select
                value={field.field_type}
                onChange={(e) => updateField(index, "field_type", e.target.value)}
                className="h-8 text-xs border border-input bg-background rounded-md px-2"
              >
                <option value="input">Text Input</option>
                <option value="textarea">Textarea</option>
                <option value="checkbox">Checkbox</option>
                <option value="slider">Rating Slider</option>
              </select>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-rose-600 hover:text-rose-700"
                onClick={() => removeField(index)}
                aria-label="Remove field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addField}
            className="w-full h-8 text-xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field
          </Button>
        </div>

        <Button
          onClick={() => createFormMutation.mutate()}
          disabled={createFormMutation.isPending || !title || fields.length === 0}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-9 text-xs"
        >
          {createFormMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save QA Form"}
        </Button>
      </CardContent>
    </Card>
  );
}
