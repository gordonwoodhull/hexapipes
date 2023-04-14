import { HexaGrid } from '$lib/puzzle/grids/hexagrid';
import { SquareGrid } from '$lib/puzzle/grids/squaregrid';
import { OctaGrid } from '$lib/puzzle/grids/octagrid';
import { CubeGrid } from '$lib/puzzle/grids/cubegrid';

/**
 * @typedef {'hexagonal'|'square'|'octagonal'|'cube'} GridKind
 */

/**
 * @typedef {HexaGrid|SquareGrid|OctaGrid|CubeGrid} Grid
 */

/**
 * Creates a grid of a specified type
 * @param {GridKind} kind
 * @param {Number} width
 * @param {Number} height
 * @param {boolean} wrap
 * @param {Number[]|undefined} tiles
 * @returns {Grid}
 */
export function createGrid(kind, width, height, wrap, tiles = undefined) {
	let grid;
	if (kind === 'hexagonal') {
		grid = new HexaGrid(width, height, wrap, tiles);
	} else if (kind === 'octagonal') {
		grid = new OctaGrid(width, height, wrap, tiles);
	} else if (kind === 'square') {
		grid = new SquareGrid(width, height, wrap, tiles);
	} else if (kind === 'cube') {
		grid = new CubeGrid(width, height, wrap, tiles);
	} else {
		throw `Unknown grid kind ${kind}`;
	}
	return grid;
}

/** @type {GridKind[]} */
export const gridKinds = ['hexagonal', 'square', 'octagonal', 'cube'];

export const gridInfo = {
	hexagonal: {
		title: 'Hexagonal',
		url: 'hexagonal',
		wrap: true,
		exampleGrid: new HexaGrid(3, 3, false),
		exampleTiles: [32, 34, 32, 50, 56, 8, 12, 20, 16]
	},
	square: {
		title: 'Square',
		url: 'square',
		wrap: true,
		exampleGrid: new SquareGrid(3, 3, false),
		exampleTiles: [9, 13, 8, 10, 6, 12, 12, 4, 1]
	},
	octagonal: {
		title: 'Octagonal',
		url: 'octagonal',
		wrap: true,
		exampleGrid: new OctaGrid(3, 3, false),
		exampleTiles: [32, 64, 192, 18, 68, 66, 5, 200, 128, 130, 168, 0, 40, 8, 0, 0, 0, 0]
	},
	cube: {
		title: 'Cube',
		url: 'cube',
		wrap: true,
		exampleGrid: new CubeGrid(3, 3, false),
		exampleTiles: [
			3, 1, 3,
			10, 4, 1,
			5, 12, 5,
			13, 7, 11,
			13, 7, 11,
			8, 1, 10,
			9, 11, 8,
			4, 4, 2,
			1, 9, 7
		  ]
	}
};
