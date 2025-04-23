"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, StopCircle, RefreshCw, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";

interface QRCodeScannerProps {
  eventId: string;
  onScanSuccess?: (data: any) => void;
}

export function QRCodeScanner({ eventId, onScanSuccess }: QRCodeScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [activeTab, setActiveTab] = useState("scan");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-container";

  // Attendee check-in mutation
  const checkInAttendee = api.attendee.checkIn.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Check-in Successful",
        description: `${data.attendeeName} has been checked in.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize scanner
  useEffect(() => {
    // Create scanner instance
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
    }

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(
            devices.map((device) => ({
              id: device.id,
              label: device.label || `Camera ${device.id}`,
            })),
          );
          // Set default camera to the first one
          if (!activeCamera) {
            setActiveCamera(devices[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setScanError("Unable to access camera. Please check permissions.");
      });

    // Cleanup on unmount
    return () => {
      if (
        scannerRef.current &&
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Handle starting the scanner
  const startScanner = async () => {
    if (!scannerRef.current || !activeCamera) return;

    setScanError(null);
    setScanResult(null);

    try {
      await scannerRef.current.start(
        activeCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        handleScanFailure,
      );
      setScanning(true);
    } catch (err) {
      console.error("Error starting scanner", err);
      setScanError("Failed to start camera. Please check permissions.");
    }
  };

  // Handle stopping the scanner
  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      setScanning(false);
    } catch (err) {
      console.error("Error stopping scanner", err);
    }
  };

  // Handle successful scan
  const handleScanSuccess = (decodedText: string) => {
    try {
      // Try to parse as JSON
      const parsedData = JSON.parse(decodedText);
      setScanResult(parsedData);

      // Process the scan result
      if (parsedData.type === "event" && parsedData.eventId === eventId) {
        toast({
          title: "Event QR Code Scanned",
          description: `Valid event code for: ${parsedData.eventName}`,
        });
      } else if (
        parsedData.type === "attendee" &&
        parsedData.eventId === eventId
      ) {
        // Process attendee check-in
        checkInAttendee.mutate({
          eventId: parsedData.eventId,
          attendeeId: parsedData.attendeeId,
          ticketId: parsedData.ticketId,
        });
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for this event.",
          variant: "destructive",
        });
      }

      // Call the onScanSuccess callback if provided
      if (onScanSuccess) {
        onScanSuccess(parsedData);
      }
    } catch (error) {
      // Not JSON, treat as plain text
      setScanResult({ type: "text", data: decodedText });
      toast({
        title: "QR Code Scanned",
        description: "Scanned text: " + decodedText,
      });

      // Call the onScanSuccess callback if provided
      if (onScanSuccess) {
        onScanSuccess({ type: "text", data: decodedText });
      }
    }

    // Stop scanning after successful scan
    stopScanner();
  };

  // Handle scan failure
  const handleScanFailure = (error: string) => {
    // Don't show errors for normal scanning process
    console.debug("Scan error (normal during scanning):", error);
  };

  // Switch camera
  const switchCamera = (cameraId: string) => {
    if (scanning) {
      stopScanner().then(() => {
        setActiveCamera(cameraId);
        startScanner();
      });
    } else {
      setActiveCamera(cameraId);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
        <CardDescription>Scan QR codes for event check-in</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">Scanner</TabsTrigger>
            <TabsTrigger value="result" disabled={!scanResult}>
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <div
              id={scannerContainerId}
              className="relative h-64 w-full overflow-hidden rounded-lg bg-muted"
            >
              {!scanning && !scanError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Camera is off. Click "Start Scanning" to begin.
                  </p>
                </div>
              )}

              {scanError && (
                <Alert variant="destructive" className="m-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}
            </div>

            {availableCameras.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-sm font-medium">Cameras:</span>
                {availableCameras.map((camera) => (
                  <Badge
                    key={camera.id}
                    variant={activeCamera === camera.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => switchCamera(camera.id)}
                  >
                    {camera.label.substring(0, 20)}
                    {camera.label.length > 20 ? "..." : ""}
                  </Badge>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {scanResult && (
              <div className="space-y-4">
                <Alert
                  variant={
                    scanResult.type === "attendee" &&
                    scanResult.eventId === eventId
                      ? "default"
                      : scanResult.type === "event" &&
                          scanResult.eventId === eventId
                        ? "default"
                        : "destructive"
                  }
                >
                  <div className="flex items-start gap-2">
                    {scanResult.type === "attendee" &&
                    scanResult.eventId === eventId ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : scanResult.type === "event" &&
                      scanResult.eventId === eventId ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <AlertTitle>
                        {scanResult.type === "attendee" &&
                        scanResult.eventId === eventId
                          ? "Valid Attendee QR Code"
                          : scanResult.type === "event" &&
                              scanResult.eventId === eventId
                            ? "Valid Event QR Code"
                            : "Invalid QR Code"}
                      </AlertTitle>
                      <AlertDescription>
                        {scanResult.type === "attendee" &&
                        scanResult.eventId === eventId
                          ? `Attendee: ${scanResult.attendeeName || "Unknown"}`
                          : scanResult.type === "event" &&
                              scanResult.eventId === eventId
                            ? `Event: ${scanResult.eventName || "Unknown"}`
                            : "This QR code is not valid for this event."}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>

                <div className="rounded-lg bg-muted p-3 text-sm">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(scanResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!scanning ? (
          <Button onClick={startScanner} className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <Button
            onClick={stopScanner}
            variant="destructive"
            className="flex items-center gap-1"
          >
            <StopCircle className="h-4 w-4" />
            Stop Scanning
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => {
            setScanResult(null);
            setScanError(null);
            setActiveTab("scan");
          }}
          disabled={!scanResult && !scanError}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}
