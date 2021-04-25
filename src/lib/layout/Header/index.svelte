<script>
	// import Logo from '/workspacex-logo2.svg'
	import HamburgerButton from '$lib/components/UI/Hamburger/index.svelte'

	export let sidebar = false
</script>

<header class="text-gray-600 border-b border-tale-500 border-opacity-25">
	<nav class="flex justify-between p-4 m-4 my-2">
		<div class="brand justify-self-start">
			<a href="/">
				<img src="/workspacex-logo2.svg" alt="WorkspaceX" width="56" />
			</a>
    </div>

		<div class="toggle-button pt-3">
			<HamburgerButton bind:open={sidebar} />
		</div>
	</nav>
</header>

<style>
</style>
