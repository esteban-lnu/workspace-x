<script context="module">
  export async function load({ page }) {
    const { query } = page.params
    console.log('/s/index.svelte: load page: ', page)

    return { props: { slug: page }}
  }
</script>
<script>
  import { fly, fade } from 'svelte/transition'
	import Map from '$lib/components/UI/Map/index.svelte'
  export let slug
  // export let filteredWorkspacexs = []
  let collapse = false
  console.log('slug.query: ', slug.query)
  // export const prerender = false

  function toggleSidebar() {
    collapse = !collapse
    console.log('sidebar: ', collapse)

  }
</script>

<svelte:head>
  <title>Search</title>
</svelte:head>

<section class="min-h-screen" class:open={collapse}
>
  <div class="relative">
     <div class="h-screen relative bg-red-100 z-10 list transition duration-150 ease-in-out">
        <div class="flex flex-wrap">
            <div class="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
              CardLineChart />
            </div>
            <div class="w-full xl:w-4/12 px-4">
              CardBarChart />
            </div>
          </div>
          <div class="flex flex-wrap mt-4">
            <div class="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
              CardPageVisits />
            </div>
            <div class="w-full xl:w-4/12 px-4">
              CardSocialTraffic />
            </div>
          </div>
     </div>
     <div class="h-screen absolute top-0 map">
       <div class="relative h-screen w-screen" >
        <div
          class="actions absolute left-2/4 ml-8 top-4 bg-white p-2 px-4 rounded-md"
          on:click={toggleSidebar}
        >
          <button class="inline-flex items-center px-3 py-2 font-medium rounded leading-5 bg-white text-gray-800">
            <svg 
              class="w-4 h-4 transform"
              width="100"
              height="100"
              viewBox="0 0 32 40"
              xmlns="http://www.w3.org/2000/svg"
              class:rotate-180={collapse}
              >
              <path d="M25 0 L15 0 L0 20 L15 40 L25 40 L10 20 Z"></path>
            </svg>
          </button>
          {#if collapse}
          <span
            class="font-bold text-md px-3 py-2 pl-2">
            Show list
          </span>
          {/if}
        </div>
         <Map />
       </div>
     </div>

      <!--
    <div
      class="list min-h-screen bg-gray-100"
      in:fly="{{ y: -50, duration: 250, delay: 300 }}"
      out:fly="{{ y: -50, duration: 250 }}" 
    >
      1asda asdasdasas
    </div> -->
    <!-- <div class="min-h-screen bg-gray-200 map">
      <Map  />
    </div> -->
  </div>
</section>
<!-- /hero section -->

<style>
  .list {
    width: 52vw;
  }
  .map {
    width: calc(100% - 52vw);
  }
  .open .map {
    width: 100%;
  }
  .open .actions {
    left: 0;
  }
  .open .list {
    transform: translateX(-52vw);
  }
  .actions {
    left: 52vw;
  }
</style>