<script context="module">
	export async function load({page}) {
		// the `slug` parameter is available because this file
		// is called [slug].json.js
		const { slug } = page.params.slug
		console.log('/s/[slug].svelte: load: ', page)

		return { props: { slug } }
}
</script>
<script>
	export let slug
	console.log(slug)
	// export const prerender = false
</script>

<svelte:head>
	<title>Search</title>
</svelte:head>

Search