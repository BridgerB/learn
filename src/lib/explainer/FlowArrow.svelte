<script lang="ts">
// Points right between items in a row; CSS turns it to point down when the
// stage is tall and they stack. `down` makes it always point down.
let { on, down = false }: { on: boolean; down?: boolean } = $props();
</script>

<svg
	class={["flow-arrow pop", { on, down }]}
	viewBox="0 0 40 40"
	aria-hidden="true"
>
	<path
		d="M4 20H32M22 9L34 20L22 31"
		fill="none"
		stroke="currentColor"
		stroke-width="5"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
