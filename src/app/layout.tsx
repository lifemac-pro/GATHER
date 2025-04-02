import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GatherEase",
  description: "Your personal event management assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
