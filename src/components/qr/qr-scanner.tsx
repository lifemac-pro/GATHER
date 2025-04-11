"use client";

import { useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (data: { eventId: string; attendeeId: string }) => Promise<void>;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const codeReader = new BrowserQRCodeReader();

      // Get video element
      const video = document.getElementById("qr-video") as HTMLVideoElement;
      setVideoElement(video);

      // Start scanning
      await codeReader.decodeFromVideoDevice(
        undefined,
        video,
        async (result) => {
          if (result) {
            try {
              const data = JSON.parse(result.getText());
              if (data.eventId && data.attendeeId) {
                await onScan(data);
                // Stop scanning
                setIsScanning(false);
              }
            } catch (error) {
              toast.error("Invalid QR code");
            }
          }
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Error accessing camera");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (videoElement) {
      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoElement.srcObject = null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isScanning ? (
          <div className="w-full max-w-sm">
            <video
              id="qr-video"
              className="w-full rounded-lg"
              style={{ maxWidth: "100%" }}
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={stopScanning}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={startScanning}>Start Scanning</Button>
        )}
      </CardContent>
    </Card>
  );
}
