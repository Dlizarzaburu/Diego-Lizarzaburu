import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scanner",
  description: "S27 Events entrance scanner for authorized staff.",
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-ink-950">{children}</div>;
}
