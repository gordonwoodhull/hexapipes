import { describe, expect, it } from 'vitest';
import { CubeGrid } from './cubegrid';

describe('Test making a cell empty', () => {
	const grid = new CubeGrid(3, 3, false);
	grid.makeEmpty(14);

	it('Reports an empty neighbour', () => {
		const { neighbour, empty } = grid.find_neighbour(9, 1);
		expect(neighbour).toBe(14);
		expect(empty).toBe(true);
	});

	it('Reports another empty neighbour', () => {
		const { neighbour, empty } = grid.find_neighbour(12, 4);
		expect(neighbour).toBe(14);
		expect(empty).toBe(true);
	});

    it('Reports an non-empty neighbour', () => {
		const { neighbour, empty } = grid.find_neighbour(9, 8);
		expect(neighbour).toBe(22);
		expect(empty).toBe(false);
	});

	it('Reports an non-neighbour when going outside the grid', () => {
		const { neighbour, empty } = grid.find_neighbour(18, 8);
		expect(neighbour).toBe(-1);
		expect(empty).toBe(true);
	});
});
