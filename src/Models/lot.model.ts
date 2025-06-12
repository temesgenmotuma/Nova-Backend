import path from "path";

import db from "../Db/db";
import { nearbyLotsQueryType } from "../Controllers/lot.controller";
import { createLotType } from "../Controllers/lot.controller";
import ModelError from "./ModelError";
import {reverseGeocode} from "../utils/reverseGeocode";

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

  async createLot(lot: createLotType, providerId: string, address: string|null, images: Express.Multer.File[] ) {
    const {
      name: lotName,
      capacity,
      location: { latitude, longitude },
      description,
      hasValet,
    } = lot;

    const imagePathsToStore = images
      .filter((image) => {
        const baseName = path.basename(image.path);
        const extName = path.extname(image.path);
        return !baseName.startsWith("blob") && extName !== "";
      })
      .map((image) => {
        return path.basename(image.path);
      });

    const result = await db.$transaction(async (tx) => {
      const lot = await tx.$queryRaw<{ id: string, address:string }[]>`
        INSERT INTO "Lot" (id, name, "providerId", location, capacity, "updatedAt", description, "hasValet", address, images) 
        VALUES (
          gen_random_uuid(), 
          ${lotName}, 
          ${providerId}, 
          ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326), 
          ${capacity}, 
          NOW(),
          ${description || null},
          ${hasValet || false},
          ${address},
          ${imagePathsToStore}::text[]
        ) 
        RETURNING id, address::text;
      `;
      return lot[0];
    });

    return result;
  },

  async getLotById(lotId: string) {

    const lot = await db.$queryRaw<{
      id: string;
      name: string;
      capacity: number;
      longitude: number;
      latitude: number;
      description: string | null;
      hasValet: boolean;
      address: string | null;
      images: string[] | null;
      providerId: string;
      }[]>`
      SELECT 
        id, 
        name, 
        capacity, 
        ST_X(location) AS longitude, 
        ST_Y(location) AS latitude, 
        description, 
        "hasValet", 
        address,
        images,
        "providerId" 
      FROM "Lot" 
      WHERE id = ${lotId};
    `;

    return lot;
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

  async updateLot(lotId: string, providerId: string, lot: any, images: Express.Multer.File[]) {
    const { name, capacity, description, hasValet } = lot;

    //capacity and numberOfSpots checkkk

    const validLot = await db.lot.findUnique({
      where: { 
        id: lotId,
       },
      select: { 
        providerId: true,
       },
    }); 

    if (!validLot) {
      throw new ModelError("Lot not found", 404);
    }

    if( validLot.providerId !== providerId) {
      throw new ModelError("You are not authorized to update this lot", 403);
    }

    const imagePathsToStore = images
      .filter((image) => {
        const baseName = path.basename(image.path);
        const extName = path.extname(image.path);
        return !baseName.startsWith("blob") && extName !== "";
      })
      .map((image) => {
        return path.basename(image.path);
      });

    const result = await db.$transaction(async (tx) => {
      const updatedLot = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "Lot" 
        SET 
          name = COALESCE(${name}, "name"), 
          capacity = COALESCE(${capacity}, "capacity"), 
          description = COALESCE(${description || null}, "description"), 
          "hasValet" = COALESCE(${hasValet}, "hasValet"),
          images = ARRAY_CAT("images", ${imagePathsToStore}::text[]),
          "updatedAt" = NOW()
        WHERE id = ${lotId}
        RETURNING id;
      `;
      return updatedLot[0];
    });

    return result;
  },

  async getLotsWithinDistance(area: nearbyLotsQueryType) {
    const { longitude, latitude, radius, sortBy } = area;
    let lots:any = [];
    if(sortBy === 'distance') {
      lots =  await db.$queryRaw`
        SELECT 
          l.id,
          l.name, 
          p."minPrice" AS price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,
          ST_Distance(l.location, ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography) as distance,
          l.description, 
          l."hasValet",
          l.address,
          l.images, 
          COUNT(*) OVER()::integer AS total_count,
          AVG(r.rating) AS average_rating
        FROM 
          "Lot" l 
        LEFT JOIN 
          "Review" r ON l.id = r."lotId" 
        LEFT JOIN
          "Pricing" p ON l.id = p."lotId"
        WHERE 
          ST_DWithin(
            l.location,
            ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography,
            ${radius}
          )
        GROUP BY
          l.id, l.name, l.location, l.description, l."hasValet", l.images, p."minPrice", l.address
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
          p."minPrice" AS price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,
          l.description, 
          l."hasValet", 
          l.images,
          l.address,
          COUNT(*) OVER()::integer AS total_count,
          AVG(r.rating) AS average_rating
        FROM 
          "Lot" l LEFT JOIN 
          "Review" r ON l.id = r."lotId" 
          LEFT JOIN
          "Pricing" p ON l.id = p."lotId"
        WHERE 
          ST_DWithin(
            l.location,
            ST_SetSRID(ST_MAKEPOINT(${longitude}, ${latitude}), 4326)::geography,
            ${radius}
          ) 
        GROUP BY
          l.id, l.name, l.location, l.description, l."hasValet", l.images, p."minPrice", l.address
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
          l.address,
          COUNT(*) OVER()::integer AS total_count,
          AVG(r.rating) AS average_rating
        FROM 
          "Lot" l LEFT JOIN 
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

    const formattedLots: any[] = [];
    for (const lot of lots) {
      let address =
        lot.address ||
        (await reverseGeocode(lot.latitude, lot.longitude)) ||
        null;

      formattedLots.push({
        id: lot.id,
        name: lot.name,
        longitude: lot.longitude,
        latitude: lot.latitude,
        ...((!!lot.distance || lot.distance === 0) && {
          distance: lot.distance,
        }),
        price: lot.price,
        description: lot.description,
        hasValet: lot.hasValet,
        images: lot.images || [],
        rating: lot.average_rating ? Number(lot.average_rating) : null,
        address,
      });
    }

    return {
      count: lots.length !== 0 ? lots[0]?.total_count : 0,
      lots: formattedLots
    };
  },

  async searchLotsByName(query: string, limit: number = 10, offset: number = 0) {
    const lots:any[] = await db.$queryRaw`
        SELECT 
          l.id,
          l.name, 
          -- price, 
          ST_X(l.location) AS longitude, 
          ST_Y(l.location) AS latitude,
          l.description, 
          l."hasValet",
          l.images,
          l.address, 
          AVG(r.rating) AS average_rating
        FROM 
          "Lot" l LEFT JOIN 
          "Review" r ON l.id = r."lotId" 
        WHERE
          name ILIKE '%'||${query}||'%' 
        GROUP BY
          l.id, l.name, l.location, l.description, l."hasValet", l.images, l.address
        limit ${limit} 
        OFFSET ${offset}
    `;

    const totalCountResult: any[] = await db.$queryRaw`
      SELECT COUNT(id)::integer AS total_lots_found
      FROM "Lot"
      WHERE name ILIKE '%'||${query}||'%';
    `;

    const searchedLots: any[] =[];
    for (const lot of lots) {
      let address = 
        lot.address ||
        (await reverseGeocode(lot.latitude, lot.longitude)) ||
        null;

      searchedLots.push({
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        description: lot.description,
        hasValet: lot.hasValet,
        images: lot.images,
        rating: lot.average_rating || null,
        address,
      });
    } 
    
    return {
      count: totalCountResult[0]?.total_lots_found || 0,
      lots: searchedLots,
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
    const lots:any[] = await db.$queryRaw`
      SELECT 
        l.id,
        l.name, 
        -- price, 
        ST_X(l.location) AS longitude, 
        ST_Y(l.location) AS latitude,
        l.description, 
        l."hasValet",
        l.address,
        l.images,
        AVG(r.rating) AS rating 
      FROM 
        "FavoriteLot" fl JOIN
        "Lot" l ON fl."lotId" = l.id LEFT JOIN
        "Review" r ON l.id = r."lotId"
      WHERE
        fl."customerId" = ${customerId}
      GROUP BY
        l.id, l.name, l.location, l.description, l."hasValet", l.images, l.address
      ;
    `;

    const count = await db.favoriteLot.count({
      where: { customerId },
    });

    const finalLots: any[] =[];
    for (const lot of lots) {
      let address =
        lot.address || 
        (await reverseGeocode(lot.latitude, lot.longitude)) ||
        null;

      finalLots.push({
        id: lot.id,
        name: lot.name,
        latitude: lot.latitude,
        longitude: lot.longitude,
        description: lot.description,
        hasValet: lot.hasValet,
        images: lot.images || [],
        rating: lot.rating || null,
        address,
      });
    } 
    
    return {
      count,
      lots: finalLots
    }
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