import db from "../Db/db";

const spotModel = {
  async createSpot(
    name: string,
    number: number,
    floor: number,
    startingNumber: number,
    lotId: string
  ) {
    
    return await db.$queryRaw`
      INSERT INTO "Spot" (id, name, floor, status, "lotId", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid(), 
          CONCAT(${name}::text, n) AS name,
          ${floor}::int,
          'Available'::"SpotStatus", 
          ${lotId},
          NOW(),
          NOW()
        FROM generate_series(COALESCE(${startingNumber}, 1)::int, ${
      startingNumber + number - 1
    }::int) AS n
        RETURNING *;
    `;
  },

  async getSpotById(id: string) {
    return await db.spot.findUnique({
      where: {
        id,
      },
    });
  },

  async updateSpot(spotId: string, name: string, floor: number) {
    return await db.spot.update({
      where: {
        id: spotId,
      },
      data: {
        ...(name && { name }),
        ...(floor && { floor }),
      },
    });
  },

  async checkAvailability(lotId: string) {
    return await db.spot.findFirst({
      where: {
        lotId: lotId,
        status: "Available",
      },
    });
  },

  async reserve(spotId: string, vehicleId: string) {
    const result = db.$transaction(async(tx) => {
      
    })
  }
};

export default spotModel;
