import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createQueryClient,
	createTRPCClient,
	createTRPCProxy,
} from "../client";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// On mock les modules externes pour ne pas dépendre de vraies implémentations réseau
vi.mock("@trpc/client", () => ({
	createTRPCClient: vi.fn(() => ({ _isMockTRPCClient: true })),
	httpBatchLink: vi.fn((config) => ({ _type: "httpBatchLink", ...config })),
}));

vi.mock("@trpc/tanstack-react-query", () => ({
	createTRPCOptionsProxy: vi.fn((config) => ({
		_isMockProxy: true,
		...config,
	})),
}));

// Import des mocks après vi.mock pour pouvoir inspecter les appels
import {
	createTRPCClient as mockCreateTRPCVanilla,
	httpBatchLink as mockHttpBatchLink,
} from "@trpc/client";
import { createTRPCOptionsProxy as mockCreateProxy } from "@trpc/tanstack-react-query";

// ─── createQueryClient ────────────────────────────────────────────────────────

describe("createQueryClient", () => {
	it("retourne une instance de QueryClient", () => {
		const client = createQueryClient();
		expect(client).toBeInstanceOf(QueryClient);
	});

	it("fonctionne sans config (paramètre optionnel)", () => {
		expect(() => createQueryClient()).not.toThrow();
	});

	it("applique staleTime à 30 secondes par défaut", () => {
		const client = createQueryClient();
		const options = client.getDefaultOptions();
		expect(options.queries?.staleTime).toBe(30 * 1000);
	});

	it("désactive refetchOnWindowFocus par défaut", () => {
		const client = createQueryClient();
		const options = client.getDefaultOptions();
		expect(options.queries?.refetchOnWindowFocus).toBe(false);
	});

	it("appelle onError du QueryCache quand une erreur survient", async () => {
		const onError = vi.fn();
		const client = createQueryClient({ onError });

		// Déclenche manuellement une erreur dans le QueryCache
		const cache = client.getQueryCache();
		const error = new Error("test error");
		cache.config.onError?.(error, {} as any);

		expect(onError).toHaveBeenCalledOnce();
		expect(onError).toHaveBeenCalledWith(error, {});
	});

	it("crée un client sans onError si non fourni", () => {
		const client = createQueryClient({});
		const cache = client.getQueryCache();
		expect(cache.config.onError).toBeUndefined();
	});

	it("deux appels produisent des instances indépendantes", () => {
		const a = createQueryClient();
		const b = createQueryClient();
		expect(a).not.toBe(b);
	});
});

// ─── createTRPCClient ─────────────────────────────────────────────────────────

describe("createTRPCClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("crée un client tRPC avec l'URL fournie", () => {
		createTRPCClient({ url: "https://app.rythmons.com/api/trpc" });

		expect(mockHttpBatchLink).toHaveBeenCalledWith(
			expect.objectContaining({ url: "https://app.rythmons.com/api/trpc" }),
		);
	});

	it("passe les headers à httpBatchLink quand fournis", () => {
		const headers = () => ({ Authorization: "Bearer token" });
		createTRPCClient({ url: "/api/trpc", headers });

		expect(mockHttpBatchLink).toHaveBeenCalledWith(
			expect.objectContaining({ headers }),
		);
	});

	it("passe un fetch custom à httpBatchLink quand fourni", () => {
		const customFetch = vi.fn();
		createTRPCClient({ url: "/api/trpc", fetch: customFetch as any });

		expect(mockHttpBatchLink).toHaveBeenCalledWith(
			expect.objectContaining({ fetch: customFetch }),
		);
	});

	it("ne passe pas headers si non fourni", () => {
		createTRPCClient({ url: "/api/trpc" });

		expect(mockHttpBatchLink).toHaveBeenCalledWith(
			expect.objectContaining({ headers: undefined }),
		);
	});

	it("ne passe pas fetch si non fourni", () => {
		createTRPCClient({ url: "/api/trpc" });

		expect(mockHttpBatchLink).toHaveBeenCalledWith(
			expect.objectContaining({ fetch: undefined }),
		);
	});

	it("appelle createTRPCVanillaClient avec un lien httpBatchLink", () => {
		createTRPCClient({ url: "/api/trpc" });

		expect(mockCreateTRPCVanilla).toHaveBeenCalledWith(
			expect.objectContaining({
				links: expect.arrayContaining([expect.any(Object)]),
			}),
		);
	});

	it("retourne le résultat de createTRPCVanillaClient", () => {
		const result = createTRPCClient({ url: "/api/trpc" });
		expect(result).toEqual({ _isMockTRPCClient: true });
	});

	it("accepte des headers asynchrones (Promise)", () => {
		const asyncHeaders = async () => ({ Authorization: "Bearer token" });
		expect(() =>
			createTRPCClient({ url: "/api/trpc", headers: asyncHeaders }),
		).not.toThrow();
	});
});

// ─── createTRPCProxy ──────────────────────────────────────────────────────────

describe("createTRPCProxy", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("crée un proxy en passant client et queryClient", () => {
		const mockClient = { _isMockTRPCClient: true } as any;
		const queryClient = new QueryClient();

		createTRPCProxy(mockClient, queryClient);

		expect(mockCreateProxy).toHaveBeenCalledWith({
			client: mockClient,
			queryClient,
		});
	});

	it("retourne le résultat de createTRPCOptionsProxy", () => {
		const mockClient = { _isMockTRPCClient: true } as any;
		const queryClient = new QueryClient();

		const result = createTRPCProxy(mockClient, queryClient);
		expect(result).toMatchObject({ _isMockProxy: true });
	});

	it("propage bien le queryClient au proxy", () => {
		const mockClient = { _isMockTRPCClient: true } as any;
		const queryClient = new QueryClient();

		createTRPCProxy(mockClient, queryClient);

		const call = (mockCreateProxy as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.queryClient).toBe(queryClient);
	});

	it("propage bien le client tRPC au proxy", () => {
		const mockClient = { _isMockTRPCClient: true } as any;
		const queryClient = new QueryClient();

		createTRPCProxy(mockClient, queryClient);

		const call = (mockCreateProxy as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(call.client).toBe(mockClient);
	});
});

// ─── Intégration : chaîne complète ───────────────────────────────────────────

describe("chaîne createQueryClient → createTRPCClient → createTRPCProxy", () => {
	it("s'enchaîne sans erreur", () => {
		const queryClient = createQueryClient();
		const trpcClient = createTRPCClient({ url: "/api/trpc" });
		const proxy = createTRPCProxy(trpcClient as any, queryClient);

		expect(queryClient).toBeInstanceOf(QueryClient);
		expect(trpcClient).toBeDefined();
		expect(proxy).toBeDefined();
	});
});
