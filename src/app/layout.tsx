import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "S27 Events — Senior 2027 Events",
    template: "%s · S27 Events",
  },
  description:
    "The official ticketing platform for Senior 2027 events — Halloween parties, prom, senior celebrations, and fundraisers. One year. Every event. Your ticket to unforgettable experiences.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "S27 Events",
    description:
      "One year. Every event. Your ticket to unforgettable experiences.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
