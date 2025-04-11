"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Event Image" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview URL when value prop changes
  useEffect(() => {
    if (value !== previewUrl) {
      setPreviewUrl(value || '');
    }
  }, [value, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onChange(result); // Pass the base64 string to the parent component
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="image-upload">{label}</Label>

      <div className="flex flex-col items-center gap-4">
        {previewUrl ? (
          <div className="relative w-full max-w-md">
            <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border">
              {!imageError ? (
                <Image
                  src={previewUrl}
                  alt="Event preview"
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <Image
                  src="https://placehold.co/600x400/e2e8f0/1e293b?text=Preview+Image"
                  alt="Placeholder"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex aspect-video w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-4 text-muted-foreground hover:bg-muted/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="mb-2 h-10 w-10" />
            <p className="text-sm">Click to upload an image</p>
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (max 5MB)</p>
          </div>
        )}

        <Input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {!previewUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full max-w-md"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        )}
      </div>
    </div>
  );
}
