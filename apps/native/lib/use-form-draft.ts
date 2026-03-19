import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_THROTTLE_MS = 2000;

export function useFormDraft<T>(
	key: string,
	options?: { throttleMs?: number },
) {
	const [draft, setDraft] = useState<T | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const throttleMs = options?.throttleMs ?? DEFAULT_THROTTLE_MS;

	useEffect(() => {
		let cancelled = false;
		AsyncStorage.getItem(key)
			.then((raw) => {
				if (cancelled || !raw) {
					if (!cancelled) setDraft(null);
					return;
				}
				try {
					const parsed = JSON.parse(raw) as T;
					if (!cancelled) setDraft(parsed);
				} catch {
					if (!cancelled) setDraft(null);
				}
			})
			.finally(() => {
				if (!cancelled) setHasLoaded(true);
			});
		return () => {
			cancelled = true;
		};
	}, [key]);

	const saveDraft = useCallback(
		(data: T) => {
			if (throttleRef.current) clearTimeout(throttleRef.current);
			throttleRef.current = setTimeout(() => {
				AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
				throttleRef.current = null;
			}, throttleMs);
		},
		[key, throttleMs],
	);

	const clearDraft = useCallback(() => {
		AsyncStorage.removeItem(key).catch(() => {});
		setDraft(null);
	}, [key]);

	return {
		draft,
		saveDraft,
		clearDraft,
		hasDraft: draft !== null,
		hasLoaded,
	};
}
