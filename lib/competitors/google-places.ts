/**
 * Google Places API integration for fetching competitor data
 */

export interface GooglePlacesPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  reviews: GooglePlacesReview[];
}

export interface GooglePlacesReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export async function searchGooglePlace(
  query: string
): Promise<GooglePlacesPlace | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const place = data.results[0];
    return {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      reviews: [],
    };
  } catch (error) {
    console.error("Error searching Google Place:", error);
    throw error;
  }
}

export async function fetchPlaceDetails(
  placeId: string
): Promise<GooglePlacesPlace | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,rating,user_ratings_total,reviews&key=${apiKey}`
    );

    const data = await response.json();

    if (!data.result) {
      return null;
    }

    const place = data.result;
    return {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
      reviews: place.reviews || [],
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
}

export function extractPlaceIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/place\/([^/@]+)/);
    if (match) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}
