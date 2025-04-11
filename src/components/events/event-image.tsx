"use client";

import { useState } from "react";
import Image from "next/image";

interface EventImageProps {
  src?: string;
  alt: string;
}

export function EventImage({ src, alt }: EventImageProps) {
  const [error, setError] = useState(false);
  const placeholderImage = "https://placehold.co/600x400/e2e8f0/1e293b?text=Event+Image";
  
  const handleError = () => {
    setError(true);
  };

  return (
    <div className="relative h-48 w-full">
      {src && !error ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={handleError}
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          {error ? (
            <Image
              src={placeholderImage}
              alt="Placeholder"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-muted-foreground">No image</span>
          )}
        </div>
      )}
    </div>
  );
}
