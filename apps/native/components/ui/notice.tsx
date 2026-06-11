import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { Text } from "./typography";

type NoticeKind = "success" | "error" | "info";

type NoticePayload = {
	title: string;
	message?: string;
	kind?: NoticeKind;
	durationMs?: number;
};

type NoticeItem = {
	id: number;
	title: string;
	message?: string;
	kind: NoticeKind;
	durationMs: number;
};

type NoticeContextValue = {
	showNotice: (payload: NoticePayload) => void;
	dismissNotice: () => void;
	currentNotice: NoticeItem | null;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function NoticeProvider({ children }: { children: ReactNode }) {
	const [currentNotice, setCurrentNotice] = useState<NoticeItem | null>(null);

	const dismissNotice = useCallback(() => {
		setCurrentNotice(null);
	}, []);

	const showNotice = useCallback((payload: NoticePayload) => {
		setCurrentNotice({
			id: Date.now(),
			title: payload.title,
			message: payload.message,
			kind: payload.kind ?? "info",
			durationMs: payload.durationMs ?? 2500,
		});
	}, []);

	useEffect(() => {
		if (!currentNotice) return;
		const timer = setTimeout(
			() => setCurrentNotice(null),
			currentNotice.durationMs,
		);
		return () => clearTimeout(timer);
	}, [currentNotice]);

	const value = useMemo(
		() => ({ showNotice, dismissNotice, currentNotice }),
		[showNotice, dismissNotice, currentNotice],
	);

	return (
		<NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>
	);
}

export function useNotice() {
	const context = useContext(NoticeContext);
	if (!context) {
		throw new Error("useNotice must be used within NoticeProvider");
	}
	return context;
}

export function NoticeViewport() {
	const insets = useSafeAreaInsets();
	const { currentNotice, dismissNotice } = useNotice();

	if (!currentNotice) return null;

	const kindClasses =
		currentNotice.kind === "success"
			? "border-green-500/40 bg-green-500/20"
			: currentNotice.kind === "error"
				? "border-red-500/40 bg-red-500/20"
				: "border-border bg-card";

	return (
		<View
			pointerEvents="box-none"
			style={{
				position: "absolute",
				top: insets.top + 10,
				left: 12,
				right: 12,
				zIndex: 2000,
			}}
		>
			<TouchableOpacity
				activeOpacity={0.95}
				className={cn("rounded-xl border px-4 py-3", kindClasses)}
				onPress={dismissNotice}
			>
				<Text className="font-sans-bold text-foreground">
					{currentNotice.title}
				</Text>
				{currentNotice.message ? (
					<Text className="mt-1 text-muted-foreground text-sm">
						{currentNotice.message}
					</Text>
				) : null}
			</TouchableOpacity>
		</View>
	);
}
