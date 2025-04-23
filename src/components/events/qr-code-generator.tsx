"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Share2, Printer, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface QRCodeGeneratorProps {
  eventId: string;
  eventName: string;
  attendeeId?: string;
  attendeeName?: string;
  ticketId?: string;
}

export function QRCodeGenerator({
  eventId,
  eventName,
  attendeeId,
  attendeeName,
  ticketId,
}: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [qrValue, setQrValue] = useState("");
  const [qrSize, setQrSize] = useState(256);
  const [activeTab, setActiveTab] = useState("event");
  const [customData, setCustomData] = useState("");

  // Generate QR code data based on props and active tab
  useEffect(() => {
    if (activeTab === "event") {
      // For event check-in
      setQrValue(
        JSON.stringify({
          type: "event",
          eventId,
          eventName,
        }),
      );
    } else if (activeTab === "attendee" && attendeeId) {
      // For specific attendee check-in
      setQrValue(
        JSON.stringify({
          type: "attendee",
          eventId,
          eventName,
          attendeeId,
          attendeeName,
          ticketId,
        }),
      );
    } else if (activeTab === "custom") {
      // Custom data
      setQrValue(customData || `Event: ${eventName}`);
    }
  }, [
    activeTab,
    eventId,
    eventName,
    attendeeId,
    attendeeName,
    ticketId,
    customData,
  ]);

  // Handle download QR code as PNG
  const handleDownload = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${eventName.replace(/\s+/g, "-")}-qrcode.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    toast({
      title: "QR Code Downloaded",
      description: "The QR code has been downloaded as a PNG file.",
    });
  };

  // Handle print QR code
  const handlePrint = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description:
          "Unable to open print window. Please check your popup settings.",
        variant: "destructive",
      });
      return;
    }

    const pngUrl = canvas.toDataURL("image/png");

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code for ${eventName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            p {
              font-size: 16px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${eventName}</h1>
            <p>Scan this QR code for event check-in</p>
            <img src="${pngUrl}" alt="QR Code" />
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Add a slight delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Handle copy QR data to clipboard
  const handleCopyData = () => {
    navigator.clipboard.writeText(qrValue).then(
      () => {
        toast({
          title: "QR Data Copied",
          description: "The QR code data has been copied to your clipboard.",
        });
      },
      (err) => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy QR data: " + err,
          variant: "destructive",
        });
      },
    );
  };

  // Handle share QR code
  const handleShare = async () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    // Convert canvas to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });

    if (!blob) {
      toast({
        title: "Share Failed",
        description: "Failed to generate image for sharing.",
        variant: "destructive",
      });
      return;
    }

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        const file = new File([blob], `${eventName}-qrcode.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: `QR Code for ${eventName}`,
          text: "Scan this QR code for event check-in",
          files: [file],
        });

        toast({
          title: "QR Code Shared",
          description: "The QR code has been shared successfully.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Share Failed",
          description: "Failed to share QR code.",
          variant: "destructive",
        });
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleDownload();
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Event QR Code</CardTitle>
        <CardDescription>Generate QR codes for event check-in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger
              value="attendee"
              disabled={!attendeeId}
              title={!attendeeId ? "Attendee information not available" : ""}
            >
              Attendee
            </TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="space-y-4">
            <div className="py-2 text-center">
              <p className="text-sm text-muted-foreground">
                This QR code can be used for general event check-in
              </p>
            </div>
          </TabsContent>

          <TabsContent value="attendee" className="space-y-4">
            <div className="py-2 text-center">
              <p className="text-sm font-medium">
                {attendeeName || "Attendee"}
              </p>
              <p className="text-xs text-muted-foreground">
                Ticket: {ticketId || "N/A"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-data">Custom QR Data</Label>
              <Input
                id="custom-data"
                placeholder="Enter custom data for QR code"
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter any text or URL you want to encode in the QR code
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center py-4">
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG
              id="qr-code"
              value={qrValue}
              size={qrSize}
              level="H" // High error correction
              includeMargin={true}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-2">
            <Label htmlFor="qr-size" className="col-span-2 text-center">
              QR Code Size
            </Label>
            <Input
              id="qr-size"
              type="range"
              min="128"
              max="512"
              step="32"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="col-span-1"
            />
            <Input
              type="number"
              min="128"
              max="512"
              step="32"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="col-span-1 w-20"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleCopyData}
        >
          <Copy className="h-4 w-4" />
          Copy Data
        </Button>
      </CardFooter>
    </Card>
  );
}
