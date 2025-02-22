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
            SELECT gen_random_uuid(), 
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
};

export default spotModel;
