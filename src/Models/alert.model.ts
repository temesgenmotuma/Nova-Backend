import db from "../Db/db";
import ModelError from "../Models/ModelError";
import { GetAlertsQueryType } from "../Controllers/alert.controller"; 

const alertModel = {
  async getAlerts(getAlertsQuery: GetAlertsQueryType) {
    const { type, lotId, zoneId, limit, offset } = getAlertsQuery;

    const zoneFilter: any = {};
    if (zoneId) zoneFilter.id = zoneId;
    if (lotId) zoneFilter.lot = { id: lotId };

    const whereFilter = {
      ...(type && { type }),
      ...(zoneId || lotId
        ? {
            reservation: {
              spot: {
                zone: zoneFilter,
              },
            },
          }
        : {}),
    };

    const alerts = await db.alert.findMany({
      where: whereFilter,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        vehicle: true,
        reservation: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            spot: {
              select: {
                id: true,
                name: true,
                zone: {
                  select: {
                    id: true,
                    name: true,
                    lot: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              include: {
                zone: true,
              },
            },
          },
        },
      },
    });

    const count = await db.alert.count({
      where: whereFilter,
    });

    return { count, alerts };
  },
  
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
      throw new ModelError(
        "Failed to fetch expired reservations." + (error as Error).message, 500
      );
    }
  },
};

export default alertModel;
