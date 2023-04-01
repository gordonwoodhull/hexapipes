import { describe, expect, it } from 'vitest';
import { HexaGrid } from './hexagrid';

describe('Test tile rotations', () => {
	const grid = new HexaGrid(3, 3, false);

	it('Rotate an end tile counter-clockwise', () => {
		let rotated = 1;
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(2);
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(4);
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(8);
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(16);
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(32);
		rotated = grid.rotate(rotated, -1);
		expect(rotated).toBe(1);
	});

	it('Rotate an end tile clockwise', () => {
		let rotated = 1;
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(32);
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(16);
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(8);
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(4);
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(2);
		rotated = grid.rotate(rotated, 1);
		expect(rotated).toBe(1);
	});

	it('Rotate an end tile in multiples', () => {
		let rotated = 1;
		expect(grid.rotate(rotated, 1)).toBe(32);
		expect(grid.rotate(rotated, 2)).toBe(16);
		expect(grid.rotate(rotated, 3)).toBe(8);
		expect(grid.rotate(rotated, 4)).toBe(4);
		expect(grid.rotate(rotated, 5)).toBe(2);
		expect(grid.rotate(rotated, 6)).toBe(1);
		expect(grid.rotate(rotated, -5)).toBe(32);
		expect(grid.rotate(rotated, -4)).toBe(16);
		expect(grid.rotate(rotated, -3)).toBe(8);
		expect(grid.rotate(rotated, -2)).toBe(4);
		expect(grid.rotate(rotated, -1)).toBe(2);
		expect(grid.rotate(rotated, -6)).toBe(1);
	});

	it('Rotate a straight tile in multiples', () => {
		let rotated = 9;
		expect(grid.rotate(rotated, 1)).toBe(36);
		expect(grid.rotate(rotated, 2)).toBe(18);
		expect(grid.rotate(rotated, 3)).toBe(9);
		expect(grid.rotate(rotated, 4)).toBe(36);
		expect(grid.rotate(rotated, 5)).toBe(18);
		expect(grid.rotate(rotated, 6)).toBe(9);
		expect(grid.rotate(rotated, -5)).toBe(36);
		expect(grid.rotate(rotated, -4)).toBe(18);
		expect(grid.rotate(rotated, -3)).toBe(9);
		expect(grid.rotate(rotated, -2)).toBe(36);
		expect(grid.rotate(rotated, -1)).toBe(18);
		expect(grid.rotate(rotated, -6)).toBe(9);
	});

	it('Return arm directions in original order', () => {
		expect(grid.getDirections(grid.T1, 0)).toStrictEqual([1]);
		expect(grid.getDirections(grid.T1, 1)).toStrictEqual([32]);
		expect(grid.getDirections(grid.T1, -1)).toStrictEqual([2]);

		expect(grid.getDirections(grid.T3y, 0)).toStrictEqual([1, 2, 8]);
		expect(grid.getDirections(grid.T3y, 1)).toStrictEqual([32, 1, 4]);
		expect(grid.getDirections(grid.T3y, -1)).toStrictEqual([2, 4, 16]);
		expect(grid.getDirections(grid.T3y, 6)).toStrictEqual([1, 2, 8]);
		expect(grid.getDirections(grid.T3y, 9)).toStrictEqual([8, 16, 1]);
		expect(grid.getDirections(grid.T3y, -13)).toStrictEqual([2, 4, 16]);
	});
});

describe('Test making a cell empty', () => {
	const grid = new HexaGrid(3, 3, false);
	grid.makeEmpty(4);

	it('Reports an empty neighbour', () => {
		const { neighbour, empty } = grid.find_neighbour(3, 1);
		expect(neighbour).toBe(4);
		expect(empty).toBe(true);
	});

	it('Reports an non-empty neighbour', () => {
		const { neighbour, empty } = grid.find_neighbour(3, 2);
		expect(neighbour).toBe(1);
		expect(empty).toBe(false);
	});

	it('Reports an non-neighbour when going outside the grid', () => {
		const { neighbour, empty } = grid.find_neighbour(3, 8);
		expect(neighbour).toBe(-1);
		expect(empty).toBe(true);
	});
});
