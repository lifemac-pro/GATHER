"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "./form-field";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Field {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  order: number;
}

interface FormSectionProps {
  section: Section;
  onUpdate: (id: string, section: Section) => void;
  onDelete: (id: string) => void;
}

export function FormSection({ section, onUpdate, onDelete }: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.isCollapsed || false);

  const handleChange = (key: string, value: any) => {
    onUpdate(section.id, { ...section, [key]: value });
  };

  const handleFieldUpdate = (fieldId: string, updatedField: Field) => {
    const updatedFields = section.fields.map((field) =>
      field.id === fieldId ? { ...updatedField, order: field.order } : field
    );
    onUpdate(section.id, { ...section, fields: updatedFields });
  };

  const handleFieldDelete = (fieldId: string) => {
    const updatedFields = section.fields
      .filter((field) => field.id !== fieldId)
      .map((field, index) => ({ ...field, order: index }));
    onUpdate(section.id, { ...section, fields: updatedFields });
  };

  const addField = () => {
    const newField: Field = {
      id: nanoid(),
      label: "New Field",
      type: "text",
      required: false,
      order: section.fields.length,
    };
    onUpdate(section.id, {
      ...section,
      fields: [...section.fields, newField],
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="relative pb-2">
        <div className="absolute left-4 top-4 cursor-move text-gray-400">
          <GripVertical size={16} />
        </div>
        
        <div className="ml-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={section.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="text-lg font-semibold"
                placeholder="Section Title"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <Textarea
              value={section.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Section description (optional)"
              className="resize-none"
              rows={2}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`section-collapsible-${section.id}`}
              checked={section.isCollapsible}
              onCheckedChange={(checked) => handleChange("isCollapsible", checked)}
            />
            <Label htmlFor={`section-collapsible-${section.id}`}>
              Make section collapsible
            </Label>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <FormField
                key={field.id}
                field={field}
                onUpdate={handleFieldUpdate}
                onDelete={handleFieldDelete}
              />
            ))}
            
            <Button onClick={addField} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
