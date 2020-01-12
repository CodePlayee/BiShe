/**
 * Gosper Curve
 * Angle:60°
 * Axiom:A
 * Replacement rules:
 * A->A-B--B+A++AA+B-
 * B->+A-BB--B-A++A+B
 * Both A and B mean to move forward,
  + means to turn left 60 degrees,
  - means to turn right 60 degrees.
 */
class Gosper {
  /**
   *
   * @param {*} svg the root svg element
   * @param {*} gId the group as the container for gosper curve(svg->g->path)
   * @param {number} x  x value of the start pt of gosper curve
   * @param {number} y y value of the start pt of gosper curve
   * @param {*} step the length in screen of each segment in gosper curve.
   * @param {*} initalAngle the inital direction from the starting pt.
   */
  constructor(
    svg,
    gId = "gosper",
    x,
    y,
    step = 10,
    initalAngle = Math.PI * 0.5
  ) {
    svg = svg || document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("height", window.innerHeight || 600);
    svg.setAttribute("width", window.innerWidth || 960);
    this.svg = svg;
    let group = document.querySelector(gId);
    if (!group) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("id", gId);
      svg.appendChild(group);
    }
    this.group = group;

    this.x = x || 10;
    this.y = y || Math.round(svg.getAttribute("height") / 3);
    //the "d" attribute in "path" element in SVG
    this.d = "";
    this.initalAngle = initalAngle;
    this.step = step;
    //gosper曲线节点
    this.pts = [[this.x, this.y]];
  }

  replaceAll(str, mapObj) {
    const regExp = new RegExp(Object.keys(mapObj).join("|"), "gi");
    return str.replace(regExp, matched => mapObj[matched]);
  }

  produce(iterateLevel) {
    let result = Gosper.axiom;
    for (let i = 0; i < iterateLevel; i++) {
      result = this.replaceAll(result, Gosper.rules);
    }
    return result;
  }

  incX(angle) {
    return Math.round(Math.cos(angle) * this.step);
  }

  incY(angle) {
    return Math.round(Math.sin(angle) * this.step);
  }

  //采用 turtle graphic 语法，移动一步，产生一个节点
  moveStep(angle) {
    this.d += `M${this.x} ${this.y} `;
    this.x += this.incX(angle);
    this.y += this.incY(angle);
    this.d += `L${this.x} ${this.y} `;
    this.pts.push([this.x, this.y]);
  }

  drawCurve(iterateLevel, curveColor = "black") {
    const children = this.group.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
      this.group.removeChild(children[i]);
    }

    let angle = this.initalAngle;
    const result = this.produce(iterateLevel);

    for (let stringIndex = 0; stringIndex < result.length; stringIndex++) {
      switch (result[stringIndex]) {
        case "A":
        case "B":
          this.moveStep(angle);
          break;
        case "-":
          angle -= Math.PI / 3;
          break;
        case "+":
          angle += Math.PI / 3;
          break;
      }
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", curveColor);
    const data4path = this.d;
    path.setAttribute("d", data4path);
    this.group.appendChild(path);

    return result;
  }

  //绘制gosper曲线节点
  drawPts(ptColor = "red") {
    const fragment = document.createDocumentFragment();
    this.pts.forEach(pt => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", pt[0]);
      circle.setAttribute("cy", pt[1]);
      circle.setAttribute("r", 2);
      circle.setAttribute("fill", ptColor);
      fragment.appendChild(circle);
    });
    this.group.appendChild(fragment);
  }
}

//静态属性
Gosper.axiom = "A";
Gosper.rules = {
  A: "A-B--B+A++AA+B-",
  B: "+A-BB--B-A++A+B"
};

export default Gosper;
