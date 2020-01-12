// the following code is base on http://www.redblobgames.com/grids/hexagons/
// Thanks to Amit and other experts in related domain.
// GaoZhen at 2020/01/01

// Notes:
// Recommand: cube coordinates for algorithms and axial or doubled for storage.

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

//采用三斜轴坐标系(cube coordinates come from 3d cartesian coordinates.)
class Hex {
  constructor(q, r, s, corners) {
    this.q = q;
    this.r = r;
    this.s = s;
    this.corners = corners || []; //added by gz
  }
  add(b) {
    return new Hex(this.q + b.q, this.r + b.r, this.s + b.s);
  }
  subtract(b) {
    return new Hex(this.q - b.q, this.r - b.r, this.s - b.s);
  }
  scale(k) {
    return new Hex(this.q * k, this.r * k, this.s * k);
  }
  rotateLeft() {
    return new Hex(-this.s, -this.q, -this.r);
  }
  rotateRight() {
    return new Hex(-this.r, -this.s, -this.q);
  }
  static direction(direction) {
    return Hex.directions[direction];
  }
  neighbor(direction) {
    return this.add(Hex.direction(direction));
  }
  diagonalNeighbor(direction) {
    return this.add(Hex.diagonals[direction]);
  }
  //Adjacent hexagons are distance 1 apart in the hex grid but distance 2 apart in the cube grid.
  //In a cube grid, Manhattan distances are abs(dx) + abs(dy) + abs(dz). The distance on a hex grid is half that.
  len() {
    return (Math.abs(this.q) + Math.abs(this.r) + Math.abs(this.s)) / 2;
  }
  distance(b) {
    return this.subtract(b).len();
  }
  round() {
    let qi = Math.round(this.q);
    let ri = Math.round(this.r);
    let si = Math.round(this.s);
    const q_diff = Math.abs(qi - this.q);
    const r_diff = Math.abs(ri - this.r);
    const s_diff = Math.abs(si - this.s);
    if (q_diff > r_diff && q_diff > s_diff) {
      qi = -ri - si;
    } else if (r_diff > s_diff) {
      ri = -qi - si;
    } else {
      si = -qi - ri;
    }
    return new Hex(qi, ri, si);
  }
  lerp(b, t) {
    return new Hex(
      this.q * (1.0 - t) + b.q * t,
      this.r * (1.0 - t) + b.r * t,
      this.s * (1.0 - t) + b.s * t
    );
  }
  linedraw(b) {
    const N = this.distance(b);
    const a_nudge = new Hex(this.q + 1e-6, this.r + 1e-6, this.s - 2e-6);
    const b_nudge = new Hex(b.q + 1e-6, b.r + 1e-6, b.s - 2e-6);
    const results = [];
    const step = 1.0 / Math.max(N, 1);
    for (const i = 0; i <= N; i++) {
      results.push(a_nudge.lerp(b_nudge, step * i).round());
    }
    return results;
  }
}

Hex.directions = [
  new Hex(1, 0, -1),
  new Hex(1, -1, 0),
  new Hex(0, -1, 1),
  new Hex(-1, 0, 1),
  new Hex(-1, 1, 0),
  new Hex(0, 1, -1)
];
Hex.diagonals = [
  new Hex(2, -1, -1),
  new Hex(1, -2, 1),
  new Hex(-1, -1, 2),
  new Hex(-2, 1, 1),
  new Hex(-1, 2, -1),
  new Hex(1, 1, -2)
];

//采用笛卡尔直角坐标系
class OffsetCoord {
  constructor(col, row) {
    this.col = col;
    this.row = row;
  }
  //三斜轴坐标转直角坐标（q代表平底型,r代表顶角型）
  static qoffsetFromCube(offset, h) {
    const col = h.q;
    const row = h.r + (h.q + offset * (h.q & 1)) / 2;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return new OffsetCoord(col, row);
  }
  static qoffsetToCube(offset, h) {
    const q = h.col;
    const r = h.row - (h.col + offset * (h.col & 1)) / 2;
    const s = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return new Hex(q, r, s);
  }
  static roffsetFromCube(offset, h) {
    const col = h.q + (h.r + offset * (h.r & 1)) / 2;
    const row = h.r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return new OffsetCoord(col, row);
  }
  static roffsetToCube(offset, h) {
    const q = h.col - (h.row + offset * (h.row & 1)) / 2;
    const r = h.row;
    const s = -q - r;
    if (offset !== OffsetCoord.EVEN && offset !== OffsetCoord.ODD) {
      throw "offset must be EVEN (+1) or ODD (-1)";
    }
    return new Hex(q, r, s);
  }
}

OffsetCoord.EVEN = 1;
OffsetCoord.ODD = -1;

//另一种直角坐标系
class DoubledCoord {
  constructor(col, row) {
    this.col = col;
    this.row = row;
  }
  //q代表平底型,r代表顶角型
  static qdoubledFromCube(h) {
    const col = h.q;
    const row = 2 * h.r + h.q;
    return new DoubledCoord(col, row);
  }
  qdoubledToCube() {
    const q = this.col;
    const r = (this.row - this.col) / 2;
    const s = -q - r;
    return new Hex(q, r, s);
  }
  static rdoubledFromCube(h) {
    const col = 2 * h.q + h.r;
    const row = h.r;
    return new DoubledCoord(col, row);
  }
  rdoubledToCube() {
    const q = (this.col - this.row) / 2;
    const r = this.row;
    const s = -q - r;
    return new Hex(q, r, s);
  }
}

/**
 * the helper class for layout
 * @param f(0-3):forward matrix
 * @param b(0-3):inverse matrix
 */
class Orientation {
  constructor(f0, f1, f2, f3, b0, b1, b2, b3, start_angle) {
    this.f0 = f0;
    this.f1 = f1;
    this.f2 = f2;
    this.f3 = f3;
    this.b0 = b0;
    this.b1 = b1;
    this.b2 = b2;
    this.b3 = b3;
    this.start_angle = start_angle;
  }
}

class Layout {
  /**
   *
   * @param {Orientation} orientation
   * @param {Point} size 用于在横纵方向拉伸或挤压六边形（注意不等同于宽高）
   * @param {Point} origin 六边形系统在绘图区域的原点
   */
  constructor(orientation, size, origin) {
    this.orientation = orientation;
    this.size = size;
    this.origin = origin;
  }
  //hex(the center point of hex) to screen
  hexToPixel(h) {
    const M = this.orientation;
    const size = this.size;
    const origin = this.origin;
    const x = (M.f0 * h.q + M.f1 * h.r) * size.x;
    const y = (M.f2 * h.q + M.f3 * h.r) * size.y;
    return new Point(x + origin.x, y + origin.y);
  }

  /**
   * screen to hex
   * @param {Point} p
   * @returns {Hex} fractional hex
   */
  pixelToHex(p) {
    const M = this.orientation;
    const size = this.size;
    const origin = this.origin;
    const pt = new Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
    const q = M.b0 * pt.x + M.b1 * pt.y;
    const r = M.b2 * pt.x + M.b3 * pt.y;
    return new Hex(q, r, -q - r);
  }

  /**
   * calculate the relative coordinates of a corner of one hex.
   * @param {int} corner
   */
  hexCornerOffset(corner) {
    const M = this.orientation;
    const size = this.size;
    const angle = (2.0 * Math.PI * (M.start_angle - corner)) / 6.0;
    return new Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
  }

  /**
   * get the corners of one hex
   * @param {Hex} h
   */
  polygonCorners(h) {
    const corners = [];
    const center = this.hexToPixel(h);
    for (const i = 0; i < 6; i++) {
      const offset = this.hexCornerOffset(i);
      corners.push(new Point(center.x + offset.x, center.y + offset.y));
    }
    return corners;
  }

  /**
   *
   * @param {Point} p 正六边形单元中心的屏幕坐标点
   */
  polygonCorners2(p) {
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const offset = this.hexCornerOffset(i);
      corners.push(new Point(p.x + offset.x, p.y + offset.y));
    }
    return corners;
  }
}

//there are only two orientations: pointy and flat.
Layout.pointy = new Orientation(
  Math.sqrt(3.0),
  Math.sqrt(3.0) / 2.0,
  0.0,
  3.0 / 2.0,
  Math.sqrt(3.0) / 3.0,
  -1.0 / 3.0,
  0.0,
  2.0 / 3.0,
  0.5
);
Layout.flat = new Orientation(
  3.0 / 2.0,
  0.0,
  Math.sqrt(3.0) / 2.0,
  Math.sqrt(3.0),
  2.0 / 3.0,
  0.0,
  -1.0 / 3.0,
  Math.sqrt(3.0) / 3.0,
  0.0
);

export { Point, Hex, OffsetCoord, DoubledCoord, Orientation, Layout };
