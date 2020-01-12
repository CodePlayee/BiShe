import Gosper from "../Lib/gosper.js";
import {
  Point,
  Hex,
  OffsetCoord,
  DoubledCoord,
  Orientation,
  Layout
} from "../Lib/hex_new.js";

const stepLen = 30;
const initialAngle = Math.PI * 0.5;

const svg = document.querySelector("svg");
const gosperObj = new Gosper(
  svg,
  "#gosper",
  undefined,
  undefined,
  stepLen,
  initialAngle
);

gosperObj.drawCurve(3);
gosperObj.drawPts();

//gosper曲线节点
const nodes = gosperObj.pts;

//构建正六边形格网
const hexes = []; //存储所有正六边单元
const hexR = stepLen * 0.5 * (2 / Math.sqrt(3));
const size = new Point(hexR, hexR);
const origin = new Point(nodes[0][0], nodes[0][1]);
const layout = new Layout(Layout.flat, size, origin);

const fragment = document.createDocumentFragment();
for (let node of nodes) {
  const pt = new Point(node[0], node[1]);
  let hex = layout.pixelToHex(pt).round();
  const corners = layout.polygonCorners2(pt);
  hex.corners = corners;
  hexes.push(hex);

  const cornerStr = corners.reduce(
    (str, cur) => `${str} ${cur.x} ${cur.y}`,
    ""
  );
  const hexPolygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  hexPolygon.setAttribute("stroke", "green");
  hexPolygon.setAttribute("fill", "none");
  hexPolygon.setAttribute("points", cornerStr);
  fragment.appendChild(hexPolygon);
}

svg.appendChild(fragment);
