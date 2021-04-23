<script>
  import Modal from '$lib/components/UI/Modal.svelte'

  export let open = false

  function onClose() {
    console.log('onClose')
    open = false
  }
</script>

{#if open === true }
  <Modal on:cancel="{onClose}" on:close="{onClose}">
    <h1 slot="header" class="bg-teal-600">
      Header
    </h1>
    <nav class="text-xl">
      <a class="block" on:click="{onClose}" href="/auth/login">Login</a>
      <a class="block" on:click="{onClose}" href="/register">Register</a>
    </nav>
  </Modal>
{/if}

<style>
</style>