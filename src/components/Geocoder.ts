export interface LocationResult {
  lat: number;
  lon: number;
}

export async function geocodeAddress(
  address: string
): Promise<LocationResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );

    const data = await response.json();

    if (!data.length) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}