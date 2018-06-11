
;(function(){

  // 用jquery实现发布订阅
  var PublicObj = function (pluginName) {
    this._$el = $({
      name: pluginName
    });
    this.eventlisteners = {};
  };
  PublicObj.prototype = {
    constructor: PublicObj,
    on: function (eventName,callback) {
      // 判断该事件有没有人监听，如果没有加入，如果已经有了push
      if(!this.eventlisteners[eventName]) {
        this.eventlisteners[eventName] = [callback]
      }
      var me = this;
      this._$el.on(eventName,function (e,data) {
        $(me.eventlisteners[eventName]).each(function (i,listener) {
          listener(data);
        })
      });
    },
    off: function () {
      if(arguments.length === 0){
        this.eventlisteners = {}; // 取消所有事件
      }else{
        if(typeof arguments[0] !== 'string') {
          return;
        }
        var eventName = arguments[0];
        if(arguments[1] && typeof arguments[1] === 'function') {
          // 判断该事件有没有被注册
          if(!this.eventlisteners[eventName]){return;}
          // 找到这个方法干掉他
          var index = this.eventlisteners[eventName].indexOf(arguments[1]);
          if(index > -1){
            this.eventlisteners.splice(index,1);
          }
        }else {
          this.eventlisteners[eventName] = undefined;
          this._$el.off(eventName);
        }
      }
    }
  };

  var setPrototype = function (child, parent) {
    var Super = function () {
    };
    Super.prototype = parent.prototype;
    child.prototype = new Super();
    child.prototype.constructor = child;
  };
  var ImgLoad = function () {
    PublicObj.call(this,'imgLoad');
    this.name = 'imgLoad';
    this.loadedImg = {}
    this.imgNum = 0;
    this.loadedImgNum = 0;
  };
  setPrototype(ImgLoad,PublicObj);
  ImgLoad.prototype.loadImg = function (imgArr) {
    if(! $.isArray(imgArr)){
      return;
    }
    this._$el.trigger('load.start');
    var needLoadImgArr = this.getNeedLoadImgArr(imgArr);
    if(needLoadImgArr.length > 0) {
      this.imgNum = needLoadImgArr.length;
      this.loadedImgNum = 0;
      for(var i = 0; i < needLoadImgArr.length; i ++) {
        this.imgLoad(needLoadImgArr[i])
      }
    }else {
      this._$el.trigger('load.end');
    }
  };
  ImgLoad.prototype.getNeedLoadImgArr = function (imgArr) {
    var needLoadImgArr = [];
    var me = this;
    imgArr.forEach(function (item) {
      if(!me.loadedImg[item]) {
        needLoadImgArr.push(item);
      }
    });
    return needLoadImgArr
  };
  ImgLoad.prototype.loadOneImg = function (imgSrc,imgObj) {
    this.loadedImgNum ++;
    this.loadedImg[imgSrc] = imgObj
    this._$el.trigger('load.progress',{
      progress: parseInt(this.loadedImgNum / this.imgNum * 100)
    });
    if(this.loadedImgNum === this.imgNum) {
      this._$el.trigger('load.end');
    }
  };

  ImgLoad.prototype.imgLoad = function (src) {
    var me = this;
    var img = new Image();
    img.onload = function () {
      me.loadOneImg(this.src,this);
      this.onload = null;
    };
    img.src = src;
  };
  ImgLoad.prototype.getImg = function (src) {
    return this.loadedImg[src];
  };
  window.ImgLoad = ImgLoad;
})(jQuery,document,window);