"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
exports.useSignIn = useSignIn;
exports.useSignUp = useSignUp;
exports.useSignInForm = useSignInForm;
exports.useSignUpForm = useSignUpForm;
const jsx_runtime_1 = require("react/jsx-runtime");
const validation_1 = require("@rythmons/validation");
const react_form_1 = require("@tanstack/react-form");
const react_1 = require("better-auth/react");
const react_2 = require("react");
const AuthContext = (0, react_2.createContext)(null);
function createClient(config) {
	return (0, react_1.createAuthClient)(config);
}
function AuthProvider({ client, children }) {
	return (0, jsx_runtime_1.jsx)(AuthContext.Provider, {
		value: client,
		children: children,
	});
}
function useAuth() {
	const context = (0, react_2.useContext)(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
/**
 * Generic hook for handling authentication actions with validation, loading, and error states
 */
function useAuthAction(
	_authClient,
	validationSchema,
	action,
	defaultErrorMessage,
) {
	const [isLoading, setIsLoading] = (0, react_2.useState)(false);
	const [error, setError] = (0, react_2.useState)(null);
	const execute = async (input, callbacks) => {
		setIsLoading(true);
		setError(null);
		// Validate input
		const validation = validationSchema.safeParse(input);
		if (!validation.success) {
			const firstError = validation.error.issues[0];
			const errorMessage = firstError?.message || "Erreur de validation";
			setError(errorMessage);
			callbacks?.onError?.(errorMessage);
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: false, error: errorMessage };
		}
		try {
			await action(input, {
				onError: (error) => {
					const errorMessage = error.error?.message || defaultErrorMessage;
					setError(errorMessage);
					callbacks?.onError?.(errorMessage);
				},
				onSuccess: async () => {
					setError(null);
					await callbacks?.onSuccess?.();
				},
			});
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: true };
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Une erreur inattendue s'est produite";
			setError(errorMessage);
			callbacks?.onError?.(errorMessage);
			setIsLoading(false);
			callbacks?.onFinished?.();
			return { success: false, error: errorMessage };
		}
	};
	return { execute, isLoading, error };
}
function useSignIn(authClient) {
	const { execute, isLoading, error } = useAuthAction(
		authClient,
		validation_1.signInSchema,
		async (input, callbacks) => {
			await authClient.signIn.email(
				{
					email: input.email,
					password: input.password,
				},
				callbacks,
			);
		},
		"Échec de la connexion",
	);
	return { signIn: execute, isLoading, error };
}
function useSignUp(authClient) {
	const { execute, isLoading, error } = useAuthAction(
		authClient,
		validation_1.signUpSchema,
		async (input, callbacks) => {
			await authClient.signUp.email(
				{
					name: input.name,
					email: input.email,
					password: input.password,
				},
				callbacks,
			);
		},
		"Échec de l'inscription",
	);
	return { signUp: execute, isLoading, error };
}
// ============================================================================
// Shared Form Hooks with Validation
// ============================================================================
/**
 * Shared hook for sign-in form with TanStack Form and Zod validation.
 * This hook provides form state management, validation, and submission logic
 * that can be used in both web and native applications.
 *
 * @param callbacks - Optional callbacks for success, error, and finished states
 * @returns An object containing the form instance and loading state
 *
 * @example
 * ```tsx
 * const { form, isLoading } = useSignInForm({
 *   onSuccess: () => router.push("/dashboard"),
 *   onError: (error) => toast.error(error),
 * });
 *
 * // In your component:
 * <form.Provider>
 *   <form.Field name="email">
 *     {(field) => <input {...field} />}
 *   </form.Field>
 * </form.Provider>
 * ```
 */
function useSignInForm(callbacks) {
	const authClient = useAuth();
	const { signIn, isLoading } = useSignIn(authClient);
	const form = (0, react_form_1.useForm)({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: validation_1.signInSchema,
		},
		onSubmit: async ({ value }) => {
			await signIn(value, callbacks);
		},
	});
	return { form, isLoading };
}
/**
 * Shared hook for sign-up form with TanStack Form and Zod validation.
 * This hook provides form state management, validation, and submission logic
 * that can be used in both web and native applications.
 *
 * @param callbacks - Optional callbacks for success, error, and finished states
 * @returns An object containing the form instance and loading state
 *
 * @example
 * ```tsx
 * const { form, isLoading } = useSignUpForm({
 *   onSuccess: () => router.push("/dashboard"),
 *   onError: (error) => toast.error(error),
 * });
 *
 * // In your component:
 * <form.Provider>
 *   <form.Field name="name">
 *     {(field) => <input {...field} />}
 *   </form.Field>
 * </form.Provider>
 * ```
 */
function useSignUpForm(callbacks) {
	const authClient = useAuth();
	const { signUp, isLoading } = useSignUp(authClient);
	const form = (0, react_form_1.useForm)({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			onChange: validation_1.signUpSchema,
		},
		onSubmit: async ({ value }) => {
			await signUp(value, callbacks);
		},
	});
	return { form, isLoading };
}
