import db from "../Db/db";

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
  // };
}

const lotModel = {
  async createLot(lot: createLot) {
    const {name, location: {latitude, longitude}} = lot;
    await db.$executeRaw`
        INSERT INTO lot (name, location, capacity) 
        VALUES (${name}, ST_SetSRID(ST_MAKEPOINT(longitude, latitude), 4326), ${lot.capacity})
        RETURNING *;`;
  },
};

export default lotModel;
