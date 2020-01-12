//------------------------------ 1 格网坐标系统;六边形------------------------------
let _coordType = { hexagon: 0, square: 1 };
let _coordSystem = function(coordType, unit) {
  let coord = undefined;
  if (coordType) {
    coord = new _squareCoord(_pointPixel(0, 0), unit);
  } else {
    coord = new _hexCoord(_pointPixel(0, 0), unit / _sqrt3);
  }
  coord.coordType = coordType || 0;
  return coord;
};
let _coord = function() {};
_coord.prototype = {};
//------------------------------ 1.1 三斜轴坐标系x+y+z=0 ------------------------------

//三斜轴坐标系
//@param [pointPixel] 坐标原点在画布的位置
//@param [number] 单位长度
let _hexCoord = function(pointOrigin, unit) {
  //坐标原点x y
  this.origin = pointOrigin || _pointPixel(0, 0);
  //坐标单位长度,像素值
  this.unit = unit || 20 / _sqrt3;
  //偏移量x y
  this.offset = _pointPixel(0, 0);
};
_hexCoord.prototype = {
  toString: function() {
    return "Origin:" + this.origin + ";Unit:" + this.unit;
  },
  //六边形高度
  //@return [number]
  height: function() {
    return this.unit * Math.sqrt(3);
  },
  //根据三斜轴坐标计算屏幕坐标
  //@param [pointCoord] 坐标点
  //@return [pointPixel]
  getCenterPixel: function(pointCoord) {
    let y = (3 / 2) * this.unit * pointCoord.z + this.origin.y,
      x = this.origin.x + (pointCoord.x + pointCoord.z / 2) * this.height();
    return _pointPixel(x, y);
  },
  //通过鼠标位置的画布坐标获取coordSystem
  //@param [pointPixel] 画布像素坐标点
  //@return [pointCoord]
  getHotCoord: function(pixelPosition) {
    //根据屏幕坐标 大致计算在哪个格子(结果不是整数)
    //这里的计算就是getCenterPixel的逆过程
    let hexZ = (pixelPosition.y - this.origin.y) / ((3 / 2) * this.unit),
      hexX = (pixelPosition.x - this.origin.x) / this.height() - hexZ / 2,
      hexY = -hexX - hexZ;
    //对计算的坐标四舍五入
    let hexXR = Math.round(hexX),
      hexZR = Math.round(hexZ),
      hexYR = Math.round(hexY);
    //计算四舍五入后与之前的结果偏差
    let disX = Math.abs(hexX - hexXR),
      disY = Math.abs(hexY - hexYR),
      disZ = Math.abs(hexZ - hexZR);
    //偏差最大的说明是错误的,而另外两个则是正确的,根据x+y+z=0对错误的值用另外两个表示
    if (disX > disY && disX > disZ) {
      hexXR = -hexYR - hexZR;
    } else if (disY > disZ) {
      hexYR = -hexXR - hexZR;
    } else {
      hexZR = -hexXR - hexYR;
    }
    //最后返回x,z
    return _pointCoord(hexXR, hexZR);
  },
  //矢量转栅格 返回连线坐标点集合
  //@param [point] 起始坐标点
  //@param [point] 结束坐标点
  //@return [Array]
  getRasterLine: function(pointFrom, pointTo) {
    let pointCoordFrom = pointFrom.pointCoord,
      pointCoordTo = pointTo.pointCoord,
      pointPixelFrom = pointFrom.pointPixelOrg,
      pointPixelTo = pointTo.pointPixelOrg;

    let coordArray = [];
    let num = this.getDistance(pointCoordFrom, pointCoordTo);
    let coordPixelFrom = this.getCenterPixel(pointCoordFrom),
      coordPixelTo = this.getCenterPixel(pointCoordTo);
    let disX = (coordPixelFrom.x - coordPixelTo.x) / num,
      disY = (coordPixelFrom.y - coordPixelTo.y) / num,
      disXX = (pointPixelFrom.x - pointPixelTo.x) / num,
      disYY = (pointPixelFrom.y - pointPixelTo.y) / num;
    for (let i = 0; i < num + 1; i++) {
      let pointOnCoord = _pointPixel(
          coordPixelFrom.x - disX * i,
          coordPixelFrom.y - disY * i
        ),
        pointOnPixel = _pointPixel(
          pointPixelFrom.x - disXX * i,
          pointPixelFrom.y - disYY * i
        );
      let offset = this.getVectorDistance(pointOnCoord, pointOnPixel);
      let adjustedX =
          (pointOnPixel.x - pointOnCoord.x) *
            Math.min(1e-4, this.unit / (4 * offset)) +
          pointOnCoord.x,
        adjustedY =
          (pointOnPixel.y - pointOnCoord.y) *
            Math.min(1e-4, this.unit / (4 * offset)) +
          pointOnCoord.y;
      let pointCoordNew = this.getHotCoord(_pointPixel(adjustedX, adjustedY));
      let rel = {
        coord: pointCoordNew,
        pixelOrg: _pointPixel(adjustedX, adjustedY),
        pixel: this.getCenterPixel(pointCoordNew)
      };
      coordArray.push(rel);
    }
    return coordArray;
  },
  //获取两个坐标点之间的矢量距离
  //@param [pixelFrom] 起始坐标点
  //@param [pixelTo] 结束坐标点
  //@param [float]
  getVectorDistance: function(pixelFrom, pixelTo) {
    return Math.sqrt(
      (pixelFrom.x - pixelTo.x) * (pixelFrom.x - pixelTo.x) +
        (pixelFrom.y - pixelTo.y) * (pixelFrom.y - pixelTo.y)
    );
  },
  //获取两个坐标之间的距离
  //@param [pointCoord] 起始坐标点
  //@param [pointCoord] 结束坐标点
  //@return [number]
  getDistance: function(pointCoordFrom, pointCoordTo) {
    let num = Math.max(
      Math.abs(pointCoordFrom.x - pointCoordTo.x),
      Math.abs(pointCoordFrom.z - pointCoordTo.z)
    );
    num = Math.max(
      num,
      Math.abs(
        pointCoordFrom.x - pointCoordTo.x + pointCoordFrom.z - pointCoordTo.z
      )
    );
    return num;
  },
  //获取两个坐标之间的距离
  //@param [pointCoord] 起始坐标点
  //@param [pointCoord] 结束坐标点
  //@return [number]
  getManhattanDistance: function(pointCoordFrom, pointCoordTo) {
    let num = Math.max(
      Math.abs(pointCoordFrom.x - pointCoordTo.x),
      Math.abs(pointCoordFrom.z - pointCoordTo.z)
    );
    num += Math.abs(
      pointCoordFrom.x - pointCoordTo.x + pointCoordFrom.z - pointCoordTo.z
    );
    return num;
  },
  //获取两个坐标之间的欧式距离
  //@param [pointCoord] 起始坐标点
  //@param [pointCoord] 结束坐标点
  //@return [number]
  getEuDistance: function(pointFrom, pointTo, isOrign) {
    let disX = pointFrom.pointPixel.x - pointTo.pointPixel.x,
      disY = pointFrom.pointPixel.y - pointTo.pointPixel.y,
      disX1 = pointFrom.pointPixelOrg.x - pointTo.pointPixelOrg.x,
      disY1 = pointFrom.pointPixelOrg.y - pointTo.pointPixelOrg.y,
      disX2 = pointFrom.pointPixel.x - pointFrom.pointPixelOrg.x,
      disY2 = pointFrom.pointPixel.y - pointFrom.pointPixelOrg.y,
      disX3 = pointTo.pointPixel.x - pointTo.pointPixelOrg.x,
      disY3 = pointTo.pointPixel.y - pointTo.pointPixelOrg.y;

    let k = disY / disX,
      kOrg = disY1 / disX1;

    return {
      //中心点连线距离
      dis: Math.sqrt(disX * disX + disY * disY),
      //原始点连线距离
      disOrg: Math.sqrt(disX1 * disX1 + disY1 * disY1),
      //原始点与中心点距离 from
      disFrom: Math.sqrt(disX2 * disX2 + disY2 * disY2),
      //原始点与中心点距离 from
      disTo: Math.sqrt(disX3 * disX3 + disY3 * disY3),
      k: k,
      kOrg: kOrg,
      alpha: Math.atan(k),
      alphaOrg: Math.atan(kOrg)
    };
  },
  //获取某一点的第level层六边形坐标环
  //@param [pointCoord] 中心点坐标
  //@param [number] 指示第几层
  //@return [pointCoord Array]
  getBoundryCoords: function(centerCoord, level) {
    let ary_boundry = [];
    level += 1;
    for (let i = -level + 1; i < level; i++) {
      for (let j = -level + 1; j < level; j++) {
        if (
          Math.abs(i + j) == level - 1 ||
          (Math.abs(i + j) < level - 1 &&
            (Math.abs(i) == level - 1 || Math.abs(j) == level - 1))
        ) {
          ary_boundry.push(_pointCoord(i + centerCoord.x, j + centerCoord.z));
        }
      }
    }
    return ary_boundry;
  },
  //以某一格网为中心 探测周边层数为level以内的坐标的可视性
  //@param [pointCoord] 中心点坐标
  //@param [number] 指示第几层
  //@param [Map] 存储通行格网点的字典
  //@param [Map] 存储障碍物格网点的字典
  //@return [pointCoord Map]
  getViewCoordsMap: function(
    centerCoord,
    level,
    pasableCoordsMap,
    obstacleCoordsMap
  ) {
    var self = this;
    let viewCoordsMap = new Map();
    for (var l = 1; l < level + 1; l++) {
      viewCoordsMap.set(l, new Map());
    }
    let ary_boundry = self.getBoundryCoords(centerCoord, level);
    let canSee = true;
    ary_boundry.forEach(function(coord) {
      let pt_from = centerCoord,
        pt_to = coord;
      let num = self.getDistance(pt_from, pt_to);
      (pt_from = self.getCenterPixel(pt_from)),
        (pt_to = self.getCenterPixel(pt_to));
      let dis_x = (pt_from.x - pt_to.x) / num,
        dis_y = (pt_from.y - pt_to.y) / num;

      canSee = true;
      for (let i = num - 1; i >= 0; i--) {
        let pt_new = { x: pt_to.x + dis_x * i, y: pt_to.y + dis_y * i };
        let hex_new_pos = self.getHotCoord(pt_new, true);
        let key = hex_new_pos.toString();
        if (
          canSee &&
          ((obstacleCoordsMap && obstacleCoordsMap.has(key)) ||
            !pasableCoordsMap.has(key))
        ) {
          canSee = false;
          continue;
        }
        if (!viewCoordsMap.has(num - i)) {
          viewCoordsMap.set(num - i, new Map());
        }
        if (canSee) {
          //ary_hex[hex_new_pos.x + '_' + hex_new_pos.z].canSee = true;
          if (!viewCoordsMap.get(num - i).has(key) && pasableCoordsMap.has(key))
            viewCoordsMap.get(num - i).set(key, hex_new_pos);
        }
      }
    });
    return viewCoordsMap;
  },
  //以某一格网为中心 探测周边层数为level以内的坐标的可视性
  //@param [pointCoord] 中心点坐标
  //@param [Map] 存储可通行格网点的字典
  //@param [number] 指示最大检索至第几层格网
  //@return [pointCoord Map]
  getVoronoiCoordsMap: function(centerCoordsMap, coordsMap, maxLevel) {
    var self = this;
    maxLevel = maxLevel || 25;
    centerCoordsMap.forEach(centerCoord => {
      let voronoiCoordsMap = new Map();
      var level = 1,
        end = false;
      while (level <= maxLevel && !end) {
        var itemNum = 0;
        var boundCoords = self.getBoundryCoords(centerCoord, level);

        boundCoords.forEach(coord => {
          if (self.isInView(centerCoord, coord, coordsMap)) {
            var key = coord.toString();
            if (coordsMap.has(key)) {
              var geoPt = coordsMap.get(key);
              //不存才归属关系 建立
              //存在归属关系 判断hostLevel>level?删除原有关系重建新关系:什么也不做

              if (
                !geoPt.hostLevel ||
                (geoPt.hostLevel && geoPt.hostLevel >= level)
              ) {
                //解除先前归属关系
                if (geoPt.host) {
                  geoPt.host.voronoiCoordsMap.get(geoPt.hostLevel).delete(key);
                }

                //建立新的归属关系
                geoPt.hostLevel = level;
                geoPt.host = centerCoord;

                if (!voronoiCoordsMap.has(level))
                  voronoiCoordsMap.set(level, new Map());
                voronoiCoordsMap.get(level).set(key, coord);
                itemNum++;
              }
            }
          }
        });
        if (itemNum == 0) end = true;
        level++;
      }
      centerCoord.voronoiCoordsMap = voronoiCoordsMap;
    });
  },
  //判断两个格网 是否通视
  isInView: function(fromCoord, toCoord, coordsMap) {
    let pt_from = fromCoord,
      pt_to = toCoord;
    let num = Math.max(
      Math.abs(pt_from.x - pt_to.x),
      Math.abs(pt_from.z - pt_to.z)
    );
    num = Math.max(num, Math.abs(pt_from.x - pt_to.x + pt_from.z - pt_to.z));
    (pt_from = this.getCenterPixel(pt_from)),
      (pt_to = this.getCenterPixel(pt_to));
    let dis_x = (pt_from.x - pt_to.x) / num,
      dis_y = (pt_from.y - pt_to.y) / num;

    var canSee = true;
    for (let i = num - 1; i >= 0; i--) {
      let pt_new = { x: pt_to.x + dis_x * i, y: pt_to.y + dis_y * i };
      let hex_new_pos = this.getHotCoord(pt_new, true);
      let key = hex_new_pos.toString();
      if (canSee && !coordsMap.has(key)) {
        canSee = false;
        break;
      }
    }
    return canSee;
  },
  //获取邻居索引坐标
  //@param [pointCoord] 坐标点
  //@return [Array]
  getNeiborCoordsWithOrder: function(pointCoord) {
    let x = pointCoord.x,
      z = pointCoord.z;

    let result = new Map();

    var neibors = [
      _pointCoord(x + 1, z - 1),
      _pointCoord(x + 1, z),
      _pointCoord(x, z + 1),
      _pointCoord(x - 1, z + 1),
      _pointCoord(x - 1, z),
      _pointCoord(x, z - 1)
    ];
    for (var i = 0; i < neibors.length; i++) {
      result.set(i + 1, neibors[i]);
    }
    return result;
  },
  //获取邻居索引坐标
  //@param [pointCoord] 坐标点
  //@return [Array]
  getNeiborCoords: function(pointCoord) {
    let x = pointCoord.x,
      z = pointCoord.z;
    return [
      _pointCoord(x + 1, z),
      _pointCoord(x + 1, z - 1),
      _pointCoord(x, z - 1),
      _pointCoord(x - 1, z),
      _pointCoord(x - 1, z + 1),
      _pointCoord(x, z + 1)
    ];
  },
  //创建缓冲区
  //@param [Array] 坐标点(pointCoord)集合
  //@param [number] 缓冲区距离
  //@return [Array]
  createBuffer: function(baseAry, bufferDistance) {
    let dic = {},
      ary = [];
    bufferDistance += 1;

    baseAry.forEach(function(pt) {
      var coord = pt;
      if (pt instanceof _geoPoint) {
        coord = pt.pointCoord;
      }

      let x = coord.x,
        z = coord.z;
      //x+1 z | x+1 z-1 | x z-1 | x-1 z | x-1 z+1 | x z+1
      for (let i = -bufferDistance + 1; i < bufferDistance; i++) {
        for (let j = -bufferDistance + 1; j < bufferDistance; j++) {
          if (Math.abs(i + j) < bufferDistance) {
            //&& Math.abs(x + i) < level && Math.abs(z + j) < level && Math.abs(x + i + z + j) < level)
            coord = _pointCoord(x + i, z + j); //{ x: x + i, z: z + j };
            if (!dic[coord.x + "_" + coord.z])
              dic[coord.x + "_" + coord.z] = coord;
          }
        }
      }
    });
    baseAry.forEach(function(hotHex) {
      if (dic[hotHex.x + "_" + hotHex.z]) delete dic[hotHex.x + "_" + hotHex.z];
    });
    for (let name in dic) {
      ary.push(dic[name]);
    }

    return ary;
  },
  //创建外部缓冲区
  //@param [Array] 坐标点(pointCoord)集合
  //@param [number] 缓冲区距离
  //@return [Array]
  createBufferOuter: function(coordArray, bufferDistance) {
    let self = this;
    let ary = this.createBuffer(coordArray, bufferDistance),
      dic = {};
    ary.forEach(function(coord) {
      dic[coord.x + "_" + coord.z] = coord;
    });
    let aryBuffers = [],
      aryBuffersCopy = [];
    let index = 0;
    let finded = false;
    ary.forEach(function(coord) {
      if (aryBuffersCopy.indexOf(coord) < 0) {
        next(coord);
      }
    });
    //提取缓冲区内外环
    function next(preCoord) {
      if (!aryBuffers[index]) aryBuffers[index] = [];
      aryBuffers[index].push(preCoord);
      aryBuffersCopy.push(preCoord);
      let aryNextCoord = [],
        nextCoord,
        aryNeibors = self.getNeiborCoords(preCoord);
      for (let i = 0; i < aryNeibors.length; i++) {
        let coord = aryNeibors[i];
        if (coord.x == -5 && coord.z == 4) coord = { x: -5, z: 4 };
        if (dic[coord.x + "_" + coord.z]) {
          if (aryBuffersCopy.indexOf(dic[coord.x + "_" + coord.z]) >= 0)
            continue;
          nextCoord = dic[coord.x + "_" + coord.z];
          aryNextCoord.push(nextCoord);
          continue;
        }
      }
      aryNextCoord.forEach(function(nextCoord) {
        if (aryBuffersCopy.indexOf(nextCoord) < 0) {
          finded = true;
          next(nextCoord);
        } else {
          finded = false;
        }
      });
      if (!finded) index++;
    }
    aryBuffers.sort(function(ary1, ary2) {
      return ary2.length - ary1.length;
    });
    if (aryBuffers.length <= 2) {
      return aryBuffers[0];
    } else if (aryBuffers.length > 2) {
      let result = [];
      aryBuffers.forEach(function(buffers) {
        if (!self.checkInner(coordArray, buffers[0])) {
          result = result.concat(buffers);
        }
      });
      return result;
    }
  },
  //创建内部缓冲区
  //@param [Array] 坐标点(pointCoord)集合
  //@param [number] 缓冲区距离
  //@return [Array]
  createBufferInner: function(coordArray, bufferDistance) {
    let self = this;
    let ary = this.createBuffer(coordArray, bufferDistance),
      dic = {};
    ary.forEach(function(coord) {
      dic[coord.x + "_" + coord.z] = coord;
    });
    let aryBuffers = [],
      aryBuffersCopy = [];
    let index = 0;
    let finded = false;
    ary.forEach(function(coord) {
      if (aryBuffersCopy.indexOf(coord) < 0) {
        next(coord);
      }
    });
    //提取缓冲区内外环
    function next(preCoord) {
      if (!aryBuffers[index]) aryBuffers[index] = [];
      aryBuffers[index].push(preCoord);
      aryBuffersCopy.push(preCoord);
      let aryNextCoord = [],
        nextCoord,
        aryNeibors = self.getNeiborCoords(preCoord);
      for (let i = 0; i < aryNeibors.length; i++) {
        let coord = aryNeibors[i];
        if (coord.x == -5 && coord.z == 4) coord = { x: -5, z: 4 };
        if (dic[coord.x + "_" + coord.z]) {
          if (aryBuffersCopy.indexOf(dic[coord.x + "_" + coord.z]) >= 0)
            continue;
          nextCoord = dic[coord.x + "_" + coord.z];
          aryNextCoord.push(nextCoord);
          continue;
        }
      }
      aryNextCoord.forEach(function(nextCoord) {
        if (aryBuffersCopy.indexOf(nextCoord) < 0) {
          finded = true;
          next(nextCoord);
        } else {
          finded = false;
        }
      });
      if (!finded) index++;
    }
    aryBuffers.sort(function(ary1, ary2) {
      return ary2.length - ary1.length;
    });
    if (aryBuffers.length == 2) {
      return aryBuffers[1];
    } else if (aryBuffers.length > 2) {
      let result = [];
      aryBuffers.forEach(function(buffers) {
        if (self.checkInner(coordArray, buffers[0])) {
          result = result.concat(buffers);
        }
        //buffers.forEach(function (coord) {
        //    if (self.checkInner(coordArray, coord)) {
        //        result.push(coord);
        //    }
        //    //else {
        //    //    result.push(coord);
        //    //}
        //});
      });
      return result;
    } else new Error("传入数据不是不存在内部缓冲");
  },
  checkInner: function(coordArray, coord) {
    let self = this,
      oddNodes = false,
      vertexAry = self.getVertexArray(coordArray, true),
      target = self.getCenterPixel(coord);

    let start = 0,
      index = vertexAry.length - 1;
    for (let i = start; i < vertexAry.length; i++) {
      if (
        (vertexAry[i].y < target.y && vertexAry[index].y >= target.y) ||
        (vertexAry[index].y < target.y && vertexAry[i].y >= target.y)
      ) {
        if (
          vertexAry[i].x +
            ((target.y - vertexAry[i].y) /
              (vertexAry[index].y - vertexAry[i].y)) *
              (vertexAry[index].x - vertexAry[i].x) <
          target.x
        ) {
          oddNodes = !oddNodes;
        }
      }
      index = i;
    }
    return oddNodes;
  },
  //提取特征点
  getVertexArray: function(coordArray, convert2Pixel) {
    let self = this;
    let preCoord = coordArray[coordArray.length - 1],
      vertexAry = [];

    for (let i = 0; i < coordArray.length; i++) {
      let cd = coordArray[i];
      if (
        preCoord &&
        (cd.x == preCoord.x || cd.y == preCoord.y || cd.z == preCoord.z)
      ) {
      } else {
        if (preCoord) {
          if (convert2Pixel) {
            vertexAry.push(self.getCenterPixel(preCoord));
            if (i > 0) vertexAry.push(self.getCenterPixel(coordArray[i - 1]));
          } else {
            vertexAry.push(preCoord);
            if (i > 0) vertexAry.push(coordArray[i - 1]);
          }
        }
        preCoord = cd;
      }
    }
    return vertexAry;
  }
};

//------------------------------ 2.1 六边形 ------------------------------

//六边形
//@param [pointPixel] 六边形中心的画布像素坐标
//@param [number] 六边形边长,应和coordSystem坐标系unit相等
let _hexagon = function(positionPixel, sideLength) {
  //六边形 画布像素坐标
  this.position = positionPixel;
  //六边形 边长
  this.sideLength = sideLength;
  let angle = Math.PI / 6,
    hexHeight = Math.sin(angle) * this.sideLength,
    hexRadius = Math.cos(angle) * this.sideLength,
    x = this.position.x,
    y = this.position.y;

  let pointPixel1 = _pointPixel(x, y - this.sideLength),
    pointPixel2 = _pointPixel(x + hexRadius, y - hexHeight),
    pointPixel3 = _pointPixel(x + hexRadius, y + hexHeight),
    pointPixel4 = _pointPixel(x, y + this.sideLength),
    pointPixel5 = _pointPixel(x - hexRadius, y + hexHeight),
    pointPixel6 = _pointPixel(x - hexRadius, y - hexHeight);
  //六边形点集合
  this.pointArray = [
    pointPixel1,
    pointPixel2,
    pointPixel3,
    pointPixel4,
    pointPixel5,
    pointPixel6
  ];

  let linePixel1 = _linePixel(pointPixel1, pointPixel2),
    linePixel2 = _linePixel(pointPixel2, pointPixel3),
    linePixel3 = _linePixel(pointPixel3, pointPixel4),
    linePixel4 = _linePixel(pointPixel4, pointPixel5),
    linePixel5 = _linePixel(pointPixel5, pointPixel6),
    linePixel6 = _linePixel(pointPixel6, pointPixel1);
  //六边形线集合
  this.lineArray = [
    linePixel1,
    linePixel2,
    linePixel3,
    linePixel4,
    linePixel5,
    linePixel6
  ];
};
_hexagon.prototype = {
  //获取多个六边形组成的多变形的外边框
  //@param [Array] 六边形集合
  //@return [Array] linePixel集合
  getBoundryLines: function(hexAry) {
    let boundry = new Array(),
      boundryCopy = new Array();
    hexAry.forEach(function(hex) {
      hex.lineArray.forEach(function(line) {
        let ary = boundry.filter(function(d) {
          return getDistance(line.center, d.center) < 2;
        });
        if (ary.length == 0) {
          boundry.push(line);
        } else {
          let index = boundry.indexOf(ary[0]);
          if (index > -1) {
            boundry.splice(index, 1);
          }
        }
      });
    });

    let nums = 0;
    lineNums = boundry.length;
    preLine = boundry[0];
    boundryCopy.push(preLine);
    boundry.splice(0, 1);
    while (boundry.length > 0 && nums < lineNums) {
      for (let i = 0; i < boundry.length; i++) {
        let nextLine = boundry[i];
        if (getDistance(nextLine.from, preLine.to) < 2) {
          preLine = nextLine;
          boundryCopy.push(preLine);
          break;
        } else if (getDistance(nextLine.to, preLine.to) < 2) {
          preLine = nextLine;
          boundryCopy.push({
            from: nextLine.to,
            to: nextLine.from,
            center: nextLine.center
          });
          break;
        }
      }
      let index = boundry.indexOf(preLine);
      if (index > -1) {
        boundry.splice(index, 1);
      }
      nums++;
    }
    return boundryCopy;
    //获取两点的欧氏距离
    let getDistance = function(pt1, pt2) {
      return Math.sqrt(
        (pt1.x - pt2.x) * (pt1.x - pt2.x) + (pt1.y - pt2.y) * (pt1.y - pt2.y)
      );
    };
  }
};
