import cron from "node-cron";
import reservationModel from "../Models/reservation.model";
import alertModel from "../Models/alert.model";

const updateReservationTask = cron.schedule("* * * * *", async () => {
  try {
    console.log(`[CRON] Reservation expiry check running at: ${new Date().toISOString()}`);
    await createReservationExpiryAlert();
  } catch (error) {
    console.error("[CRON] Error during reservation expiry check:", error);
  }
});

updateReservationTask.start();

async function createReservationExpiryAlert() {
  await alertModel.reservationExpiryAlert();
}

async function updateReservation() {
  const expiredReservations =
    await reservationModel.softDeleteExpiredReservations();
}

export default updateReservationTask;
