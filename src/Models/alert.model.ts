import db from "../Db/db";

const alertModel = {
  async reservationExpiryAlert() {
    try {
      const expiredReservations = await db.reservation.findMany({
        where: {
          status: "ACTIVE",
          endTime: {
            lt: new Date(),
          },
          alerts: {
            none: {
              type: "RESERVATION_EXPIRY",
            },
          },
        },
        include: {
          vehicle: {
            include: {
              customer: true,
            },
          },
        },
      });

      if (expiredReservations.length > 0) {
        for (const reservation of expiredReservations) {
          await db.alert.create({
            data: {
              type: "RESERVATION_EXPIRY",
              reservationId: reservation.id,
              vehicleId: reservation.vehicleId,
              customerId: reservation.vehicle.customer?.id || null,
              value: {
                startTime: reservation.startTime,
                endTime: reservation.endTime,
                licensePlate: reservation.vehicle.licensePlateNumber,
              },
            },
          });
        }
      }
    } catch (error) {
      throw new Error(
        "Failed to fetch expired reservations." + (error as Error).message
      );
    }
  },
};

export default alertModel;
