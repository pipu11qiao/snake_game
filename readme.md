### 项目文件 说明  用gulp 做项目管理(有待于改进)

#### 安装

```npm
    npm install
```
#### 编译生产文件

```npm
    npm run build
```

#### 目录结构

##### dist 是生产目录 编译生成的

* 编译的css文件放在css目录中 包含未压缩和压缩的版本
* 编译的js文件放在js目录中 包含压缩和未压缩的版本
* img目录放置图片
* html文件是页面入口

##### pc/develop 是开发目录 放置开发的代码
* common 目录下放置插件通用的 css 和 js 文件
* cutomView 放置本地开发的js和css代码
* src 放置img 和 字体文件夹
* plugin 放置插件
* template  放置html模版

#### dist/ 放置pc的生产文件夹

#### 开发步骤：
* 命令npm run pcPlugin 将所有的插件打包加入版本号
* 命令npm run pcDev  打开本地开发并监视customView下的所有文件有改动启动热加载
* 命令npm run pcPro  将需要的文件放置到生产文件夹，打包js和css，根据模版生成需要的html

##### tutirial 说明和教程
##### gulpfile.js gulp 配置文件
##### pacackge.json npm 配置


