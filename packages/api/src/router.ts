import { accountRouter } from "./routers/account";
import { artistRouter } from "./routers/artist";
import { availabilityRouter } from "./routers/availability";
import { bookingRouter } from "./routers/booking";
import { venueRouter } from "./routers/venue";
import { protectedProcedure, publicProcedure, router } from "./trpc";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "Message privé",
			user: ctx.session.user,
		};
	}),
	account: accountRouter,
	venue: venueRouter,
	artist: artistRouter,
	booking: bookingRouter,
	availability: availabilityRouter,
});

export type AppRouter = typeof appRouter;
