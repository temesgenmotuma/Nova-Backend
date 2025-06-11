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
    const short = `${response.data.address.road} ${response.data.address.suburb}`; 
    return response.data.display_name || null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}

export {reverseGeocode};
