const sveltePreprocess = require("svelte-preprocess");
// const node = require('@sveltejs/adapter-node');
// const { vercel } = require("@sveltejs/adapter-vercel")
const netlify = require('@sveltejs/adapter-netlify');
const pkg = require('./package.json');

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
  preprocess: [
    sveltePreprocess({
      replace: [
        [
          'process.env.MONGODB_URI', process.env.MONGODB_URI,
          'process.env.MONGODB_DB', process.env.MONGODB_DB
        ],
      ],
      define: {
        'process.env.MONGODB_URI': JSON.stringify(process.env.MONGODB_URI),
        'process.env.MONGODB_DB': JSON.stringify(process.env.MONGODB_DB)
      },
      defaults: {
        style: 'postcss',
      },
      postcss: true
    })
  ],
  kit: {
    // By default, `npm run build` will create a standard Node app.
    // You can create optimized builds for different platforms by
    // specifying a different adapter
    // adapter: node(),
    // adapter: node({ out: 'build' }),
    adapter: netlify(),
    // adapter: netlify({ out: 'build' }),

    // hydrate the <div id="svelte"> element in src/app.html
    target: '#workspacex',
    files: {
      assets: 'static',
    },
    vite: {
      ssr: {
        noExternal: Object.keys(pkg.dependencies || {})
      }
    }
  }
};
