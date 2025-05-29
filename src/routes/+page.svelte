<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { images, projects, experiences, blogs, rodney, shen } from '$lib/utils/consts';

  let currentImageIndex = 0;
  let interval: number;
  let currentProjectIndex = 0;
  let interval1: number;
  let isLoading = true;

  onMount(() => {
    setTimeout(() => {
      isLoading = false;
    }, 1500);

    interval = setInterval(() => {
      currentImageIndex = (currentImageIndex + 1) % images.length;
    }, 5000);

    interval1 = setInterval(() => {
      currentProjectIndex = (currentProjectIndex + 1) % projects.length;
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(interval1);
    };
  });

</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>Rodney Shen</title>
    <link rel="icon" href="/pfp.png" type="image/x-icon">
    <meta name="description" content="Rodney Shen's personal website">
    <meta name="keywords" content="Rodney Shen, Rodney, Shen, website, personal website, portfolio, blog, projects, experience, about me, contact">
    <meta name="author" content="Rodney Shen">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
</svelte:head>

{#if isLoading}
  <div class="loading-screen" transition:fade={{duration: 1000}}>
    <div class="ascii-art">
      <pre class="rodney">{rodney}</pre>
      <pre class="shen">{shen}</pre>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-f1eee9 text-white p-8 flex items-center justify-center" transition:fade={{duration: 800}}>
    <div class="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8" transition:fly={{y: -50, duration: 1200, delay: 200}}>
      <!-- Left Column -->
      <div class="space-y-6 mt-24" transition:fly={{y: -50, duration: 1200, delay: 400}}>
        <!-- Profile Card -->
        <div class="bg-neutral-800 rounded-lg p-6 shadow-lg" transition:fly={{y: -30, duration: 1000, delay: 500}}>
          <div class="flex items-center">

          <div class="flex flex-row justify-between w-full">
              <div class="text-xl font-bold font-mono">Rodney Shen</div>


              <div class="flex gap-4">
                  <a href="https://github.com/rodnnnney" target="_blank">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg"
                      alt="GitHub"
                      width="28"
                      height="28"
                      class="invert"
                    />
                  </a>
                  <a href="https://x.com/992rodney" target="_blank">
                    <img
                      alt="X"
                      src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg"
                      width="28"
                      height="28"
                      class="invert"
                    />
                  </a>
              </div>


          </div>

          </div>
          <div class="mt-4 flex flex-row items-start">
            <img src="/logo.jpg" alt="Carleton" class="w-10 h-10 rounded-full mr-2 object-cover mt-2">
            <div class="flex flex-col">
              <p class="font-semibold">Computer Science @ Carleton University</p>
              <div class="border-b border-gray-300 w-full mt-1 mb-1"></div>
              <p class="text-black text-xs text-left text-gray-500">🤏 close to dropping out (sorry mom!)</p>
            </div>
          </div>
        </div>

        <!-- HAND -->
        <div class="bg-neutral" transition:fly={{y: -30, duration: 1000, delay: 600}}>
          <div class="object-cover w-full">
            <img src="/hand.png" alt="" class="w-full h-full object-cover rounded-lg">
          </div>
        </div>
        <!-- About Card -->
        <div class="bg-neutral-800 rounded-lg p-6 shadow-lg" transition:fly={{y: -30, duration: 1000, delay: 700}}>
          <h3 class="text-xl font-bold mb-4 font-mono">About Me</h3>

          <div class="flex flex-row-2 ">

              <p class="text-gray-300 text-sm text-left">
                  I'm passionate about building cool tech that advances society.
                  <br><br>
                  At Carleton, I founded the blockchain club, with the help of my friends, I grew it from 0-200 in ~1 semester hosting 6 unforgettable events. 
                  <br><br>
                  Outside of school and work, I clear my head with runs, listen to music, chilling with the bros and traveling the world.
              </p>
          </div>
        </div>

        
      </div>

      <!-- Middle Column -->
      <div class="space-y-6" transition:fly={{y: -50, duration: 1200, delay: 600}}>
        <!-- Blogs Card -->
        <div class="bg-neutral-800 rounded-lg p-6 shadow-lg" transition:fly={{y: -30, duration: 1000, delay: 700}}>
          <h3 class="text-xl font-bold  font-mono mb-4">Shower Thoughts</h3>
          <div class="space-y-4">
            {#each blogs as blog}
              <a href="/blogs/{blog.title.toLowerCase().replace(/\s+/g, '-')}" class="block">
                <div class="border-b border-neutral-700 pb-4 hover:bg-neutral-700 transition-colors">
                  <h4 class="font-semibold text-md">{blog.title}</h4>
                  <p class="text-sm text-gray-400 text-sm">{blog.date}</p>
                  <p class="text-gray-300 mt-2 text-sm">{blog.excerpt}</p>
                </div>
              </a>
            {/each}
          </div>
        </div>

        <div class="relative h-128" transition:fly={{y: -30, duration: 1000, delay: 800}}> 
          {#each images as image, i}
            {#if i === currentImageIndex}
              <img 
                src={image.src} 
                alt={image.alt} 
                class="absolute w-full h-full object-cover rounded-lg"
                transition:fade={{ duration: 500 }}
              >
            {/if}
          {/each}

          <div class="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {#each projects as _, i}
              <div 
                class="w-14 h-1 rounded-full transition-colors duration-300"
                class:bg-white={i === currentImageIndex}
                class:bg-gray-500={i !== currentImageIndex}
              ></div>
            {/each}
          </div>

          <div class="absolute top-5 left-5 flex justify-center space-x-2">
            {#each images as image, i}
              {#if i === currentImageIndex}
                <div class="text-white text-bold text-sm">{image.description}</div>
              {/if}
            {/each}
          </div>

        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-6" transition:fly={{y: -100, duration: 1200, delay: 800}}>
        <!-- Experience Card -->
        <div class="bg-neutral-800 rounded-lg p-6 shadow-lg" transition:fly={{y: -50, duration: 1000, delay: 900}}>
          <h3 class="text-xl font-bold font-mono mb-4">Experience</h3>
          <div class="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            {#each experiences as exp}
            <div class="flex flex-row">
                <img src={exp.logo} alt="" class="w-12 h-12 mr-2 object-cover mt-4">
                <div class="border-b border-neutral-700 pb-4">
                  <h4 class="font-semibold">{exp.title}</h4>
                  <p class="text-sm text-gray-400">{exp.company} • {exp.period}</p>
                  <p class="text-gray-300 mt-2">{exp.description}</p>
                </div>
            </div>
            {/each}
          </div>
        </div>

        <div class="relative h-112" transition:fly={{y: -30, duration: 1000, delay: 1000}}>
          {#each projects as project, i }
          {#if i === currentProjectIndex}
          <a href={project.link} target="_blank" class="hover:opacity-95 transition-opacity">
              <img
                  src={project.src}
                  alt={project.name}
                  class="absolute w-full h-full object-cover rounded-lg"
                  transition:fade={{duration: 750}}
              >
           </a>
              {/if}
              {/each}
          <!-- Progress Indicator -->
          <div class="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {#each projects as _, i}
              <div 
                class="w-14 h-1 rounded-full transition-colors duration-300"
                class:bg-black={i === currentProjectIndex}
                class:bg-gray-500={i !== currentProjectIndex}
              ></div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  :global(body) {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh; /* Ensure it takes full viewport height */
            background-color: #1a1a1a; /* Dark base color */
            
            /* Create the repeating pattern */
            background-image: 
                radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0),
                radial-gradient(circle at 5px 5px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
            background-size: 10px 10px, 20px 20px; /* Size of the pattern units */
            background-position: 0 0, 5px 5px; /* Offset for the second pattern */
        }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    opacity: 0;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
  }

  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #ababab;
  }

  .custom-scrollbar:focus::-webkit-scrollbar-thumb {
    background: #ababab;
  }

  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: #1a1a1a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    gap: 2rem;

  }

  .ascii-art {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: white;
    font-family: monospace;
    font-size: 12px;
    line-height: 1;
    white-space: pre;
  }

  .ascii-art pre {
    margin: 0;
    padding: 0;
  }

  .loader {
    width: 48px;
    height: 48px;
    border: 5px solid #FFF;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
