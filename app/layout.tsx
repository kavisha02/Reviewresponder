/**
 * Root Layout — wraps every page in the app.
 *
 * This file does three things:
 *  1. Sets the HTML lang attribute (important for accessibility + SEO)
 *  2. Loads global CSS (Tailwind base styles)
 *  3. Defines shared metadata (browser tab title, description)
 *
 * Every page.tsx you create is automatically wrapped by this layout.
 * You can add a shared Navbar or Footer here in later phases.
 */

import type { Metadata } from "next";
import "./globals.css";

// Metadata appears in the browser tab and search engine results
export const metadata: Metadata = {
  title: "ReviewResponder — AI-powered review management",
  description:
    "Monitor, respond to, and manage your Google Business reviews automatically using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
