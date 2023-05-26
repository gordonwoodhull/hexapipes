import { RegularPolygonTile } from '$lib/puzzle/grids/polygonutils';
import { HexaGrid } from './hexagrid';

const EAST = 1;
const NORTH = 2;
const WEST = 4;
const SOUTH = 8;

const YSTEP = Math.sqrt(3) / 2 + 1;
const HEXYSTEP = Math.sqrt(3) / 2;
const TRIANGLE_RADIUS_IN = Math.sqrt(3) / 6;

const SQUARE = new RegularPolygonTile(4, 0, 0.5);
const UPTRIANGLE = new RegularPolygonTile(3, Math.PI / 6, TRIANGLE_RADIUS_IN, [1, 4, 8]);
const DOWNTRIANGLE = new RegularPolygonTile(3, -Math.PI / 6, TRIANGLE_RADIUS_IN, [1, 2, 4]);

export class EtratGrid {
	DIRECTIONS = [EAST, NORTH, WEST, SOUTH];
	EDGEMARK_DIRECTIONS = [NORTH, WEST];
	OPPOSITE = new Map([
		[NORTH, SOUTH],
		[SOUTH, NORTH],
		[EAST, WEST],
		[WEST, EAST]
	]);
	NUM_DIRECTIONS = 4;
	KIND = 'etrat';
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
		const even = height % 2 === 0;
		this.height = height;
		this.hexHeight = Math.ceil(height / 2) + (even ? 1 : 0);
		this.wrap = wrap;

		this.emptyCells = new Set();
		tiles.forEach((tile, index) => {
			if (tile === 0) {
				this.emptyCells.add(index);
			}
		});
		this.total = width * this.hexHeight * 3;
		if (!wrap) {
			for (let i = 0; i < width; i++) {
				this.makeEmpty(i * 3);
				this.makeEmpty(this.total - 1 - i * 3);
				if (even) {
					this.makeEmpty(this.total - 2 - i * 3);
				}
			}
		}

		this.hexagrid = new HexaGrid(width, this.hexHeight, wrap);
		this.XMIN = -0.6 - (wrap ? 1 : 0);
		this.XMAX = width + 0.1 + (wrap ? 1 : 0);
		this.YMIN = -YSTEP * (0.5 + (wrap ? 1 : 0));
		this.YMAX = YSTEP * (this.hexHeight + (wrap ? 1 : 0));
		if (!wrap) {
			this.YMAX -= HEXYSTEP + (even ? 1 : 0);
		}

		/* Tile types for use in solver */
		this.T0 = 0;
		this.T1 = 1;
		/** @type {Map<Number,Number>} */
		this.tileTypes = new Map();
		for (let t = 0; t < 64; t++) {
			let rotated = t;
			while (!this.tileTypes.has(rotated)) {
				this.tileTypes.set(rotated, t);
				rotated = this.rotate(rotated, 1);
			}
		}
	}

	/**
	 * @param {Number} index
	 */
	index_to_xy(index) {
		const hexIndex = Math.floor(index / 3);
		let [x0, y0] = this.hexagrid.index_to_xy(hexIndex);
		y0 *= YSTEP / HEXYSTEP;
		const unitIndex = index - 3 * hexIndex;
		if (unitIndex === 0) {
			// up triangle
			return [x0, y0 - 0.5 - TRIANGLE_RADIUS_IN];
		} else if (unitIndex === 1) {
			// square
			return [x0, y0];
		} else if (unitIndex === 2) {
			// down triangle
			return [x0, y0 + 0.5 + TRIANGLE_RADIUS_IN];
		}
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
		const hexTile = this.hexagrid.which_tile_at(x, (y * HEXYSTEP) / YSTEP);
		const x0 = hexTile.x;
		const y0 = (hexTile.y * YSTEP) / HEXYSTEP;
		const i0 = hexTile.index * 3;
		if (hexTile.index === -1) {
			return hexTile;
		}
		if (y0 - y > 0.5) {
			// up triangle
			const index = this.emptyCells.has(i0) ? -1 : i0;
			return { index, x: x0, y: y0 - 0.5 - TRIANGLE_RADIUS_IN };
		} else if (y0 - y < -0.5) {
			// down triangle
			const index = this.emptyCells.has(i0 + 2) ? -1 : i0 + 2;
			return { index: i0 + 2, x: x0, y: y0 + 0.5 + TRIANGLE_RADIUS_IN };
		} else {
			// square
			const index = this.emptyCells.has(i0 + 1) ? -1 : i0 + 1;
			return { index: i0 + 1, x: x0, y: y0 };
		}
	}

	/**
	 * @param {Number} index
	 * @param {Number} direction
	 * @returns {{neighbour: Number, empty: boolean}} - neighbour index, is the neighbour an empty cell or outside the board
	 */
	find_neighbour(index, direction) {
		const hexIndex = Math.floor(index / 3);
		const unitIndex = index - 3 * hexIndex;
		if (unitIndex === 0) {
			// up triangle
			if (direction === SOUTH) {
				const neighbour = index + 1;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			} else if (direction === NORTH) {
				return { neighbour: -1, empty: true };
			} else {
				const hexDirection = direction === EAST ? 2 : 4;
				const hexNeighbour = this.hexagrid.find_neighbour(hexIndex, hexDirection);
				if (hexNeighbour.empty) {
					return hexNeighbour;
				}
				const neighbour = 3 * hexNeighbour.neighbour + 2;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			}
		} else if (unitIndex === 2) {
			// down triangle
			if (direction === NORTH) {
				const neighbour = index - 1;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			} else if (direction === SOUTH) {
				return { neighbour: -1, empty: true };
			} else {
				const hexDirection = direction === EAST ? 32 : 16;
				const hexNeighbour = this.hexagrid.find_neighbour(hexIndex, hexDirection);
				if (hexNeighbour.empty) {
					return hexNeighbour;
				}
				const neighbour = 3 * hexNeighbour.neighbour;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			}
		} else {
			// square
			if (direction === NORTH) {
				const neighbour = index - 1;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			} else if (direction === SOUTH) {
				const neighbour = index + 1;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			} else {
				const hexDirection = direction === EAST ? 1 : 8;
				const hexNeighbour = this.hexagrid.find_neighbour(hexIndex, hexDirection);
				if (hexNeighbour.empty) {
					return hexNeighbour;
				}
				const neighbour = 3 * hexNeighbour.neighbour + 1;
				return { neighbour, empty: this.emptyCells.has(neighbour) };
			}
		}
	}

	/**
	 * Makes cell at index empty
	 * @param {Number} index
	 */
	makeEmpty(index) {
		this.emptyCells.add(index);
	}

	/**
	 * @param {Number} index
	 * @returns {RegularPolygonTile}
	 */
	polygon_at(index) {
		const unitIndex = index % 3;
		if (unitIndex === 0) {
			return UPTRIANGLE;
		} else if (unitIndex === 1) {
			return SQUARE;
		} else {
			return DOWNTRIANGLE;
		}
	}

	/**
	 * A number corresponding to fully connected tile
	 * @param {Number} index
	 * @returns {Number}
	 */
	fullyConnected(index) {
		return this.polygon_at(index).fully_connected;
	}

	/**
	 * Compute tile orientation after a number of rotations
	 * @param {Number} tile
	 * @param {Number} rotations
	 * @param {Number} index - index of tile, not used here
	 * @returns
	 */
	rotate(tile, rotations, index = 0) {
		return this.polygon_at(index).rotate(tile, rotations);
	}

	/**
	 * Get angle for displaying rotated pipes state
	 * @param {Number} rotations
	 * @param {Number} index
	 * @returns
	 */
	getAngle(rotations, index) {
		return this.polygon_at(index).get_angle(rotations);
	}

	/**
	 * Get CSS transform function parameters for this tile 
	 * @param {Number} index
	 */
	getTileTransformCSS(index) {
		return null;
	}

	/**
	 *
	 * @param {Number} tile
	 * @param {Number} rotations
	 * @param {Number} index
	 * @returns {Number[]}
	 */
	getDirections(tile, rotations = 0, index) {
		return this.polygon_at(index).get_directions(tile, rotations);
	}

	/**
	 * @param {import('$lib/puzzle/viewbox').ViewBox} box
	 * @returns {import('$lib/puzzle/viewbox').VisibleTile[]}
	 */
	getVisibleTiles(box) {
		const visibleHexagons = this.hexagrid.getVisibleTiles({
			xmin: box.xmin,
			width: box.width,
			ymin: (box.ymin * HEXYSTEP) / YSTEP,
			height: (box.height * HEXYSTEP) / YSTEP
		});
		const visibleTiles = [];
		for (let hexagon of visibleHexagons) {
			const y0 = (hexagon.y * YSTEP) / HEXYSTEP;
			const i0 = hexagon.index * 3;
			if (!this.emptyCells.has(i0)) {
				// up triangle
				visibleTiles.push({
					index: i0,
					x: hexagon.x,
					y: y0 - 0.5 - TRIANGLE_RADIUS_IN,
					key: hexagon.key + '_0'
				});
			}
			if (!this.emptyCells.has(i0 + 1)) {
				// square
				visibleTiles.push({
					index: i0 + 1,
					x: hexagon.x,
					y: y0,
					key: hexagon.key + '_1'
				});
			}
			if (!this.emptyCells.has(i0 + 2)) {
				// down triangle
				visibleTiles.push({
					index: i0 + 2,
					x: hexagon.x,
					y: y0 + 0.5 + TRIANGLE_RADIUS_IN,
					key: hexagon.key + '_2'
				});
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
		return this.polygon_at(index).contour_path;
	}

	/**
	 * Pipes lines path
	 * @param {Number} tile
	 * @param {Number} index
	 */
	getPipesPath(tile, index) {
		return this.polygon_at(index).get_pipes_path(tile);
	}

	/**
	 * Computes position for drawing the tile guiding dot
	 * @param {Number} tile
	 * @param {Number} index
	 * @returns {Number[]}
	 */
	getGuideDotPosition(tile, index = 0) {
		const [dx, dy] = this.polygon_at(index).get_guide_dot_position(tile);
		return [0.8 * dx, 0.8 * dy];
	}

	/**
	 * Compute number of rotations for orienting a tile with "click to orient" control mode
	 * @param {Number} tile
	 * @param {Number} old_rotations
	 * @param {Number} tx
	 * @param {Number} ty
	 * @param {Number} index
	 */
	clickOrientTile(tile, old_rotations, tx, ty, index = 0) {
		return this.polygon_at(index).click_orient_tile(tile, old_rotations, Math.atan2(-ty, tx));
	}

	/**
	 * Returns coordinates of endpoints of edgemark line
	 * @param {Number} direction
	 * @param {Boolean} isWall
	 * @param {Number} index
	 * @returns
	 */
	getEdgemarkLine(direction, isWall, index = 0) {
		return this.polygon_at(index).get_edgemark_line(direction);
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
		return this.polygon_at(tile_index).detect_edgemark_gesture(
			x1 - tile_x,
			x2 - tile_x,
			tile_y - y1,
			tile_y - y2
		);
	}

	/**
	 * Tells if a point is close to one of tile's edges
	 * @param {import('$lib/puzzle/controls').PointerOrigin} point
	 */
	whichEdge(point) {
		const { x, y, tileX, tileY, tileIndex } = point;
		const dx = x - tileX;
		const dy = tileY - y;
		return this.polygon_at(tileIndex).is_close_to_edge(dx, dy);
	}
}
