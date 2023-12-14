<script>
	import { page } from '$app/stores';
	import Instructions from '$lib/Instructions.svelte';
	import { gridInfo } from '$lib/puzzle/grids/grids';

	$: category = $page.params.grid;
	$: gridKind = category.split('-')[0];
	$: wrap = category.split('-')[1] === 'wrap';
	$: info = gridInfo[gridKind];
	$: title = `${info.title} ` + (wrap ? ' Wrap' : '') + ' Pipes';
	$: sizes = info.sizes;
</script>

<svelte:head>
	<title>
		{$page.params.size}x{$page.params.size}
		{title} Puzzle
	</title>
</svelte:head>

<div class="info container">
	<h2>{$page.params.size}x{$page.params.size} {title} Puzzle</h2>
</div>

<slot />

<style>
	.sizes,
	.grids {
		display: flex;
		flex-wrap: wrap;
		column-gap: 20px;
		margin: auto;
		justify-content: center;
		color: var(--text-color);
	}
	.grids a,
	.grids span,
	.sizes a,
	.sizes span {
		display: block;
		padding: 5px;
	}
	.active {
		outline: 1px solid var(--accent-color);
	}

	p {
		text-align: center;
	}
	.info {
		text-align: center;
	}
</style>
