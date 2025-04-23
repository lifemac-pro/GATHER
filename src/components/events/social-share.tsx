"use client";

import { useState } from "react";
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  Share2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SocialShare({
  url,
  title,
  description = "",
  image = "",
  variant = "outline",
  size = "default",
  className = "",
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure we have the full URL
  const fullUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;

  // Encode parameters for sharing
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  // Generate sharing URLs
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;

  // Handle native sharing if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
        toast.success("Shared successfully");
        setIsOpen(false);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to copy link if native sharing is not available
      handleCopyLink();
    }
  };

  // Handle copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl).then(
      () => {
        toast.success("Link copied to clipboard");
        setIsOpen(false);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy link");
      },
    );
  };

  // Handle opening share links
  const handleShareClick = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "width=600,height=400");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="grid gap-1">
          <h4 className="mb-1 font-medium">Share this event</h4>

          {/* Native Share API button */}
          {navigator.share && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={handleNativeShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          {/* Facebook */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => handleShareClick(facebookUrl)}
          >
            <Facebook className="mr-2 h-4 w-4 text-blue-600" />
            Facebook
          </Button>

          {/* Twitter/X */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => handleShareClick(twitterUrl)}
          >
            <X className="mr-2 h-4 w-4" />
            Twitter
          </Button>

          {/* LinkedIn */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => handleShareClick(linkedinUrl)}
          >
            <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
            LinkedIn
          </Button>

          {/* Email */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => handleShareClick(emailUrl)}
          >
            <Mail className="mr-2 h-4 w-4 text-gray-600" />
            Email
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          {/* Copy Link */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={handleCopyLink}
          >
            <LinkIcon className="mr-2 h-4 w-4 text-gray-600" />
            Copy Link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
