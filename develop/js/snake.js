(function() {
  // requestAnimationFrame Pollyfill
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
  }
  if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function() {
      callback(currTime + timeToCall)
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
  if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) {
    clearTimeout(id)
  };
}());
;(function (window, document, $, undefine) {
  // 可以设置的部分
  // 1.画布的长宽和在长宽方向每个格子的数量     // 视图设置
  // 2.墙的位置 wall 球的位置 ball 人的位置   // 游戏设置
  // 3.是否开启动效
  // 4.是否可以后退，最大后退步数

  // modalType  BG Ball Wall Box Soldier
  var defaultOption = {
    width: 600,
    height: 600,
    numH: 20,
    numV: 20,
    level: 1,
    cellConfig: {
      bg: {
        base: 'images/bg.png'
      },
      ball: {
        base: 'images/ball_r_1.png'
      },
      // wall: {
      //   img: 'images/wall.png'
      // },
      snake: {
        'head_left': 'images/head_left.png',
        'head_right': 'images/head_right.png',
        'head_down': 'images/head_down.png',
        'head_top': 'images/head_top.png',
        'tail_left': 'images/tail_left.png',
        'tail_right': 'images/tail_right.png',
        'tail_down': 'images/tail_down.png',
        'tail_top': 'images/tail_top.png',
        'body_d_l': 'images/body_d_l.png',
        'body_d_r': 'images/body_d_r.png',
        'body_t_l': 'images/body_t_l.png',
        'body_t_r': 'images/body_t_r.png',
        'body_v': 'images/body_v.png',
        'body_h': 'images/body_h.png'
      }
    }
  };
  var levelConfig = {
    1: 30, // 多少次16毫秒移动一次
    2: 15,
    3: 6
  };

  var Game = function (options) {
    this._$el = $(options.el);
    this._canvasEl = this._$el.find('#box').get(0);
    this._ctx = this._canvasEl.getContext('2d');
    this.options = $.extend({}, defaultOption, options);
    this.snake = null;
    this.maxSteps = levelConfig[this.options.level];
    this.curStep = 0;
    this.bg = null;
    this.ball = null;
    this.snakeDirection= 'right';
    this.bg = [];
    this.init();
  };
  Game.prototype = {
    constructor: Game,
    init: function () {
      this._canvasEl.width = this.options.width;
      this._canvasEl.height = this.options.height;
      this.width = this.options.width;
      this.height = this.options.height;
      this.numH = this.options.numH;
      this.numV = this.options.numV;
      this.cellWidth = parseInt(this.width / this.numH);
      this.cellHeight = parseInt(this.height / this.numV);
      this.imgLoadObj = new ImgLoad(); // 加载图片对象
      this.animateId = null;
      this.isPause = false;
      this.isOver = false;
      this.bindLoadListen();
      this.bindControl();
      this.setImgSrcAndLoad();
    },
    updateMission: function (mission,type) {
      this.loadImg();
    },
    bindLoadListen: function () {
      var me = this;
      this.imgLoadObj.on('load.start',function () {
        // console.log('load.start');
      });
      this.imgLoadObj.on('load.progress',function (data) {
        // console.log('load.progress',data);
      });
      this.imgLoadObj.on('load.end',function () {
        me.prepare();
      });
    },
    getAbsoluteImgSrc: function (src) {
      if(!/^http[s]?|^\//.test(src)) {
        src = location.href.replace(/[^/]+$/,src);
      }
      return src;
    },
    setImgSrcAndLoad: function () {
      var cellConfig = this.options.cellConfig;
      var imgArr = [];
      for(var key in cellConfig){
        for(var subKey in cellConfig[key]){
          var imgSrc = this.getAbsoluteImgSrc(cellConfig[key][subKey]);
          cellConfig[key][subKey] = imgSrc;
          imgArr.push(imgSrc);
        }
      }
      this.imgLoadObj.loadImg(imgArr);
    },
    setBg: function () {
      this.bg = [];
      for (var r = 0; r < this.numV; r++) {
        for (var c = 0; c < this.numH; c++) {
          this.bg.push(
            createModal('bg',{
              r: r + 1,
              c: c + 1,
              img: this.imgLoadObj.getImg(this.options.cellConfig.bg.base)
            })
          );
        }
      }
    },
    setSnake: function () {
      // 把所有的图片对象集合起来
      var imgObj = {};
      var cellConfig = this.options.cellConfig;
      for(var key in cellConfig.snake){
        imgObj[key] = this.imgLoadObj.getImg(cellConfig.snake[key]);
      }
      // 给两个位置把
      this.snake = createModal('snake',{
        imgObj: imgObj,
        cellsArr: [
          {
            r: 1,
            c: 3,
            direction: 'right'
          },
          {
            r: 1,
            c: 2,
            direction: 'right'
          },
          {
            r: 1,
            c: 1,
            direction: 'right'
          }
        ]
      });
    },
    /**
     * 获得空的位置,去掉蛇的位置和墙的位置 // todo 墙的位置
     * @return Array position 数组
     */
    getEmptyPosition: function () {
      var snakePositionObj = this.snake.getCellsPositionObj();
      var emptyPostion = [];
      for (var r = 0; r < this.numV; r++) {
        for (var c = 0; c < this.numH; c++) {
          var key = (r + 1) + '_' + (c + 1);
          if(!snakePositionObj[key]){
            emptyPostion.push(key);
          }
        }
      }
      return emptyPostion;
    },
    /**
     * @param emptyPositionArr 空的位置数组
     *  如果球对象未设置，生成一个，如果设置了，更新位置
     */
    setBall: function (emptyPositionArr) {
      var len = emptyPositionArr.length;
      var position = emptyPositionArr[Math.floor(Math.random() * len)];
      position = position.split('_');
      if(!this.ball){
        this.ball = createModal('ball',{
          r: position[0],
          c: position[1],
          img: this.imgLoadObj.getImg(this.options.cellConfig.ball.base)
        });
      }else {
        this.ball.setPos(position[0],position[1]);
      }
    },
    prepare: function () {
      var opts = this.options;
      this.setBg();
      this.setSnake();
      this.setBall(this.getEmptyPosition());
      this.paint();
    },
    getCellOfModal: function (modalType) {
      var me  = this;
      var config = this.options.cellConfig;
      this.cells[modalType] = [];
      // 位置数组
      this.mission[modalType].forEach(function (item, i) {
        var pos = item.split(',');
        me.cells[modalType].push(createModal(modalType.toUpperCase(), {
            r: pos[0],
            c: pos[1],
            viewObj: {
              img: me.imgLoadObj.getImg(config[modalType].img),
              offset: config[modalType].offset
            }
          })
        );
      })
    },
    start: function () {
      this.isPause = false;
      this.move();
    },
    draw: function (cell) {
      var img = cell.getImg();
      var pos = cell.getPos();
      var x = (pos.c - 1) * this.cellWidth ;
      var y = (pos.r - 1) * this.cellHeight;
      var width = this.cellWidth;
      var height = this.cellHeight;
      this._ctx.drawImage(img, x, y, width, height);
    },
    drawCells: function (cellArr) {
      for (var i = 0, len = cellArr.length; i < len; i++) {
        this.draw(cellArr[i]);
      }
    },
    paint: function () {
      // 绘制 背景
      this.drawCells(this.bg);
      // 绘制 蛇
      this.drawCells(this.snake.getCells());
      // 绘制 球
      this.draw(this.ball);
    },
    bindControl: function () {
      // 绑定控制事件
      var me = this;

      $(document).on('keydown',function (e) {
        var direction = '';
        switch (e.keyCode){
          case 37:
            direction = 'left';
            break;
          case 38:
            direction = 'top';
            break;
          case 39:
            direction = 'right';
            break;
          case 40:
            direction = 'down';
            break;
        }
        var snakeDirection = me.snake.getDirection();
        // 如果要移动的方向和蛇的移动方向都是竖直或者水平方向的不反应
        if(!me.isOver && !me.isPause &&direction && me.snake.isHorizontal(snakeDirection) !==  me.snake.isHorizontal(direction)){
          me.moveTo(direction,true);
        }
      });
      this._$el.on('click','.btn',function (e) {
        e.preventDefault();
        var $this = $(this);
        console.log($this.data('tag'));
        switch ($this.data('tag')) {
          case 'refresh':
            me.refresh();
            break;
          case 'toggle':
            if($this.html() === '开始') {
              me.start();
              $this.html('暂停')
            }else{
              me.pause();
              $this.html('开始')
            }
            break;
        }
      });
    },
    move: function () {
      var me = this;
      this.curStep ++;
      if(this.curStep >= this.maxSteps){
        this.curStep = 0;
        var direction = this.snake.getDirection();
        this.moveTo(direction);
      }
      if(!this.isOver && !this.isPause){
        this.animateId = requestAnimationFrame(function () {
          me.move();
        });
      }
    },
    // 暂停
    pause:function () {
      this.isPause = true;
    },
    refresh: function () {
      var opts = this.options;
      this.isOver = false;
      if(this._$el.find(["data-tag='toggle'"]).html() === '开始'){
        this._$el.find(["data-tag='toggle'"]).html('暂停')
      }
      this._$el.find('.veil-outer').hide();
      this.isPause = false;
      this.setBg();
      this.setSnake();
      this.setBall(this.getEmptyPosition());
      this.paint();
    },
    moveTo:function (direction,isControl) {
      // 如果是控制过来的直接移动，重新开始动画。
      // 获得下一步看看是否嗝屁了,没有是否是个ball
      // 如果失球吃，如果不是move，然后判断是否完成 over
      var nextConfig = this.snake.getNextPosition(direction);
      if(this.judgeOver(nextConfig)){
        this.isOver = true;
        this._$el.find('.veil-outer').show();
        cancelAnimationFrame(this.animateId);
        this.curStep = 0;
      }else {
        var ballPos = this.ball.getPos();
        if(nextConfig.r === ballPos.r && nextConfig.c === ballPos.c) { // 是球
          // 让蛇吃掉
          this.snake.eatBall(ballPos,direction);
          // todo 是否完成
          var emptyArr = this.getEmptyPosition();
          if(emptyArr.length === 0) {
            alert('过关');
            this.isOver = true;
            cancelAnimationFrame(this.animateId);
            this.curStep = 0;
          }else {
            this.setBall(emptyArr);
          }

        }else {
          this.snake.move(direction);
        }
        if(isControl){
          this.curStep = 0;
        }
        this.paint();
      }
    },
    judgeOver: function (nextConfig) {
      // todo 墙的判断
      var result = false;

      var snakePositionObj = this.snake.getCellsPositionObj();
      if(nextConfig.r < 1 || nextConfig.r > this.numH || nextConfig.c < 1 || nextConfig.c > this.numV) {
        // 撞墙
        result = true;
      }else if(snakePositionObj[nextConfig.r + '_' + nextConfig.c]){
        // 撞到蛇了
        result = true;
      }
      return result;
    }
  };
  window.Game = Game;
})(window, document, jQuery);

