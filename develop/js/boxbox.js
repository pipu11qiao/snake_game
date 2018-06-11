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
    width: 560,
    height: 560,
    numH: 16,
    numV: 16,
    maxBackSteps: 3,
    direction: 'right',
    cellConfig: {
      bg: {
        img:'images/block.gif',
        offset: [0,0]
      },
      ball: {
        img: 'images/ball.png',
        offset: [-2.5,-2.5]
      },
      box:{
       img: 'images/box.png',
       offset:  [0, 0]
      },
      wall: {
        img: 'images/wall.png',
        // offset: [0, 11]
        offset: [0, 0]
      },
      soldier: {
        img: {
          base: 'images/down.png',
          left: 'images/left.png',
          right: 'images/right.png',
          up: 'images/up.png',
          down: 'images/down.png'
        },
        offset: [0,0]
      }
    }
  };

  // mission只提供位置信息
  var Mission = function (curMission,missions) {
    this.name = 'missionObj';
    this.curMission = 1;
    this.missions = [];
  };
  Mission.prototype = {
    constructor: Mission,
    setCurMission: function (num) {
      this.curMission = num;
    },
    addMission: function (mission) {
      this.missions.push(mission);
    },
    getMission: function () {
      return this.missions[this.curMission -1];
      // return this.missions[2];
    },
    getMissionsCount: function () {
      return this.missions.length;
    },
    getMissionNum: function () {
      return this.curMission;
    }
  };
  var Game = function (options) {
    this._$el = $(options.el);
    this._canvasEl = this._$el.find('#box').get(0);
    this._ctx = this._canvasEl.getContext('2d');
    this.options = $.extend({}, defaultOption, options);
    this.cells = {}; // cell对象合集
    this.soldier = null;
    this.soldierDirection = 'right';
    this.bg = [];
    this.steps = 0;
    this.mission = null;
    this.mission_bak = null; //当前关的拷贝
    this.backupArr = [];
    this.missionObj = new Mission(1);
    this.missionObj.addMission({
      wall: [
        '5,7', '5,8', '5,9',
        '6,7', '6,9',
        '7,7', '7,9', '7,10', '7,11', '7,12',
        '8,5', '8,6', '8,7', '8,12',
        '9,5', '9,10', '9,11', '9,12',
        '10,5', '10,6', '10,7', '10,8', '10,10',
        '11,8', '11,10',
        '12,8', '12,9', '12,10'
      ],
      ball: [
        '6,8', '8,11', '9,6', '11,9'
      ],
      box: [
        '8,8', '8,10', '9,8', '10,9'
      ],
      soldier: '8,9'
    });
    this.missionObj.addMission({
      wall: [
        '4,5','4,6','4,7','4,8','4,9',
        '5,5', '5,9',
        '6,5', '6,9','6,11','6,12','6,13',
        '7,5', '7,9','7,11','7,13',
        '8,5', '8,6', '8,7', '8,9','8,10','8,11','8,13',
        '9,6','9,7','9,13',
        '10,6', '10,10', '10,13',
        '11,6', '11,10','11,11','11,12','11,13',
        '12,6', '12,7','12,8','12,9', '12,10'
      ],
      ball: [
        '7,12', '8,12', '9,12'
      ],
      box: [
        '6,7', '6,8', '7,7'
      ],
      soldier: '6,6'
    });
    // this.missionObj.addMission({
    //   wall: [
    //     '5,7', '5,8', '5,9',
    //     '6,7', '6,9',
    //     '7,7', '7,9', '7,10', '7,11', '7,12',
    //     '8,5', '8,6', '8,7', '8,12',
    //     '9,5', '9,10', '9,11', '9,12',
    //     '10,5', '10,6', '10,7', '10,8', '10,10',
    //     '11,8', '11,10',
    //     '12,8', '12,9', '12,10'
    //   ],
    //   ball: [],
    //   box: [],
    //   soldier: '8,9'
    // });
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
      this.imgLoad = new ImgLoad(); // 加载图片对象
      this.bindLoadListen();
      this.bindControl();
      this.updateMission(this.missionObj.getMission());
    },
    updateMission: function (mission,type) {
      this.mission = mission;
      this.mission_bak = $.extend(true,{},mission);
      if(type !== 'backup'){
        this.backupArr = [];
        this.steps = 0;
        this.soldierDirection = this.options.direction;
      }else {
        // 如果是后退 backupArr 和 step 不清零
        this.soldierDirection = mission.direction;
      }
      this.setMissionBg();
      this.loadImg();
      this.renderMissionInfo();
      this.renderStepInfo();
      this.renderBackupBtn();
    },
    bindLoadListen: function () {
      var me = this;
      this.imgLoad.on('load.start',function () {
        // console.log('load.start');
      });
      this.imgLoad.on('load.progress',function (data) {
        // console.log('load.progress',data);
      });
      this.imgLoad.on('load.end',function () {
        me.startGame();
      });
    },
    getAbsoluteImgSrc: function (src) {
      if(!/^http[s]?|^\//.test(src)) {
        src = location.href.replace(/[^/]+$/,src);
      }
      return src;
    },
    setCellImg: function () {
      var config = this.options.cellConfig;
      config.bg.img = this.getAbsoluteImgSrc(config.bg.img);
      config.ball.img = this.getAbsoluteImgSrc(config.ball.img);
      config.wall.img = this.getAbsoluteImgSrc(config.wall.img);
      config.box.img = this.getAbsoluteImgSrc(config.box.img);
      config.soldier.img.left = this.getAbsoluteImgSrc(config.soldier.img.left);
      config.soldier.img.right = this.getAbsoluteImgSrc(config.soldier.img.right);
      config.soldier.img.up = this.getAbsoluteImgSrc(config.soldier.img.up);
      config.soldier.img.down = this.getAbsoluteImgSrc(config.soldier.img.down);
    },
    loadImg: function () {
      var config = this.options.cellConfig;
      this.setCellImg();
      var imgArr = [config.bg.img, config.ball.img,config.wall.img, config.box.img, config.soldier.img.left, config.soldier.img.right, config.soldier.img.up, config.soldier.img.down];
      this.imgLoad.loadImg(imgArr);
    },
    setMissionBg: function () {
      this.mission.bg = [];
      for (var r = 0; r < this.numV; r++) {
        for (var c = 0; c < this.numH; c++) {
          this.mission.bg.push((r + 1) + ',' + (c + 1));
        }
      }
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
              img: me.imgLoad.getImg(config[modalType].img),
              offset: config[modalType].offset
            }
          })
        );
      })
    },
    getCells: function () {
      // 背景 球 墙 箱子
      this.getCellOfModal('bg');
      this.getCellOfModal('ball');
      this.getCellOfModal('wall');
      this.getCellOfModal('box');
      var soliderPos = this.mission.soldier.split(',');
      var soliderConfig = this.options.cellConfig.soldier;

      this.cells.soldier = createModal('SOLDIER',{
        r: soliderPos[0],
        c: soliderPos[1],
        direction: this.soldierDirection,
        viewObj: {
          'left': {
            img: this.imgLoad.getImg(soliderConfig.img.left),
            offset: soliderConfig.offset
          },
          'right': {
            img: this.imgLoad.getImg(soliderConfig.img.right),
            offset: soliderConfig.offset
          },
          'up': {
            img: this.imgLoad.getImg(soliderConfig.img.up),
            offset: soliderConfig.offset
          },
          'down': {
            img: this.imgLoad.getImg(soliderConfig.img.down),
            offset: soliderConfig.offset
          }
        }
      });
      console.log(this.cells);
    },
    startGame: function () {
      // 开始游戏 获取所有的cell 绘制
      this.getCells();
      this.paint();
    },
    getResultCell: function (allCell) {

      var baseCell = [];
      var coverCell = [];
      // 对当前位置商的cell进行分类处理
      allCell.forEach(function (item) {
        if(item.getCover() === ''){
          baseCell.push(item);
        }else{
          coverCell.push(item);
        }
      });
      coverCell.sort(function (item1,item2) {
        return item1.getCover()  - item2.getCover();
      });
      if(coverCell.length > 0) {
        return baseCell.concat(coverCell[coverCell.length -1]);
      }else {
        return baseCell;
      }
    },
    draw: function (cell) {
      var viewObj = cell.getViewObj();
      var pos = cell.getPaintPos();
      // 如果在移动就会出现被后来的覆盖的情况
      if(cell.move){
        // debugger;
        // debugger;
      }
      var offsetX = viewObj.offset[0];
      var offsetY = viewObj.offset[1];
      var x = (pos.c - 1) * this.cellWidth - offsetX ;
      var y = (pos.r - 1) * this.cellHeight - offsetY;

      var width = this.cellWidth + offsetX;
      var height = this.cellHeight + offsetY;

      this._ctx.drawImage(viewObj.img, x, y, width, height);
    },

    drawCells: function (cellArr) {
      for (var i = 0, len = cellArr.length; i < len; i++) {
        this.draw(cellArr[i]);
      }
    },
    paint: function () {
      // 绘制
      // 先对所有的cell进行hash
      // 绘制北京
      this.drawCells(this.cells.bg);
      this.drawCells(this.cells.ball);
      this.drawCells(this.cells.wall);
      this.drawCells(this.cells.box);
      this.draw(this.cells.soldier);
      this.hashCells = {};
      var hashCells = this.hashCells;
      for(var key in this.cells) {
        if(key === 'soldier') {
          continue;
        }
        hashCells[key] = {};
        this.cells[key].forEach(function (item) {
          var posObj = item.getPos();
          hashCells[key]['r' + posObj.r + 'c' + posObj.c] = item;
        });
      }
      // solider
      var soliderCell = this.cells.soldier;
      hashCells.soldier = {};
      hashCells.soldier['r' + soliderCell.r + 'c' + soliderCell.c] = soliderCell;

      // 判断当前所有的cell中
      var needMove = false;
      needMove = this.cells.box.some(function (item) {
        return item.move
      });
      if(!needMove){
        needMove = this.cells.soldier.move;
      }
      var me = this;

      if(needMove) {
        this.animateId = requestAnimationFrame(function (number) {
          me.paint();
        });
      }else {
        cancelAnimationFrame(this.animateId);
        this.animateId = null;
      }
    },
    bindControl: function () {
     // 绑定控制事件
      var me = this;
      $(document).on('keydown',function (e) {
        var direction = '';
        var directionKey = '';
        var directionNum = 0;
        switch (e.keyCode){
          case 37:
            direction = 'left';
            directionKey = 'c';
            directionNum = -1;
            break;
          case 38:
            direction = 'up';
            directionKey = 'r';
            directionNum = -1;
            break;
          case 39:
            direction = 'right';
            directionKey = 'c';
            directionNum = 1;
            break;
          case 40:
            direction = 'down';
            directionKey = 'r';
            directionNum = 1;
            break;
        }
        if(direction){
          me.moveTo(direction,directionKey,directionNum);
        }
      });
      this._$el.on('click','.btn',function (e) {
        e.preventDefault();
        var $this = $(this);
        console.log($this.data('tag'));
        if($this.hasClass('disable')) {
          return;
        }
        switch ($this.data('tag')) {
          case 'refresh':
            if(me.steps > 0){
              me.updateMission(me.mission_bak);
            }
            break;
          case 'backup':
            me.updateMission(me.backupArr.pop(),'backup');
            break;
          case 'next':
            me.missionObj.setCurMission(me.missionObj.getMissionNum() + 1);
            me.updateMission(me.missionObj.getMission());
            me._$el.find('.veil-outer').hide();
            break;
        }
      });
    },
    moveTo:function (direction,directionKey,directionNum) {
      // 判断是否能够移动
      var canMove = false;
      var soldier = this.cells.soldier;
      var soldierPos = soldier.getPos();
      var nextPos = {
        r: directionKey === 'r' ? soldierPos.r + directionNum : soldierPos.r,
        c:directionKey === 'c' ? soldierPos.c + directionNum : soldierPos.c
      };
      var nextNextPos;
      var nextIsBox =false;
      var nextKey = 'r' + nextPos.r + 'c' + nextPos.c;
      var nextNextKey;
      // 下一步是否是箱子
      if(this.hashCells.box[nextKey]) {
        //是箱子
        nextIsBox = true;
        nextNextPos = {
          r: directionKey === 'r' ? soldierPos.r + (2 * directionNum): soldierPos.r ,
          c: directionKey === 'c' ? soldierPos.c + (2 * directionNum) : soldierPos.c
        };
        nextNextKey = 'r' + nextNextPos.r + 'c' + nextNextPos.c;
        if(nextNextPos.c > 0 && nextNextPos.c <= this.numV && nextNextPos.r > 0 && nextNextPos.r < this.numH + 1
          && !this.hashCells.wall[nextNextKey]
          && !this.hashCells.box[nextNextKey]
        ) {
          canMove = true;
        }
      }else {
        // 不是箱子 能不能走
        // 没有出界 并且不是墙
        if(nextPos.c > 0 && nextPos.c <= this.numV && nextPos.r > 0 && nextPos.r < this.numH + 1 && !this.hashCells.wall[nextKey]) {
          canMove = true;
        }
      }

      if(canMove){

        soldier.setPos(nextPos.r,nextPos.c);
        if(nextIsBox){
          var box = this.hashCells.box[nextKey];
          box.setPos(nextNextPos.r,nextNextPos.c);
        }
        this.steps ++;
        this.renderStepInfo();
        this.updateBackup();
      }

      soldier.setDirection(direction);
      this.paint();

      if(canMove && nextIsBox) {
        this.judgeFinish();
      }
    },
    judgeFinish: function (direction,directionKey,directionNum) {
      //查看是否完成
      var hasFinish = true;
      for(var key in this.hashCells.ball){
        if(!this.hashCells.box[key]) {
          hasFinish =false;
          break
        }
      }
      if(hasFinish){
        this._$el.find('.veil-outer').show();
      }
    },
    updateBackup:function () {
      // 记录当前的移动情况
      var mission_copy = {};
      var key,subKey;
      for(key in this.hashCells){
        if(key === 'soldier') {
          for (subKey in this.hashCells[key]) {
            mission_copy.soldier = subKey.replace(/r(\d+)c(\d+)/, '$1,$2');
          }
        }else{
          mission_copy[key] = [];
          for(subKey in this.hashCells[key]){
            mission_copy[key].push(subKey.replace(/r(\d+)c(\d+)/,'$1,$2'));
          }
        }
      }
      mission_copy.direction = this.cells.soldier.getDirection();

      if(this.backupArr.length >= this.options.maxBackSteps) {
        this.backupArr.shift();
      }
      this.backupArr.push(mission_copy);
      this.renderBackupBtn();
    },
    renderMissionInfo: function () {
      this._$el.find('.mission-info').html(this.missionObj.getMissionNum() + '/' + this.missionObj.getMissionsCount());
    },
    renderStepInfo: function () {
      this._$el.find('.step-info').html(this.steps);
    },
    renderBackupBtn: function () {
      this._$el.find('[data-tag="backup"]')[this.backupArr.length === 0 ? 'addClass' : 'removeClass']('disable');
    }
  };
  window.Game = Game;
})(window, document, jQuery);
