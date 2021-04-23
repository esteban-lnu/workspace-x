<script>
  import { createEventDispatcher }  from 'svelte'
  import { fly, fade } from 'svelte/transition'
  // import Button from './Button.svelte'

  const dispatch = createEventDispatcher()
  
  function onClose() {
    dispatch('close')
  }
</script>
<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  z-index: 10;
}

.modal {
  position: fixed;
  top: 10vh;
  left: 10%;
  width: 80%;
  max-height: 80vh;
  background: white;
  border-radius: 3px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
  overflow: scroll;
}

header {
  padding: 1rem;
  margin: 0;
  border-bottom: 1px solid #ccc;
  font-family: 'Roboto Slab', sans-serif;
}

.content {
  padding: 1rem;
}

footer {
  padding: 1rem;
}

@media (min-width: 768px) {
  .modal {
    width: 40rem;
    left: calc(50% - 20rem);
  }
}

</style>

<div
  on:click={onClose}
  class="modal-backdrop"
  transition:fade
  ></div>
<div
  class="modal"
  transition:fly={{y: -200}}
  >
  <header>
    <slot name="header" />
  </header>
  <div class="content">
    <slot />
  </div>
  <footer>
    <slot
      name="footer">
      <!-- <Button
        on:click={onCancel}>
        Close
      </Button> -->
    </slot>
  </footer>
</div>
