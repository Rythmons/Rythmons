"use client";

import { useCallback, useRef, useState } from "react";

const DEFAULT_THROTTLE_MS = 2000;

export function useFormDraft<T>(
	key: string,
	options?: { throttleMs?: number },
) {
	const [draft, setDraft] = useState<T | null>(() => {
		if (typeof window === "undefined") return null;
		try {
			const raw = window.localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	});
	const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const throttleMs = options?.throttleMs ?? DEFAULT_THROTTLE_MS;

	const saveDraft = useCallback(
		(data: T) => {
			if (throttleRef.current) clearTimeout(throttleRef.current);
			throttleRef.current = setTimeout(() => {
				try {
					window.localStorage.setItem(key, JSON.stringify(data));
				} catch {
					// Ignore storage failures
				}
				throttleRef.current = null;
			}, throttleMs);
		},
		[key, throttleMs],
	);

	const clearDraft = useCallback(() => {
		try {
			window.localStorage.removeItem(key);
		} catch {
			// Ignore
		}
		setDraft(null);
	}, [key]);

	return {
		draft,
		saveDraft,
		clearDraft,
		hasDraft: draft !== null,
	};
}
