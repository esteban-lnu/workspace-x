<script context="module">
  export async function load({fetch}, pages){
    const res = await fetch('/api/v1/spaces')
    const jsonReponse = await res.json()

    console.log(jsonReponse, pages)

    return { props: { nextspaces: jsonReponse.nextspaces } }
  }
</script>
<script>
  export const prerender = true
  export let nextspaces
  let text = ''

  async function addNextspace() {
    try {
      const nextspace = {
        text,
        completed: false
      }
      await fetch('/api/v1/spaces', {
        method: 'POST',
        body: JSON.stringify(nextspace)
      })
      text = ''
      fetchNextspaces()
    } catch (error) {
      alert(error)
      text = ''			
    }    
  }

  async function toggleNextspace(nextspace) {
    try {
      await fetch('/api/v1/spaces', {
        method: 'PUT',
        body: JSON.stringify(nextspace)
      })
      fetchNextspaces()
    } catch (error) {
      alert('Error: ', error)      
    }
  }

  async function fetchNextspaces() {
    try {
      const res = await fetch('/api/v1/spaces')
      const jsonReponse = await res.json()
      nextspaces = jsonReponse.nextspaces

    } catch (error) {
      
    }
  }
</script>

<svelte:head>
  <title>Nextspaces</title>
</svelte:head>
<section>
  <input type="text" placeholder="Add a todo" bind:value={text}>
  <button on:click={addNextspace}>Add todo</button>
  <hr>
  <ul>
      {#each nextspaces as nextspace}
      <input type="checkbox" bind:checked={nextspace.completed} on:change={toggleNextspace(nextspace)} />
      <li>{nextspace.text}</li>
      {/each} 
  </ul>
</section>
