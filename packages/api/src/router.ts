import { accountRouter } from "./routers/account";
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
	account: accountRouter,
	venue: venueRouter,
	artist: artistRouter,
});

export type AppRouter = typeof appRouter;
