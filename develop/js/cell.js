;(function () {
  var setPrototype = function (child, parent) {
    var Super = function () {
    };
    Super.prototype = parent.prototype;
    child.prototype = new Super();
    child.prototype.constructor = child;
  };
  // 基础类cell
  var Cell = function (r, c, img, direction) {
    this.name = 'cell';
    r = -(-r);
    c = -(-c);
    this.r = r;
    this.c = c;
    this.direction = direction;
    this.img = img; // 显示对象 图片或者canvas渲染
  };
  Cell.prototype = {
    constructor: Cell,
    getName: function () {
      return this.name;
    },
    setPos: function (r, c) {
      this.r = -(-r);
      this.c = -(-c);
    },
    setDirection: function () {
      return this.direction;
    },
    setPosAndDirection: function (r, c, direction) {
      this.setPos(r, c);
      this.direction = direction;
    },
    getPos: function () {
      return {
        r: this.r,
        c: this.c
      };
    },
    getDirection: function () {
      return this.direction;
    },
    getPosAndDirection: function () {
      return {
        r: this.r,
        c: this.c,
        direction: this.direction
      }
    },
    //  获得相应的图片
    getImg: function () {
      return this.img;
    },
    setImg: function (imgObj) {
      this.img = imgObj;
    }
  };


  /*************************  具体的类  ************************************/
    // 背景
  var BG = function (options) {
      Cell.call(this, options.r, options.c, options.img);
      this.name = 'bg';
    };
  setPrototype(BG, Cell);

  // ball
  var Ball = function (options) {
    Cell.call(this, options.r, options.c, options.img);
    this.name = 'ball';
  };
  setPrototype(Ball, Cell);

  // snake
  var SnakeCell = function (options) {
    Cell.call(this, options.r, options.c, options.img,options.direction);
    this.name = 'snakeCell';
  };
  setPrototype(SnakeCell, Cell);
  var Snake = function (options) {
    this.cells = [];
    this.imgObj = options.imgObj;
    this.init(options.cellsArr);
  };
  Snake.prototype = {
    constructor: Snake,
    init: function (cellsArr) {
      //
      for(var i = 0,len = cellsArr.length; i < len; i ++) {
        var curCell = new SnakeCell({
          r: cellsArr[i].r,
          c: cellsArr[i].c,
          direction: cellsArr[i].direction,
          img:null
        });
        this.cells.push(curCell);
      }
      this.setCellsImg();
    },
    /**
     *  给每个cell设置图片，第一个是头部，第二个是尾部，剩下的是body
     *  如果是头部或者尾部根据方向设置,是竖直还是水平方向 head_v head_h tail_v tail_h
     *  如果是body
     *      如果 前一个和后一个都是水平或者竖直，根据数值还是水平来设置 body_v,body_h
     *      如果 前一个和后一个是竖直一个是水平,根据两者的方位设置 上左/右  下左/右 -> body_t_l / body_t_r  body_d_l body_d_r
     *
     */
    setCellsImg: function () {
      var cells = this.cells;
      for(var i = 0,len = cells.length; i < len; i ++) {
        var curCell = cells[i];
        var frontCell = cells[i -1];
        var backCell = cells[i + 1];
        var img;
        if(i === 0 ){//头部
          img = this.imgObj['head_' + curCell.getDirection()];
        }else if( i === len - 1) { // 尾部 是根据前一个的方向来决定的
          img = this.imgObj['tail_' + (true ? frontCell : curCell).getDirection()];
        } else { //身体
          var bodyStr = '';
          var frontPos = frontCell.getPos();
          var backPos = backCell.getPos();
          var curPos = curCell.getPos();
          if(frontPos.r === backPos.r) {
            bodyStr = 'body_h';
          }else if(frontPos.c === backPos.c){
            bodyStr = 'body_v';
          }else{
            bodyStr = 'body_' +(
              curPos.c === frontPos.c ?
                // 当前和前一个在一列，那就是行不同
                ((frontPos.r > curPos.r ? 'd' : 't') + '_' + (backPos.c > curPos.c ? 'r' : 'l'))
                :
                // 当前和前一个在一行，那就是行不同
                ((backPos.r > curPos.r ? 'd' : 't') + '_' + (frontPos.c > curPos.c ? 'r' : 'l'))
              );
          }
          img = this.imgObj[bodyStr];

        }
        curCell.setImg(img)
      }
    },
    isHorizontal: function (direction) {
      return direction === 'left' || direction === 'right';
    },
    getCellsPositionObj: function () {
      var positionObj = {};
      var cells = this.cells;
      for(var i = 0,len = cells.length; i < len; i ++) {
        var curCell = cells[i];
        positionObj[curCell.r + '_' + curCell.c] = 1;
      }
      return positionObj
    },
    getCells: function () {
      return this.cells;
    },
    getHead: function () {
      return this.cells[0];
    },
    /**
     * @param direction
     * @return {r:'',c: '',direction} 头部取得下一个状态
     */
    getNextPosition: function (direction) {
      var headCell = this.getHead();
      direction = direction || headCell.direction;
      var config = headCell.getPosAndDirection();
      config.direction = direction;
      switch (direction) {
        case 'left':
          config.c --;
          break;
        case 'right':
          config.c ++;
          break;
        case 'top':
          config.r --;
          break;
        case 'down':
          config.r ++;
          break;
      }
      return config
    },
    /**
     * 蛇的移动，如果没有传入方向就是自己沿着方向动，如果是传入方法那就是根据方向动
     */
    setHead: function (direction) {
      var head = this.getHead();
      direction = direction || head.direction;
      var nextConfig = this.getNextPosition(direction);
      head.setPosAndDirection(nextConfig.r,nextConfig.c,nextConfig.direction);
    },
    move: function (direction) {
      var cells = this.cells;

      // 除了头部的剩下的集成前一个的位置和方向，头部根据方向更新方向和位置
      for(var i = cells.length - 1; i > 0; i --) {
        var curCell = cells[i];
        var preCellConfig = cells[i - 1].getPosAndDirection();
        curCell.setPosAndDirection(preCellConfig.r,preCellConfig.c,preCellConfig.direction)
      }
      this.setHead(direction);
      this.setCellsImg();
    },
    getDirection: function () {
      return this.getHead().direction;
    },
    eatBall: function (ballConfig,direction) {
      // 头部变成球的位置
      var head = this.getHead();
      this.cells.unshift(new SnakeCell({
        r: ballConfig.r,
        c: ballConfig.c,
        direction: direction
      }));
      this.setCellsImg();

    }
  };

  var CellModal = {
    bg: BG,
    ball: Ball,
    snake: Snake
  };
  window.createModal = function (type, options) {
    return new CellModal[type](options);
  };
})();