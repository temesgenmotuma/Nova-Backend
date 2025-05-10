import db from "../Db/db";
import { SpotStatus } from "@prisma/client";

import { nearbyLotsQueryType } from "../Controllers/lot.controller";

interface createLot {
  name: string;
  capacity: number;
  location: {
    latitude: number;
    longitude: number;
  };
  // address: {
  //   region: string;
  //   city: string;
  //   woreda: string;
  // street: string;
  // };
  spot: {
    numberOfSpots: number;
    startingNumber: number;
    name: string;
    floor: number;
  };
}

const lotModel = {
  async getLotsOfCurrProvider(providerId: string) {
    return await db.lot.findMany({
      where: {
        providerId: providerId,
      },
      omit:{
        providerId: true,
      }
    });
  },

  //create a lot and the spots associated with the lot
  async createLot(lot: createLot, providerId: string) {
    const {
      name: lotName,
      capacity,
      location: { latitude, longitude },
      // spot: { name: spotName, numberOfSpots, floor, startingNumber },
    } = lot;

    const result = await db.$transaction(async (tx) => {
      const lot = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO "Lot" (id, name, "providerId", location, capacity, "updatedAt") 
        VALUES (
          gen_random_uuid(), 
          ${lotName}, 
          ${providerId}, 
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326), 
          ${capacity}, 
          NOW()
        ) 
        RETURNING id;
      `;
      return lot[0];
      /*const id = lot[0]?.id;

      let spots;
      if (numberOfSpots > 0) {
        const spotsArray = Array.from({ length: numberOfSpots }).map(
          (_, i) => ({
            name: `${spotName}${startingNumber + i}`,
            floor: floor,
            status: SpotStatus.Available,
            zoneId: id,
          })
        );
        spots = await tx.spot.createManyAndReturn({
          data: spotsArray,
        });
      }
      return spots; 
      */
    });

    return result;
  },

  async getSpotsByLot(provId: string, lotId: string) {
    //is the providerId filter redundant?
    return await db.spot.findMany({
      where: {
        zone:{
          lot:{
            id: lotId,
            providerId: provId,
          }          
        }
      },
    });
  },

  async getNearbylots(area: nearbyLotsQueryType) {
    const {location: { longitude, latitude }, radius} = area;

    return await db.$queryRaw`
      SELECT name, ST_AsText(location) AS location 
      FROM "Lot" 
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}),4326),
        ${radius}
      )  
    `;
  },

  async getZonesByLot(lotId: string) {
    return await db.zone.findMany({
      where: {
        lotId: lotId,
        deletedAt: null,
      },
      // include: {
      //   spots: {
      //     select: {
      //       id: true,
      //       name: true,
      //       floor: true,
      //     },
      //   },
      // },
    });
  }
};


export default lotModel;
