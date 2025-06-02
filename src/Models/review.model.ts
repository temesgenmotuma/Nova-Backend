import db from "../Db/db";

const reviewModel = {
  async createReview(customerId: string, lotId: string, rating: number, comment?: string) {
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
    return await db.review.findMany({
      where: { lotId },
      take: limit,
      skip: offset,
      include: {
        customer: {
          select: { username: true, email: true },
        },
      },
    });
  },
};

export default reviewModel;
