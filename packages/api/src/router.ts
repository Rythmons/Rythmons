import { artistRouter } from "./routers/artist";
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
	venue: venueRouter,
	artist: artistRouter,
});

export type AppRouter = typeof appRouter;
