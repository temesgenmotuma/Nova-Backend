import db from "../Db/db";

import { nearbyLotsQueryType } from "../Controllers/lot.controller";
import { createLotType } from "../Controllers/lot.controller";

const constructSortString = (sortBy: string, lng: any, lat: any, location: any) => {
  let sortString: string = "";
  if (sortBy === "distance") {
    sortString = `
      ORDER BY ST_Distance(location, ST_SetSRID(ST_MAKEPOINT(${lng}, ${lat}), 4326));
    `;
  }
  if (sortBy === "price") {
    sortString = `
      ORDER BY price;
    `;
  }
  return sortString;
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

  async createLot(lot: createLotType, providerId: string) {
    const {
      name: lotName,
      capacity,
      location: { latitude, longitude },
      description,
      hasValet
      // spot: { name: spotName, numberOfSpots, floor, startingNumber },
    } = lot;

    const result = await db.$transaction(async (tx) => {
      const lot = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO "Lot" (id, name, "providerId", location, capacity, "updatedAt", description, "hasValet") 
        VALUES (
          gen_random_uuid(), 
          ${lotName}, 
          ${providerId}, 
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326), 
          ${capacity}, 
          NOW(),
          ${description || null},
          ${hasValet|| false}
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

  async getLotsWithinDistance(area: nearbyLotsQueryType) {
    const { longitude, latitude, radius, sortBy } = area;
    const orderByColumn = sortBy === 'price' ? 'price' : 'ST_Distance(location, ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326))';

    //TODO: Add sortBy to the query
    return await db.$queryRaw`
      SELECT 
        l.name, 
        l.price, 
        ST_AsText(l.location) AS location, 
        l.description, 
        l.hasValet, 
        r.rating 
      FROM 
        "Lot" l JOIN 
        "Review" r ON l.id = r."lotId" 
      WHERE 
        ST_DWithin(
          l.location,
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326),
          ${radius}
        ) 
      -- ORDER BY 
      --   ${orderByColumn};
    `;
  },

  async getLotsInBoundingBox(body: any) {
    const { sw, ne, sortBy } = body;
    let sortString : string = constructSortString(sortBy, sw.lng, sw.lat,'location');
    
    const parkingLots = await db.$queryRaw`
      SELECT id, name, price, availability, location
      FROM parking_lots
      WHERE ST_Contains(
        ST_MakeEnvelope(${sw.lng}, ${sw.lat}, ${ne.lng}, ${ne.lat}, 4326),
        location
      )
      ${sortString}
    `;
    return parkingLots;
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
