import { updateUserRoleSchema } from "@rythmons/validation";
import { protectedProcedure, router } from "../trpc";

export const accountRouter = router({
	updateRole: protectedProcedure
		.input(updateUserRoleSchema)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.user.update({
				where: { id: ctx.session.user.id },
				data: {
					role: input.role,
				},
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
				},
			});
		}),
});
