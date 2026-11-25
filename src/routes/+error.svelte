<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";

// Addresses that match no route go home instead of to a blank screen.
// With hash routing, resolve('/') gives the hash URL (#/).
onMount(() => {
	if (page.status === 404) goto(resolve("/"), { replaceState: true });
});
</script>

{#if page.status !== 404}
	<h1>Something went wrong</h1>
	<p>{page.error?.message}</p>
	<a href={resolve("/")}>Back home</a>
{/if}
