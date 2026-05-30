import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BreedLink — Find Verified Cat Breeding Partners Safely",
  description: "BreedLink connects cat owners and breeders through verified profiles, AI matching, health certification verification, and secure breeding agreements. Start responsible cat breeding today.",
  keywords: "cat breeding, verified breeders, cat matching, pet adoption, breeding agreements, cat health, AI breeding assistant",
  openGraph: {
    title: "BreedLink — Find Verified Cat Breeding Partners Safely",
    description: "Connect with verified breeders, discover compatible cats, and manage breeding agreements responsibly.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
