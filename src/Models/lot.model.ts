import db from "../Db/db";

import { nearbyLotsQueryType } from "../Controllers/lot.controller";
import { createLotType } from "../Controllers/lot.controller";
import ModelError from "./ModelError";
import path from "path";

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
    return await db.$queryRaw`
      SELECT 
        id, 
        name,
        capacity, 
        St_X(location) as latitude, 
        ST_Y(location) as longitude, 
        description, 
        "hasValet", 
        "createdAt", 
        "updatedAt"
      FROM "Lot" 
      WHERE "providerId" = ${providerId};
    `;
  },

  async createLot(lot: createLotType, providerId: string, images: Express.Multer.File[] ) {
    const {
      name: lotName,
      capacity,
      location: { latitude, longitude },
      description,
      hasValet,
      // spot: { name: spotName, numberOfSpots, floor, startingNumber },
    } = lot;

    const imagePathsToStore = images.map((image) => {
      return path.basename(image.path);
    });

    const result = await db.$transaction(async (tx) => {
      const lot = await tx.$queryRaw<{ id: string }[]>`
        INSERT INTO "Lot" (id, name, "providerId", location, capacity, "updatedAt", description, "hasValet", images) 
        VALUES (
          gen_random_uuid(), 
          ${lotName}, 
          ${providerId}, 
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326), 
          ${capacity}, 
          NOW(),
          ${description || null},
          ${hasValet || false},
          ${imagePathsToStore}::text[]
        ) 
        RETURNING id;
      `;
      return lot[0];
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
    let lots:any = [];
    if(sortBy === 'distance') {
      lots =  await db.$queryRaw`
        SELECT 
          l.id,
          l.name, 
          -- l.price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,
          ST_Distance(l.location, ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography) as distance,
          l.description, 
          l."hasValet",
          l.images, 
          r.rating,
          COUNT(*) OVER()::integer AS total_count
        FROM 
          "Lot" l LEFT JOIN 
          "Review" r ON l.id = r."lotId" 
        WHERE 
          ST_DWithin(
            l.location,
            ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography,
            ${radius}
          ) 
        ORDER BY 
          ST_Distance(l.location, ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography)
        ;
      `;
    }
    
    else if(sortBy === 'price') {
      lots = await db.$queryRaw`
        SELECT 
          l.id,
          l.name, 
          -- l.price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,, 
          l.description, 
          l."hasValet", 
          l.images,
          r.rating 
          COUNT(*) OVER()::integer AS total_count,
        FROM 
          "Lot" l JOIN 
          "Review" r ON l.id = r."lotId" 
        WHERE 
          ST_DWithin(
            l.location,
            ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography,
            ${radius}
          ) 
        ORDER BY 
          l.price;
    `;
    }
    else if(!sortBy) {
      lots = await db.$queryRaw`
        SELECT 
          l.id
          l.name, 
          -- l.price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,
          l.description, 
          l."hasValet", 
          l.images,
          r.rating 
          COUNT(*) OVER()::integer AS total_count,
        FROM 
          "Lot" l JOIN 
          "Review" r ON l.id = r."lotId" 
        WHERE 
          ST_DWithin(
            l.location,
            ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography,
            ${radius}
          );
      `;
    }
    else{
      throw new ModelError("Invalid sortBy value. Use 'distance' or 'price'.", 400);
    }

    return {
      count: lots.length !== 0 ? lots[0]?.total_count : 0,
      lots: lots.map((lot: any) => ({
        id: lot.id,
        name: lot.name,
        longitude: lot.longitude,
        latitude: lot.latitude,
        ...((!!lot.distance || lot.distance === 0) && { distance: lot.distance }),
        description: lot.description,
        hasValet: lot.hasValet,
        images: lot.images || [],
        rating: lot.rating || null,
      })),
    };

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
  },

  async addFavoriteLot(customerId: string, lotId: string) {
    await db.favoriteLot.create({
      data: {
        customerId,
        lotId,
      },
    });
  },

  async removeFavoriteLot(customerId: string, lotId: string) {
    await db.favoriteLot.delete({
      where: { 
        customer_lot_unique:{
          customerId,
          lotId,
        }
      },
    });
  },

  async getFavoriteLots(customerId: string) {
    return await db.favoriteLot.findMany({
      where: { customerId },
      include: {
        lot: {
          select: {
            id: true,
            name: true,
            capacity: true,
            description: true,
            hasValet: true,
            images: true,
          },
        },
      },
    });
  },
  async isLotFavoritedByCustomer(customerId: string, lotId: string) {
    const favorite = await db.favoriteLot.findUnique({
      where: {
        customer_lot_unique: {
          customerId,
          lotId,
        },
      },
    });
    return !!favorite; 
  },  
};

export default lotModel;

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