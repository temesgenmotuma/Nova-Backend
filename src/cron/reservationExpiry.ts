import cron from "node-cron";
import reservationModel from "../Models/reservation.model";

const updateReservationTask = cron.schedule("* * * * *", async () => {
  try {
    await updateReservation();
  } catch (error) {}
});

async function updateReservation() {
  const expiredReservations = await reservationModel.softDeleteExpiredReservations();
}

