import { RegularPolygonTile } from '$lib/puzzle/grids/polygonutils';
import { AbstractGrid } from '$lib/puzzle/grids/abstractgrid';
import { SquareGrid } from './squaregrid';

const EAST = 1;
const NORTH = 2;
const WEST = 4;
const SOUTH = 8;

const STEP = 2 * Math.cos(Math.PI / 12);
const TRIANGLE_RADIUS_IN = Math.sqrt(3) / 6;

const SQUARE_0 = new RegularPolygonTile(4, Math.PI / 12, 0.5);
const SQUARE_3 = new RegularPolygonTile(4, -Math.PI / 12, 0.5);
const TRIANGLE_1 = new RegularPolygonTile(3, (-3 * Math.PI) / 12, TRIANGLE_RADIUS_IN, [1, 2, 4]);
const TRIANGLE_2 = new RegularPolygonTile(3, Math.PI / 12, TRIANGLE_RADIUS_IN, [1, 4, 8]);
const TRIANGLE_4 = new RegularPolygonTile(3, (-Math.PI * 1) / 12, TRIANGLE_RADIUS_IN, [1, 2, 4]);
const TRIANGLE_5 = new RegularPolygonTile(3, (Math.PI * 3) / 12, TRIANGLE_RADIUS_IN, [1, 4, 8]);

const polygons = [SQUARE_0, TRIANGLE_1, TRIANGLE_2, SQUARE_3, TRIANGLE_4, TRIANGLE_5];
const offsets = [
	{
		dx: SQUARE_0.radius_out * Math.cos((Math.PI * 5) / 6),
		dy: -SQUARE_0.radius_out * Math.sin((Math.PI * 5) / 6)
	},
	{
		dx: TRIANGLE_1.radius_out * Math.cos((Math.PI * 5) / 12),
		dy: -TRIANGLE_1.radius_out * Math.sin((Math.PI * 5) / 12)
	},
	{
		dx: TRIANGLE_2.radius_out * Math.cos(Math.PI / 12),
		dy: -TRIANGLE_2.radius_out * Math.sin(Math.PI / 12)
	},
	{
		dx: SQUARE_3.radius_out * Math.cos(-Math.PI / 3),
		dy: -SQUARE_3.radius_out * Math.sin(-Math.PI / 3)
	},
	{
		dx: TRIANGLE_4.radius_out * Math.cos(-(Math.PI * 3) / 4),
		dy: -TRIANGLE_4.radius_out * Math.sin(-(Math.PI * 3) / 4)
	},
	{
		dx: 2 * TRIANGLE_5.radius_out * Math.cos(-(Math.PI * 3) / 4),
		dy: -2 * TRIANGLE_5.radius_out * Math.sin(-(Math.PI * 3) / 4)
	}
];

export class SnubSquareGrid extends AbstractGrid {
	DIRECTIONS = [EAST, NORTH, WEST, SOUTH];
	EDGEMARK_DIRECTIONS = [NORTH, WEST];
	OPPOSITE = new Map([
		[NORTH, SOUTH],
		[SOUTH, NORTH],
		[EAST, WEST],
		[WEST, EAST]
	]);
	NUM_DIRECTIONS = 4;
	KIND = 'snubsquare';
	PIPE_WIDTH = 0.15;
	STROKE_WIDTH = 0.06;
	PIPE_LENGTH = 0.5;
	SINK_RADIUS = 0.2;

	/**
	 *
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Boolean} wrap
	 * @param {Number[]} tiles
	 */
	constructor(width, height, wrap, tiles = []) {
		super(width, height, wrap, tiles);
		this.w = Math.round(width / Math.sqrt(6));
		this.h = Math.round(height / Math.sqrt(6));
		this.squaregrid = new SquareGrid(this.w, this.h, wrap);

		if (tiles.length === 0 && !this.wrap) {
			this.emptyCells.add((this.w * this.h - this.w) * 6 + 5);
		}

		this.total = this.w * this.h * 6;

		this.XMIN = STEP * this.squaregrid.XMIN;
		this.XMAX = STEP * this.squaregrid.XMAX;
		this.YMIN = STEP * this.squaregrid.YMIN;
		this.YMAX = STEP * this.squaregrid.YMAX;
	}

	/**
	 * Determines which tile a point at (x, y) belongs to
	 * Returns tile index and tile center coordinates
	 * If the point is over empty space then tileIndex is -1
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {{index: Number, x:Number, y: Number}}
	 */
	which_tile_at(x, y) {
		const c0 = Math.round(x / STEP);
		const r0 = Math.round(y / STEP);
		const to_check = [];
		const x0 = c0 * STEP;
		const y0 = r0 * STEP;
		// why are you guys so unaligned with the grid...
		if (x >= x0) {
			if (y >= y0) {
				to_check.push(
					{ r: r0, c: c0, i: 3 },
					{ r: r0, c: c0, i: 2 },
					{ r: r0, c: c0 + 1, i: 5 },
					{ r: r0, c: c0 + 1, i: 0 }
				);
			} else {
				to_check.push(
					{ r: r0, c: c0, i: 1 },
					{ r: r0, c: c0, i: 2 },
					{ r: r0, c: c0 + 1, i: 0 },
					{ r: r0 - 1, c: c0, i: 3 },
					{ r: r0 - 1, c: c0 + 1, i: 5 }
				);
			}
		} else {
			if (y >= y0) {
				to_check.push(
					{ r: r0, c: c0, i: 4 },
					{ r: r0, c: c0, i: 5 },
					{ r: r0, c: c0, i: 0 },
					{ r: r0, c: c0, i: 3 }
				);
			} else {
				to_check.push({ r: r0, c: c0, i: 0 }, { r: r0, c: c0, i: 1 }, { r: r0 - 1, c: c0, i: 5 });
			}
		}
		for (const { r, c, i } of to_check) {
			const sqIndex = this.squaregrid.rc_to_index(r, c);
			if (sqIndex < 0) {
				continue;
			}
			const index = sqIndex * 6 + i;
			const polygon = this.polygon_at(index);
			const { dx, dy } = offsets[i];
			const x0 = c * STEP;
			const y0 = r * STEP;
			const inside = polygon.is_inside(x - x0 - dx, y - y0 - dy);
			if (inside) {
				if (this.emptyCells.has(index)) {
					return { index: -1, x: 0, y: 0 };
				} else {
					return { index, x: x0 + dx, y: y0 + dy };
				}
			}
		}
		return { index: -1, x: 0, y: 0 };
	}

	/**
	 * Helper method for find_neighbour
	 * @param {number} squareIndex
	 * @param {number} unitIndex
	 * @param {boolean} sameUnit
	 * @param {number} direction
	 * @returns {{neighbour: Number, empty: boolean, oppositeDirection: Number}}
	 */
	_calc_neighbour(squareIndex, unitIndex, sameUnit, direction) {
		const oppositeDirection = this.OPPOSITE.get(direction) || 0;
		if (sameUnit) {
			// stayed in the same unit
			const neighbour = 6 * squareIndex + unitIndex;
			const empty = this.emptyCells.has(neighbour);
			return { neighbour, empty, oppositeDirection };
		} else {
			const square_neighbour = this.squaregrid.find_neighbour(squareIndex, direction);
			if (square_neighbour.empty) {
				return { neighbour: -1, empty: true, oppositeDirection };
			}
			const neighbour = 6 * square_neighbour.neighbour + unitIndex;
			const empty = this.emptyCells.has(neighbour);
			return { neighbour, empty, oppositeDirection };
		}
	}
	/**
	 * @param {Number} index
	 * @param {Number} direction
	 * @returns {{neighbour: Number, empty: boolean, oppositeDirection: Number}} - neighbour index, is the neighbour an empty cell or outside the board
	 */
	find_neighbour(index, direction) {
		const squareIndex = Math.floor(index / 6);
		const unitIndex = index - 6 * squareIndex;
		if (unitIndex === 0) {
			// square_0
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 1, true, direction);
			} else if (direction === SOUTH) {
				return this._calc_neighbour(squareIndex, 4, true, direction);
			} else if (direction === NORTH) {
				return this._calc_neighbour(squareIndex, 5, false, direction);
			} else {
				return this._calc_neighbour(squareIndex, 2, false, direction);
			}
		} else if (unitIndex === 1) {
			// triangle_1
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 2, true, direction);
			} else if (direction === NORTH) {
				return this._calc_neighbour(squareIndex, 3, false, direction);
			} else {
				return this._calc_neighbour(squareIndex, 0, true, direction);
			}
		} else if (unitIndex === 2) {
			// triangle_2
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 0, false, direction);
			} else if (direction === WEST) {
				return this._calc_neighbour(squareIndex, 1, true, direction);
			} else {
				return this._calc_neighbour(squareIndex, 3, true, direction);
			}
		} else if (unitIndex === 3) {
			// square_3
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 5, false, direction);
			} else if (direction === NORTH) {
				return this._calc_neighbour(squareIndex, 2, true, direction);
			} else if (direction === WEST) {
				return this._calc_neighbour(squareIndex, 4, true, direction);
			} else {
				return this._calc_neighbour(squareIndex, 1, false, direction);
			}
		} else if (unitIndex === 4) {
			// triangle_4
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 3, true, direction);
			} else if (direction === NORTH) {
				return this._calc_neighbour(squareIndex, 0, true, direction);
			} else {
				return this._calc_neighbour(squareIndex, 5, true, direction);
			}
		} else {
			// triangle_5
			if (direction === EAST) {
				return this._calc_neighbour(squareIndex, 4, true, direction);
			} else if (direction === WEST) {
				return this._calc_neighbour(squareIndex, 3, false, direction);
			} else {
				return this._calc_neighbour(squareIndex, 0, false, direction);
			}
		}
	}

	/**
	 * @param {Number} index
	 * @returns {RegularPolygonTile}
	 */
	polygon_at(index) {
		const unitIndex = index % 6;
		return polygons[unitIndex];
	}

	/**
	 * Get CSS transform function parameters for this tile
	 * @param {Number} index
	 */
	getTileTransformCSS(index) {
		return null;
	}

	/**
	 * @param {import('$lib/puzzle/viewbox').ViewBox} box
	 * @returns {import('$lib/puzzle/viewbox').VisibleTile[]}
	 */
	getVisibleTiles(box) {
		const visibleSquares = this.squaregrid.getVisibleTiles({
			xmin: box.xmin / STEP,
			width: box.width / STEP,
			ymin: box.ymin / STEP,
			height: box.height / STEP
		});
		const visibleTiles = [];
		for (let square of visibleSquares) {
			const x0 = square.x * STEP;
			const y0 = square.y * STEP;
			const i0 = square.index * 6;
			for (let i = 0; i < 6; i++) {
				const index = i0 + i;
				if (!this.emptyCells.has(index)) {
					const { dx, dy } = offsets[i];
					visibleTiles.push({
						index,
						x: x0 + dx,
						y: y0 + dy,
						key: square.key + `_${i}`
					});
				}
			}
		}
		return visibleTiles;
	}
}
