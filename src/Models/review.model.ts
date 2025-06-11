import db from "../Db/db";

const reviewModel = {
  async createReview(customerId: string, lotId: string, rating: any, comment?: string) {
    return await db.review.create({
      data: {
        customerId,
        lotId,
        rating,
        comment,
      },
    });
  },

  async getReviews(lotId: string, limit: number = 10, offset: number = 0) {
    const reviews = await db.review.findMany({
      where: { lotId },
      take: limit,
      skip: offset,
      include: {
        customer: {
          select: { username: true, email: true },
        },
      },
    });
    const count = await db.review.count({
      where: { lotId },
    });
    const average = await db.review.aggregate({
      _avg: { rating: true },
      where: { lotId },
    });
    return {
      count,
      averageRating: average._avg.rating || 0,
      reviews,
    };
  },
};

export default reviewModel;
