import db from "../Db/db";
import { getSpotsOfZone, zoneCreateSpot } from "../Controllers/zone.controller";
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

  async getSpotsOfZone(zoneId: string) {
    return await db.spot.findMany({
      where: {
        zoneId: zoneId,
      },
    });
  },

  async getZoneById(zoneId: string) {
    return await db.zone.findUnique({
      where: {
        id: zoneId,
      },
      include: {
        spots: {
          select: {
            id: true,
            name: true,
            floor: true,
            status: true,
          },
        },
      },
    });
  },
};

export default zoneModel;
