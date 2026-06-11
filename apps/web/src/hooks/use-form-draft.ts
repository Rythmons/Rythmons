"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_THROTTLE_MS = 2000;

export function useFormDraft<T>(
	key: string,
	options?: { throttleMs?: number },
) {
	// Chargé après le montage (et non dans l'initialiseur) pour rendre le
	// même HTML côté serveur et client, et exposer `hasLoaded` comme le hook
	// natif équivalent.
	const [draft, setDraft] = useState<T | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);

	useEffect(() => {
		try {
			const raw = window.localStorage.getItem(key);
			setDraft(raw ? (JSON.parse(raw) as T) : null);
		} catch {
			setDraft(null);
		}
		setHasLoaded(true);
	}, [key]);
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
		hasLoaded,
	};
}
