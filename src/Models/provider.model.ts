import db from "../Db/db";

const providerModel = {
    async getLotsByProvider(providerId: string){
        return await db.lot.findMany({
          where:{
            providerId: providerId
          }
        })
      }
};

export default providerModel;