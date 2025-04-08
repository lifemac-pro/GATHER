"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QRGeneratorProps {
  eventId: string;
  attendeeId: string;
  eventName: string;
}

export function QRGenerator({ eventId, attendeeId, eventName }: QRGeneratorProps) {
  const qrData = JSON.stringify({ eventId, attendeeId });

  const handleDownload = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `${eventName}-ticket.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Event QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <QRCodeSVG
          id="qr-code"
          value={qrData}
          size={200}
          level="H"
          includeMargin
        />
        <Button onClick={handleDownload}>Download QR Code</Button>
      </CardContent>
    </Card>
  );
}
