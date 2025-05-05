import db from "../Db/db";
import { zoneCreateSpot } from "../Controllers/zone.controller";
import { Prisma } from "@prisma/client";
type SpotCreateManyZoneInput = Prisma.SpotCreateManyZoneInput;

const zoneModel = {
  async createZone(
    spot: zoneCreateSpot,
    name: string,
    capacity: number,
    lotId: string
  ) {
    
    let spots: Omit<zoneCreateSpot, "numberOfSpots">[] = [];
    if (spot) {
      spots.push(
        ...Array.from({ length: spot.numberOfSpots }, (_, i) => ({
          name: `${spot.name}${spot.startingNumber + i}`,
          floor: spot.floor || 1,
        }))
      );
    }
    const zone = await db.zone.create({
      data: {
        name: name,
        totalNumberOfSpots: capacity,
        lotId: lotId,
        spots: {
          createMany: {
            data: spots.filter(
              (spot): spot is SpotCreateManyZoneInput => spot !== undefined
            ),
          },
        },
      },
      include: {
        spots: {
          select: {
            name: true,
            floor: true,
          },
        },
      },
    });
    return zone;
  },
};

export default zoneModel;
