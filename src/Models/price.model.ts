import db from "../Db/db";
import ModelError from "./ModelError";

// Define a default pricing object for when no pricing is found for a specific lot.
// Note: This default is now conceptual for the GET endpoint; actual creation
// requires a lotId and specific prices.
const defaultLotPricing = {
    maxPrice: 50.00,
    minPrice: 5.00,
    valetPrice: 15.00,
};

const pricingModel = {
    /**
     * Creates or updates the pricing configuration for a specific lot.
     * Uses Prisma's upsert functionality based on lotId.
     * @param lotId The ID of the lot.
     * @param data The pricing data to create or update (maxPrice, minPrice, valetPrice).
     * @returns The created or updated pricing object.
     */
    async upsertLotPricing(
        lotId: string,
        data: {
            maxPrice: number;
            minPrice: number;
            valetPrice: number;
        }
    ) {
        try {
            const pricing = await db.pricing.upsert({
                where: { lotId: lotId }, // Target the pricing record by lotId
                update: {
                    maxPrice: data.maxPrice,
                    minPrice: data.minPrice,
                    valetPrice: data.valetPrice,
                },
                create: {
                    lotId: lotId,
                    maxPrice: data.maxPrice,
                    minPrice: data.minPrice,
                    valetPrice: data.valetPrice,
                },
            });
            return pricing;
        } catch (error) {
            if ((error as any).code === 'P2002' && (error as any).meta?.target.includes('lotId')) {
                throw new ModelError(`Pricing for lot ID "${lotId}" already exists. Use PUT to update.`, 409);
            }
            throw new ModelError('Failed to create or update lot pricing.' + (error as Error).message, 500);
        }
    },

    /**
     * Retrieves the current pricing configuration for a specific lot.
     * Returns a default object if no pricing configuration exists for the lot.
     * @param lotId The ID of the lot to retrieve pricing for.
     * @returns The pricing object for the lot or a default pricing object.
     */
    async getLotPricing(lotId: string) {
        try {
            const pricing = await db.pricing.findUnique({
                where: { lotId: lotId },
            });

            if (!pricing) {
                return { ...defaultLotPricing, lotId: lotId };
            }
            return pricing;
        } catch (error) {
            throw new ModelError('Failed to retrieve lot pricing.' + (error as Error).message, 500);
        }
    },
};

export default pricingModel;