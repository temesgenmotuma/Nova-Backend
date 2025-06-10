import axios from "axios";

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon,
          format: "json",
        },
      }
    );
    return `${response.data.address.road} ${response.data.address.suburb}` || null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}

export {reverseGeocode};
