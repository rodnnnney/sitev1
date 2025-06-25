<script>
  // Props for dynamic content
  export let title = "Pacing"; // Default value
  export let date = "June 6, 2025"; // Default value

</script>

<div class="flex justify-between">
    <nav class="flex items-center space-x-2 text-sm text-white mb-8">
      <a href="/">Home</a>
      <span>/</span>
      <a href="/blogs">Blogs</a>
      <span>/</span>
      <span class="text-white">{title}</span>
    </nav>
    <div class="flex flex-col">
      <div>Rodney Shen</div>
      <div class="text-xs text-white flex justify-end">{date}</div>
    </div>
  </div>