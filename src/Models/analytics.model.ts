import db from "../Db/db";

const analyticsModel = {
  async getPeakHour() {
    const peakHours = await db.$queryRaw`
       SELECT
         DATE_PART('hour', generate_series) AS hour,
         COUNT(*)::integer AS active_reservations
       FROM generate_series(
         DATE_TRUNC('day', CURRENT_DATE),
         DATE_TRUNC('day', CURRENT_DATE) + INTERVAL '23 hours',
         INTERVAL '1 hour'
       ) AS generate_series    
       LEFT JOIN "Reservation" r ON r."startTime" <= generate_series AND r."endTime" > generate_series
       GROUP BY hour
       ORDER BY active_reservations DESC
    --    LIMIT 1;
    `;
    return peakHours;
  },

  async getTotalActiveReservations(providerId: string) {
    const result = await db.reservation.count({
      where: {
        spot: {
          zone: {
            lot: {
              providerId: providerId,
            },
          },
        },
        status: "ACTIVE",
      },
    });
    return result;
  },

  async getCurrentlyAssignedValets(lotId: string) {
    const parkingValets = await db.valetTicket.count({
      where: {
        status: "IN_PROGRESS",
        issuer: {
          lotId,
        },
      },
    });
    const retrievingValets = await db.valetTicket.count({
      where: {
        claimedBy: {
          not: null,
        },
        status: "VEHICLEREQUESTED",
        issuer: {
          lotId,
        },
      }
    });
    return {parkingValets, retrievingValets};
  },
};

export default analyticsModel;
