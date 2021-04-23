// const { tailwindExtractor } = require("tailwindcss/lib/lib/purgeUnusedStyles");

module.exports = {
	mode: 'aot',
	purge: {
		content: [
			'./src/**/*.{html,js,svelte,ts}',
		],
		options: {
      ddefaultExtractor: content => {
        const tokens = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
        return tokens.map(m => {
          if (!m.startsWith('class:')) return m;
          const equalIndex = m.indexOf('=');
          if (equalIndex != -1) return m.slice(6, equalIndex);
          const slashIndex = m.indexOf('/');
          if (slashIndex != -1) return m.slice(6, slashIndex);
          return m.slice(6);
        });
      }
		},
	},
	theme: {
    extend: {
      colors: {
        teal: {
          100: '#e6fffa',
          200: '#b2f5ea',
          300: '#81e6d9',
          400: '#4fd1c5',
          500: '#38b2ac',
          600: '#319795',
          700: '#2c7a7b',
          800: '#285e61',
          900: '#234e52'
        }
      }
    }
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
