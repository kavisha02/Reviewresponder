/**
 * API Route: POST /api/validate-google-maps-url
 *
 * Validates that a Google Maps URL is valid and contains a business listing.
 * Extracts the business name from the URL or page metadata.
 *
 * Request body: { url: string }
 * Response:     { businessName: string } or error
 */

import { NextResponse } from "next/server";

function extractBusinessNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check if it's a Google Maps URL
    if (!urlObj.hostname.includes("google.com") || !urlObj.pathname.includes("/maps")) {
      return null;
    }

    // Extract business name from URL
    // Format: https://www.google.com/maps/place/Business+Name/@lat,lng
    const pathParts = urlObj.pathname.split("/");
    const placeIndex = pathParts.indexOf("place");

    if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
      let businessName = pathParts[placeIndex + 1];

      // Decode URL encoding and replace + with spaces
      businessName = decodeURIComponent(businessName).replace(/\+/g, " ");

      // Remove coordinates if present (format: BusinessName/@lat,lng)
      if (businessName.includes("@")) {
        businessName = businessName.split("@")[0];
      }

      // Clean up the name
      businessName = businessName.trim();

      if (businessName.length > 0) {
        return businessName;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if it's a Google Maps URL
    if (!url.includes("google.com/maps")) {
      return NextResponse.json(
        { error: "Please provide a valid Google Maps business URL (e.g., https://www.google.com/maps/place/...)" },
        { status: 400 }
      );
    }

    // Extract business name from URL
    const businessName = extractBusinessNameFromUrl(url);

    if (!businessName) {
      return NextResponse.json(
        { error: "Could not extract business name from URL. Make sure you copied the full Google Maps business URL." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      businessName,
      url,
    });
  } catch (err) {
    console.error("URL validation error:", err);
    return NextResponse.json(
      { error: "Failed to validate URL" },
      { status: 500 }
    );
  }
}
