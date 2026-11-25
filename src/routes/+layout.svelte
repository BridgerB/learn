<script lang="ts">
import favicon from "#lib/assets/favicon.svg";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
</svelte:head>

<!-- `.app` hides the loading screen in app.html once this renders. -->
<div class="app">{@render children()}</div>
