<script>
	import Settings from '$lib/settings/Settings.svelte';
	import { createEventDispatcher } from 'svelte';

	export let solved = false;
	export let includeNewPuzzleButton = true;

	const dispatch = createEventDispatcher();

	function startOver() {
		if (window.confirm('Erase your progress and start over?')) {
			dispatch('startOver');
		}
	}

	function newPuzzle() {
		if (solved || window.confirm('Skip this puzzle and start a new one?')) {
			dispatch('newPuzzle');
		}
	}
	let showSettings = false;
</script>

<div class="buttons">
	<!-- Start over button-->
	<button on:click={startOver}> 🔁 </button>
	<!-- Settings button -->
	<button on:click={() => (showSettings = !showSettings)}> ⚙️ </button>
	<!-- New puzzle button -->
	{#if includeNewPuzzleButton}
		<button on:click={newPuzzle}> ➡️ </button>
	{/if}
	<!-- Download button -->
	<button on:click={() => dispatch('download')}> ⬇️ </button>
</div>

{#if showSettings}
	<Settings />
{/if}

<style>
	.buttons {
		display: flex;
		justify-content: center;
		column-gap: 1em;
		flex-wrap: wrap;
		row-gap: 1em;
	}
	button {
		color: var(--text-color);
		display: block;
		min-height: 2em;
		cursor: pointer;
	}
	.secondary button {
		background: none;
		border: none;
		text-decoration: underline;
		color: #888;
	}
</style>
