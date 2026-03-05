import { artistRouter } from "./routers/artist";
import { mediaRouter } from "./routers/media";
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
	media: mediaRouter,
});

export type AppRouter = typeof appRouter;
