"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, GripVertical } from "lucide-react";

interface FormFieldProps {
  field: {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    helpText?: string;
    required: boolean;
    options?: string[];
  };
  onUpdate: (id: string, field: any) => void;
  onDelete: (id: string) => void;
}

export function FormField({ field, onUpdate, onDelete }: FormFieldProps) {
  const handleChange = (key: string, value: any) => {
    onUpdate(field.id, { ...field, [key]: value });
  };

  return (
    <div className="relative rounded-md border p-4">
      <div className="absolute left-2 top-2 cursor-move text-gray-400">
        <GripVertical size={16} />
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`field-label-${field.id}`}>Field Label</Label>
          <Input
            id={`field-label-${field.id}`}
            value={field.label}
            onChange={(e) => handleChange("label", e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <SelectTrigger id={`field-type-${field.id}`} className="mt-1">
              <SelectValue placeholder="Select field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="radio">Radio Buttons</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mb-4">
        <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
        <Input
          id={`field-placeholder-${field.id}`}
          value={field.placeholder || ""}
          onChange={(e) => handleChange("placeholder", e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor={`field-help-${field.id}`}>Help Text</Label>
        <Textarea
          id={`field-help-${field.id}`}
          value={field.helpText || ""}
          onChange={(e) => handleChange("helpText", e.target.value)}
          className="mt-1"
          rows={2}
        />
      </div>
      
      {(field.type === "select" || field.type === "checkbox" || field.type === "radio") && (
        <div className="mb-4">
          <Label htmlFor={`field-options-${field.id}`}>Options (one per line)</Label>
          <Textarea
            id={`field-options-${field.id}`}
            value={(field.options || []).join("\n")}
            onChange={(e) => handleChange("options", e.target.value.split("\n").filter(Boolean))}
            className="mt-1"
            rows={4}
          />
        </div>
      )}
      
      <div className="mb-4 flex items-center space-x-2">
        <Checkbox
          id={`field-required-${field.id}`}
          checked={field.required}
          onCheckedChange={(checked) => handleChange("required", checked)}
        />
        <Label htmlFor={`field-required-${field.id}`}>Required field</Label>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete Field
        </Button>
      </div>
    </div>
  );
}
