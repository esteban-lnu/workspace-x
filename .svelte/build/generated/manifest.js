const c = [
	() => import("../../../src/routes/$layout.svelte"),
	() => import("../components/error.svelte"),
	() => import("../../../src/routes/index.svelte"),
	() => import("../../../src/routes/register/index.svelte"),
	() => import("../../../src/routes/about.svelte"),
	() => import("../../../src/routes/todos/index.svelte"),
	() => import("../../../src/routes/auth/login/index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/nextspaces/index.js
	[/^\/nextspaces\/?$/],

	// src/routes/register/index.svelte
	[/^\/register\/?$/, [c[0], c[3]], [c[1]]],

	// src/routes/about.svelte
	[/^\/about\/?$/, [c[0], c[4]], [c[1]]],

	// src/routes/todos/index.json.js
	[/^\/todos\.json$/],

	// src/routes/todos/index.svelte
	[/^\/todos\/?$/, [c[0], c[5]], [c[1]]],

	// src/routes/todos/[uid].json.js
	[/^\/todos\/([^/]+?)\.json$/],

	// src/routes/auth/login/index.svelte
	[/^\/auth\/login\/?$/, [c[0], c[6]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];