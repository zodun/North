let _refresh: (() => void) | null = null;

export function registerFeedRefresh(fn: () => void): () => void {
	_refresh = fn;
	return () => {
		if (_refresh === fn) _refresh = null;
	};
}

export function triggerFeedRefresh() {
	_refresh?.();
}
