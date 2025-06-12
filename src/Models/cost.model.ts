import { Prisma } from "@prisma/client";
import db from "../Db/db";
import ModelError from "./ModelError";

const costModel = {
    async createCost(data: { month: number; year: number; amount: number; margin: number; lotId: string }) {
        try {
            const newCost = await db.cost.create({
                data,
            });
            return newCost;
        } catch (error) {
            throw new ModelError('Failed to create cost.' + (error as Error).message, 500);
        }
    },

    async getCostById(id: string) {
        try {
            const cost = await db.cost.findUnique({
                where: { id },
            });
            return cost;
        } catch (error) {
            throw new ModelError('Failed to retrieve cost by ID.' + (error as Error).message, 500);
        }
    },

    async getCostsByYear(year: number | undefined, limit: number, offset: number, lotId?: string) {
        try {
            const whereFilter: Prisma.CostWhereInput = {
                year,
                ...(lotId ? { lotId } : {}),
            };

            const costs = await db.cost.findMany({
                where: whereFilter,
                skip: offset,
                take: limit,
                orderBy: {
                    month: 'asc', // Or any other preferred order
                },
            });

            const count = await db.cost.count({
                where: whereFilter,
            });

            return { count, costs };
        } catch (error) {
            throw new ModelError('Failed to retrieve costs by year.' + (error as Error).message, 500);
        }
    },

    async deleteCost(id: string) {
        try {
            // delete should only work for future months
            const cost = await db.cost.findUnique({
                where: { id },
            });
            if (!cost) {
                throw new ModelError('Cost not found.', 404);
            }
            const currentDate = new Date();
            const costDate = new Date(cost.year, cost.month - 1); // month is 1-indexed in the database
            if (costDate < currentDate) {
                throw new ModelError('Cannot delete costs for past months.', 403);
            }

            const deletedCost = await db.cost.delete({
                where: { id },
            });
            return deletedCost;
        } catch (error) {
            if ((error as any).code === 'P2025') { // Prisma error code for record not found
                throw new ModelError('Cost not found.', 404);
            }
            throw new ModelError('Failed to delete cost.' + (error as Error).message, 500);
        }
    },
};

export default costModel;