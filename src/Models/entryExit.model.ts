import db from "Db/db";
import reservationModel from "./reservation.model";

const entryExitModel = {
    async nonReservationEntry(){
        // const ticket = await db.entryTicket.create({
        //     data:{
        //      }   
        // });
    },

    async assignSpot(lotId: string, entryTime: Date) {
        // const freeSpots = await reservationModel.checkAvailability();
    }
};

export default entryExitModel;