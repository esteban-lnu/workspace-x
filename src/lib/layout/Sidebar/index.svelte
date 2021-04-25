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
    <div slot="header">
      <img class="mx-auto h-12 w-auto" src="/workspacex-logo.svg" alt="Workflow">
    </div>
    <nav class="text-xl">
      <a class="block" on:click="{onClose}" href="/auth/login">Login</a>
      <a class="block" on:click="{onClose}" href="/register">Register</a>
    </nav>
  </Modal>
{/if}

<style>
</style>