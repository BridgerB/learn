<script lang="ts">
interface Props {
	kind: "tick" | "cross";
	color?: string;
	size?: number;
}

let {
	kind,
	color = kind === "tick" ? "var(--green)" : "var(--red)",
	size = 44,
}: Props = $props();
</script>

<svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
	{#if kind === "tick"}
		<path
			d="M4 22L16 34L40 8"
			fill="none"
			stroke={color}
			stroke-width="7"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else}
		<path
			d="M7 7L37 37M37 7L7 37"
			stroke={color}
			stroke-width="7"
			stroke-linecap="round"
		/>
	{/if}
</svg>
