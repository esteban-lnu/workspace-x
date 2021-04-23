<script>
	import Header from '$lib/layout/Header/index.svelte'
	import Aside from '$lib/layout/Sidebar/index.svelte'
	import Footer from '$lib/layout/Footer/index.svelte'
	import '../app.postcss'

	let open = false
</script>

<Header bind:sidebar={open}/>
<Aside bind:open />

<main>
	<slot />
</main>

<Footer />

<style>
:global(body) {
	padding: 0;
}
</style>
