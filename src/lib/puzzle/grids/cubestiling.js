import { RegularPolygonTile } from '$lib/puzzle/grids/polygonutils';

const DIRA = 1;
const DIRB = 2;
const DIRC = 4;
const DIRD = 8;

const YSTEP = Math.sqrt(3) / 2;
const SQUARE = new RegularPolygonTile(4, 0, 0.5);
const RHOMB_ANGLES = new Map([
	[0, Math.PI / 6],
	[1, - Math.PI / 6],
	[2, Math.PI / 2]
]);

export class CubesTiling {
	DIRECTIONS = [DIRA, DIRB, DIRC, DIRD];
	EDGEMARK_DIRECTIONS = [DIRB, DIRC];
	OPPOSITE = new Map([
		[DIRB, DIRD],
		[DIRD, DIRB],
		[DIRA, DIRC],
		[DIRC, DIRA]
	]);
	#XY_DELTA_RHOMB = new Map([
			[0, new Map([
				[DIRA, [[1, 1], 0, 2]],
				[DIRB, [[0, 0], 0, 1]],
				[DIRC, [[0, 0], 0, 2]],
				[DIRD, [[0, 1], 1, 1]]
			])],
			[1, new Map([
				[DIRA, [[0, 1], -1, 2]],
				[DIRB, [[-1, 0], -1, 0]],
				[DIRC, [[0, 0], 0, 2]],
				[DIRD, [[0, 0], 0, 0]]
			])],
			[2, new Map([
				[DIRA, [[0, 0], 0, 0]],
				[DIRB, [[0, 0], 0, 1]],
				[DIRC, [[-1, -1], 0, 0]],
				[DIRD, [[-1, 0], 1, 1]]
			])],

	])
	NUM_DIRECTIONS = 4;
	KIND = 'cubes';
	PIPE_WIDTH = 0.15;
	STROKE_WIDTH = 0.06;
	PIPE_LENGTH = 0.5;
	SINK_RADIUS = 0.2;

	/** @type {Set<Number>} - indices of empty cells */
	emptyCells;
	/** @type {Number} - total number of cells including empties */
	total;

	/**
	 *
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Boolean} wrap
	 * @param {Number[]} tiles
	 */
	constructor(width, height, wrap, tiles = []) {
		this.width = width;
		this.height = height;
		this.wrap = wrap;

		this.emptyCells = new Set();
		tiles.forEach((tile, index) => {
			if (tile === 0) {
				this.emptyCells.add(index);
			}
		});
		this.total = width * height * 3;

		this.XMIN = -0.6 - (wrap ? 1 : 0);
		this.XMAX = width - 0.4 + (wrap ? 1 : 0);
		this.YMIN = -(1 + (wrap ? 1 : 0));
		this.YMAX = height + (wrap ? 1 : 0);

		/* Tile types for use in solver */
		this.T0 = 0;
		this.T1 = 1;
		this.T2L = 3;
		this.T2I = 5;
		this.T3 = 7;
		/** @type {Map<Number,Number>} */
		this.tileTypes = new Map();
		for (let t = 0; t < 16; t++) {
			let rotated = t;
			while (!this.tileTypes.has(rotated)) {
				this.tileTypes.set(rotated, t);
				rotated = this.rotate(rotated, 1);
			}
		}
	}

	/**
	 * @param {Number} angle
	 */
	angle_to_rhomb(angle) {
		/* Counter-clockwise from lower right of "right side up" cube */
		return (Math.floor((angle + Math.PI/2) * 3 / (2 * Math.PI)) + 3) % 3;
	}

	/**
	 * Determines which tile a point at (x, y) belongs to
	 * Returns tile index and tile center coordinates
	 * If the point is over empty space then tileIndex is -1
	 * @param {Number} x
	 * @param {Number} y
	 * @returns {{index: Number, x:Number, y: Number, rh: Number}}
	 */
	which_tile_at(x, y) {
		const r = y / YSTEP;
		const r0 = Math.round(r);
		const c0 = Math.round(x - (r0 % 2 === 0 ? 0 : 0.5));
		const x0 = c0 + (r0 % 2 === 0 ? 0.0 : 0.5);
		const y0 = r0 * YSTEP;
		const distance0 = Math.sqrt((x - x0) ** 2 + (y - y0) ** 2);
		const rhomb0 = this.angle_to_rhomb(Math.atan2(y - y0, x - x0));
		let index = this.rcb_to_index(y0, x0, rhomb0);
		if (distance0 <= 0.5) {
			return {
				index: this.rcb_to_index(r0, c0, rhomb0),
				x: x0,
				y: y0,
				rh: rhomb0
			};
		} else {
			let r1 = Math.floor(r);
			if (r1 === r0) {
				r1 = Math.ceil(r);
			}
			const c1 = Math.round(x - (r1 % 2 === 0 ? 0 : 0.5));
			const x1 = c1 + (r1 % 2 === 0 ? 0.0 : 0.5);
			const y1 = r1 * YSTEP;
			const distance1 = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
			const rhomb1 = this.angle_to_rhomb(Math.atan2(y - y1, x - x1));
			if (distance0 < distance1) {
				return {
					index: this.rcb_to_index(r0, c0, rhomb0),
					x: x0,
					y: y0,
					rh: rhomb0
				};
			} else {
				return {
					index: this.rcb_to_index(r1, c1, rhomb1),
					x: x1,
					y: y1,
					rh: rhomb1
				};
			}
		}
	}

	/**
	 * @param {Number} index
	 * @param {Number} direction
	 * @returns {{neighbour: Number, empty: boolean}} - neighbour index, is the neighbour an empty cell or outside the board
	 */
	find_neighbour(index, direction) {
		const rhomb = index % 3;
		const cubei = Math.floor(index/3);
		let c = cubei % this.width;
		let r = (cubei - c) / this.width;
		let neighbour = -1;

		const [dxs, dy, rh] = this.#XY_DELTA_RHOMB.get(rhomb)?.get(direction) || [0, 0, 0];
		const rpar = r % 2;
		r += dy;
		c += dxs[rpar];
		if (this.wrap) {
			if (r == -1) {
				r = this.height - 1;
				c += 1;
			}
			if (r == this.height) {
				r = 0;
				c -= 1 - (this.height % 2);
			}
			if (c < 0 || c === this.width) {
				c = (c + this.width) % this.width;
			}
		}
		if (r < 0 || r >= this.height) {
			neighbour = -1;
		} else if (c < 0 || c >= this.width) {
			neighbour = -1;
		} else {
			neighbour = (this.width * r + c) * 3 + rh;
		}
		const empty = neighbour === -1 || this.emptyCells.has(neighbour);
		return { neighbour, empty };
	}

	/**
	 * Get index of tile located at row r column c rhomb b
	 * @param {Number} r
	 * @param {Number} c
	 * @param {Number} b
	 * @returns {Number}
	 */
	rcb_to_index(r, c, b) {
		if (this.wrap) {
			r = r % this.height;
			if (r < 0) {
				r += this.height;
			}
			c = c % this.width;
			if (c < 0) {
				c += this.width;
			}
		} else {
			if (r < 0 || r >= this.height) {
				return -1;
			} else if (c < 0 || c >= this.width) {
				return -1;
			}
		}
		return (this.width * r + c) * 3 + b;
	}

	/**
	 * Makes cell at index empty
	 * @param {Number} index
	 */
	makeEmpty(index) {
		this.emptyCells.add(index);
	}

	/**
	 * A number corresponding to fully connected tile
	 * @param {Number} index
	 * @returns {Number}
	 */
	fullyConnected(index) {
		return 15;
	}

	/**
	 * Compute tile orientation after a number of rotations
	 * @param {Number} tile
	 * @param {Number} rotations
	 * @param {Number} index - index of tile
	 * @returns
	 */
	rotate(tile, rotations, index) {
		return SQUARE.rotate(tile, rotations);
	}

	/**
	 * Get angle for displaying rotated pipes state
	 * @param {Number} rotations
	 * @param {Number} index
	 * @returns
	 */
	getAngle(rotations, index) {
		return SQUARE.get_angle(rotations);
	}

	/**
	 * Get angle to rotate the entire tile
	 * @param {Number} index
	 * @returns
	 */
	getTileAngle(index) {
		return RHOMB_ANGLES.get(index % 3);
	}

	/**
	 * @param {Number} index
	 */
	getSkew(index) {
		return Math.PI / 6;
	}

	/**
	 * @param {Number} index
	 */
	getYScale(index) {
		return YSTEP;
	}

	/**
	 *
	 * @param {Number} tile
	 * @param {Number} rotations
	 * @returns {Number[]}
	 */
	getDirections(tile, rotations = 0) {
		return SQUARE.get_directions(tile, rotations);
	}

	/**
	 * @param {import('$lib/puzzle/viewbox').ViewBox} box
	 * @returns {import('$lib/puzzle/viewbox').VisibleTile[]}
	 */
	getVisibleTiles(box) {
		let rmin = Math.floor(box.ymin) - 1;
		let rmax = Math.ceil(box.ymin + box.height) + 1;
		if (!this.wrap) {
			rmin = Math.max(0, rmin);
			rmax = Math.min(this.height - 1, rmax);
		}
		let cmin = Math.floor(box.xmin) - 1;
		let cmax = Math.ceil(box.xmin + box.width) + 1;
		if (!this.wrap) {
			cmin = Math.max(0, cmin);
			cmax = Math.min(this.width - 1, cmax);
		}
		const visibleTiles = [];
		for (let r = rmin; r <= rmax; r++) {
			for (let c = cmin; c <= cmax; c++) {
				for (let b = 0; b < 3; ++b) {
					const index = this.rcb_to_index(r, c, b);
					if (index === -1) {
						continue;
					}
					const x = c;
					const y = r;
					const key = `${Math.round(x)}_${Math.round(y)}_${b}`;
					visibleTiles.push({
						index,
						x,
						y,
						b,
						key
					});
				}
			}
		}
		return visibleTiles;
	}

	/**
	 * Tile contour path for svg drawing
	 * @param {Number} index
	 * @returns
	 */
	getTilePath(index) {
		return SQUARE.contour_path;
	}

	/**
	 * Pipes lines path
	 * @param {Number} tile
	 * @param {Number} index
	 */
	getPipesPath(tile, index) {
		return SQUARE.get_pipes_path(tile);
	}

	/**
	 * Computes position for drawing the tile guiding dot
	 * @param {Number} tile
	 * * @param {Number} index
	 * @returns {Number[]}
	 */
	getGuideDotPosition(tile, index) {
		const [dx, dy] = SQUARE.get_guide_dot_position(tile);
		return [0.8 * dx, 0.8 * dy];
	}
	/**
	 * Compute number of rotations for orienting a tile with "click to orient" control mode
	 * @param {Number} tile
	 * @param {Number} old_rotations
	 * @param {Number} new_angle
	 * @param {Number} index
	 */
	clickOrientTile(tile, old_rotations, new_angle, index = 0) {
		return SQUARE.click_orient_tile(tile, old_rotations, new_angle);
	}
	/**
	 * Returns coordinates of endpoints of edgemark line
	 * @param {Number} direction
	 * @param {Number} index
	 * @returns
	 */
	getEdgemarkLine(direction, index = 0) {
		return SQUARE.get_edgemark_line(direction);
	}

	/**
	 * Check if a drag gesture resembles drawing an edge mark
	 * @param {Number} tile_index
	 * @param {Number} tile_x
	 * @param {Number} tile_y
	 * @param {Number} x1
	 * @param {Number} x2
	 * @param {Number} y1
	 * @param {Number} y2
	 */
	detectEdgemarkGesture(tile_index, tile_x, tile_y, x1, x2, y1, y2) {
		return SQUARE.detect_edgemark_gesture(x1 - tile_x, x2 - tile_x, tile_y - y1, tile_y - y2);
	}

	/**
	 * Tells if a point is close to one of tile's edges
	 * @param {import('$lib/puzzle/controls').PointerOrigin} point
	 */
	whichEdge(point) {
		const { x, y, tileX, tileY } = point;
		const dx = x - tileX;
		const dy = tileY - y;
		return SQUARE.is_close_to_edge(dx, dy);
	}
}
