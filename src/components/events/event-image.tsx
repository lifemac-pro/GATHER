"use client";

import { useState } from "react";
import Image from "next/image";

interface EventImageProps {
  src?: string;
  alt?: string;
}

export function EventImage({ src, alt = "Event image" }: EventImageProps) {
  const [error, setError] = useState(false);
  const placeholderImage = "https://placehold.co/600x400/e2e8f0/1e293b?text=Event+Image";

  const handleError = () => {
    setError(true);
  };

  // Check if the src is a valid URL or base64 string
  const isValidSrc = src && (
    src.startsWith('http') ||
    src.startsWith('https') ||
    src.startsWith('data:image') ||
    src.startsWith('/images/')
  );

  // Use a better placeholder image
  const imageSrc = isValidSrc && !error ? src : placeholderImage;

  return (
    <div className="relative h-48 w-full">
      <Image
        src={imageSrc}
        alt={isValidSrc && !error ? alt : "Placeholder"}
        fill
        className="object-cover"
        onError={handleError}
        unoptimized
      />
    </div>
  );
}
