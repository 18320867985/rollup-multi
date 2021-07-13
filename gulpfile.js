/*
安装：npm install -g cnpm --registry=https://registry.npm.taobao.org  安装淘宝镜像）用淘宝镜像快！
修改：npm config set registry http://registry.npm.taobao.org
*/

var gulp = require('gulp');
var watch = require("gulp-watch");
var del = require("del");
var minCss = require('gulp-clean-css'); //gulp-minify-css:压缩css文件 npm install gulp-clean-css
var connect = require('gulp-connect'); //gulp-connect 创建服务器  npm install --save-dev gulp-connect
var minJs = require('gulp-uglify'); //压缩javascript文件  npm install gulp-uglify
var img = require('gulp-imagemin'); //gulp-imagemin:压缩png、jpj、git、svg格式图片 npm install --save-dev gulp-imagemin
var rename = require("gulp-rename"); // npm install gulp-rename --save-dev  重命名文件，把一个文件储存不同版本时使用
var concat = require('gulp-concat'); //npm install gulp-concat --save-dev  整合文件
var gulpbabel = require("gulp-babel");
var minHtml = require('gulp-htmlmin'); //npm install gulp-htmlmin --save-dev 压缩html，可以压缩页面javascript、css，去除页面空格、注释，删除多余属性等操作
var vue = require('rollup-plugin-vue');
var vembedCss = require('rollup-plugin-embed-css');
var replace = require('rollup-plugin-replace');
var rollup = require('rollup');
var babel = require('rollup-plugin-babel');
var uglify = require('rollup-plugin-uglify');
var resolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require("rollup-plugin-json");
var postcss = require("gulp-postcss"); // 手机端自动补全css3前缀  cnpm install --save-dev gulp-postcss
var autoprefixer = require('autoprefixer'); // npm install --save-dev autoprefixer
var sass = require('gulp-sass');

/***  打包修改的配置 ***/
var fs = require("fs");
var dirs = fs.readdirSync("./src/views");
var dirNames = dirs.length > 0 ? dirs : ["index"];

// js 打包入口
var appJs = {
	dir: "./src/views/",   // 默认文件父级
	watch: "index"          // 监听和打包当前的模块，all监听所有项
}; 

// scss 打包入口
var appScss = {
	dir: "./src/views/",   // 默认文件父级
	watch: "all"       // 监听和打包当前的模块，all监听所有项
}; 


appJs.list = appScss.list= dirNames;

// 文件路径 
var paths = {
    stylePath: ['./src/views/**/*.scss','./src/common/scss/**/*.scss'], 
	styleCommon:'./src/common/scss/**/*.scss',
	htmlPath: ['./src/**/*.html'],
    jspath: ['./src/views/**/*.js', './src/views/**/*.vue', './src/components/**/*.*', './src/common/libs/**/*.*'],
};


// 清空目录gulp-del
gulp.task('del', function (cd) {

	del(["./dist"], cd); //gulp-del
});

/******发布文件*******/
gulp.task('release', ["build-css", "build-js"], function () {

	gulp.src(['./src/**/*.html','!./src/gulpJsFile/**/*.html','!./src/rollupJsFile/**/*.html'])
		//.pipe(minHtml({ collapseWhitespace: true }))  // 压缩html
		.pipe(gulp.dest('./dist/')); //复制html

	gulp.src(['./src/static/css/**/*.css'])
		.pipe(minCss()).pipe(gulp.dest('./dist/static/css')); //复制css

	gulp.src(['./src/static/css/fonts/**/*.*'])
		.pipe(gulp.dest('./dist/static/css/fonts')); //复制fonts-css
		
	gulp.src(['./src/static/fonts/**/*.*'])
	.pipe(gulp.dest('./dist/static/fonts')); //复制fonts-css
		

	gulp.src('./src/static/js/**/*.*')
		.pipe(gulp.dest('./dist/static/js/')); //复制js

	gulp.src('./src/static/imgs/**/*.*')
		//.pipe(img())                     // 压缩图片
		.pipe(gulp.dest('./dist/static/imgs/')); //复制img

	gulp.src(['./src/ueditor/**/*.*']) // ueditor 富文本编辑器
		.pipe(gulp.dest('./dist/ueditor'));

	gulp.src(['./src/static/**/*.*', '!./src/static/css/**/*.*', '!./src/static/js/**/*.*',
		'!./src/static/imgs/**/*.*'
	]).pipe(gulp.dest('./dist/static'));

});

/* watch监听*/
gulp.task("watch", ['build-css', 'build-js', 'connect'], function () {

	//合拼vue组件css和js文件
	watch(paths.jspath, function () {
		gulp.start("dev-js");
	});

	//styles的scss
	watch(paths.stylePath, function () {
		gulp.start("dev-css");

	});

	//监听html
	watch(paths.htmlPath, function () {
		gulp.start("html");
	});

});

gulp.task("html", function () {
	gulp.src(paths.htmlPath).pipe(connect.reload());
});


//开启http服务器

var sev = function () {
    connect.server({
        root: 'src',
        livereload: true,
        port: 8888
    });
};

gulp.task('connect',
	function () {
		sev();
	});


// 全局的css 
gulp.task("dev-css", async function () {
	
		gulp.src(paths.styleCommon)
		.pipe(sass().on('error', sass.logError))     // sass编译
		.pipe(postcss([autoprefixer]))          // 自动添加css3缀-webkit-  适合用于手机端 
		.pipe(gulp.dest('./src/static/css/'));
		
	try {
		appScss.list.forEach(function (item) {

			if (item === appScss.watch || appScss.watch  ==="all") {
				console.log("编译:"+item+"项的css");
				gulp.src(appScss.dir + item + "/style/all.scss")
					.pipe(sass().on('error', sass.logError)) // sass编译
					.pipe(postcss([autoprefixer])) // 自动添加css3缀-webkit-  适合用于手机端 
					.pipe(rename(item + ".css")).pipe(gulp.dest('./src/static/css/')).pipe(connect.reload());
			
			}
		});

	} catch (error) {
		console.log(error);
	}
	
});

gulp.task("build-css", async function () {
	gulp.src(paths.styleCommon)
		.pipe(sass().on('error', sass.logError))     // sass编译
		.pipe(postcss([autoprefixer]))          // 自动添加css3缀-webkit-  适合用于手机端 
		.pipe(gulp.dest('./src/static/css/'));
		
	try {
		return await Promise.all(appScss.list.map(async function (item) {
			return compileCss(item, appScss.dir);
		}));

	} catch (error) {
		console.log(error);
	}
	
			
	});

function compileCss(item, dir) {

		try {

			return new Promise(function (resolve, reject) {
				var result = gulp.src(dir + item + "/style/all.scss")
					.pipe(sass().on('error', sass.logError)) // sass编译
					.pipe(postcss([autoprefixer])) // 自动添加css3缀-webkit-  适合用于手机端 
					.pipe(rename(item + ".css")).pipe(gulp.dest('./src/static/css/'));
				resolve(result);
			});

		} catch (error) {
			console.log(error);
		}
	

}

function reloadJs() {
	return new Promise(function (resolve, reject) {
		var result = gulp.src(paths.jspath).pipe(connect.reload());
		resolve(result);
	});
}

gulp.task('dev-js', async function () {

	try {
		return await Promise.all(appJs.list.map(async function (item) {
			if (item === appJs.watch || appJs.watch === "all") {
				console.log("编译:"+item+"项的js");
				return asyncDevList(item, appJs.dir);
			}

		})).then(function () {
			reloadJs(); // 重启浏览器
		});

	} catch (error) {
		console.log(error);
	}

});

gulp.task('build-js', async function () {
	try {
		return await Promise.all(appJs.list.map(async function (item) {
			return asyncBuildList(item, appJs.dir);
		}));
	} catch (error) {
		console.log(error);
	}


});

async function asyncDevList(item, dir) {

	const bundle = await rollupBuild(false, item, dir);
	await bundle.write({
		file: './src/static/js/' + item + ".js",
		format: 'umd',
		name: 'umd',
		//sourcemap: true,
		strict: false, //在生成的包中省略`"use strict";`
	});

}

async function asyncBuildList(item, dir) {
	/* 
	1. amd -- 异步模块定义，用于像RequestJS这样的模块加载器。
	2. cjs -- CommonJS, 适用于Node或Browserify/webpack
	3. es -- 将软件包保存为ES模块文件。
	4. iife -- 一个自动执行的功能，适合作为 <script>标签这样的。
	5. umd -- 通用模块定义，以amd, cjs, 和 iife 为一体。
	*/

	const bundle = await rollupBuild(true, item, dir);
	await bundle.write({
		file: './src/static/js/' + item + ".js",
		format: 'umd',    
		name: 'umd',
		//sourcemap: true,
		strict: false, //在生成的包中省略`"use strict";`
	});

}

// 是否压缩js
function uglify_list(isBuild) {
	return isBuild ? uglify() : function () { };
}

function rollupBuild(isBuild, name, dir) {
	return rollup.rollup({

		input: dir + name + "/script/_app.js",

		/* 默认情况下，模块的上下文 - 即顶级的this的值为undefined。您可能需要将其更改为其他内容，如 'window'。*/
		context: "window",

		plugins: [
			vue(),
			vembedCss(),
			/*commonjs 转换 es6*/
			resolve(),
			commonjs(),
			replace({
				'process.env.NODE_ENV': isBuild ? JSON.stringify('production') : JSON.stringify('development'),
			}),

			babel({
				exclude: ['node_modules/**'],
				presets: ["es2015-rollup", "stage-2"]
			}),
			/* 使用uglify压缩js 不能output 输出 format: 'es' 格式 否会报错*/
			uglify_list(isBuild)

		],
	});
}


