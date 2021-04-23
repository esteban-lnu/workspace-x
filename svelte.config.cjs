const sveltePreprocess = require("svelte-preprocess");
// const node = require('@sveltejs/adapter-node');
// const { vercel } = require("@sveltejs/adapter-vercel")
const netlify = require('@sveltejs/adapter-netlify');
const pkg = require('./package.json');

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
	preprocess: [
		sveltePreprocess({
			defaults: {
				style: 'postcss',
			},
			postcss: true
		}),
	],
	kit: {
		// By default, `npm run build` will create a standard Node app.
		// You can create optimized builds for different platforms by
		// specifying a different adapter
		// adapter: node(),
		// adapter: node({ out: 'build' }),
		adapter: netlify(),

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#workspacex',
		files: {
			assets: 'static',
		},
		vite: {
			ssr: {
				external: Object.keys(pkg.dependencies || {})
			}
		}
	}
};
