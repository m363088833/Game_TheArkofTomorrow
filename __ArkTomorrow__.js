var library = {};


/* 申请权限 */
/* 
 * @ morePermissions {boolean} true: 开启更多权限 */
library.getPermission = function(morePermissions) {
    //开启更多权限
    if (morePermissions == true) {
        var Thread3 = threads.start(function() {
            //关闭内存泄露检测
            $debug.setMemoryLeakDetectionEnabled(false);
            console.warn("已关闭内存泄露检测");
            //忽略电池优化
            if (!$power_manager.isIgnoringBatteryOptimizations()) {
                toastLog("请开启忽略电池优化功能");
                $power_manager.requestIgnoreBatteryOptimizations().waitFor();
            } else {
                console.warn("已开启忽略电池优化");
            }
            //前台服务
            if (!$settings.isEnabled("foreground_service")) {
                toastLog("请开启前台服务");
                $settings.setEnabled("foreground_service", true).waitFor();; //开启前台服务
            } else {
                console.warn('已开启前台服务');
            }
        });
    }
    
    //无障碍服务
    if (auto.service == null) {
        toastLog("请开启无障碍服务");
        auto.waitFor();
        back();
    } else {
        console.warn("已获得无障碍服务");
    }
    //悬浮窗权限
    if (!floaty.checkPermission()) {
        toast("请开启悬浮窗和后台弹出界面权限");
        floaty.requestPermission().waitFor();;
    } else {
        console.warn("已获得悬浮窗权限");
    }
    var Thread2 = threads.start(function() {
        //截图权限
        if ($images.getScreenCaptureOptions() == null) {
            let Thread = threads.start(function() {
                let Allow = textMatches(/(允许|立即开始|统一)/).findOne(10 * 1000);
                if (Allow) {
                    Allow.click();
                }
            });
            if (!requestScreenCapture()) {
                toastLog("请求截图权限失败");
                exit();
            }
        }
        console.warn("已获得截图权限");
    });
    Thread2.join(); //等待join2线程结束
}


/* 找图 */
/* @ template {string} image图片对象
 * @ option   {object} 选项
 * @ img      {object} 截取当前屏幕并返回一个Image对象
 * # return   {object} 找图成功返回{x,y}位置，失败返回null */
library.findImages = function(template, option, img) {
    option == undefined ? option = {} : null; //确保option省略不写不会报错
    img == undefined ? img = captureScreen() : null;
    option.Name = template; //打印找图信息，显示名称
    template = eval(template); //转换为图片对象
    let Point = findImage(img, template, option); //找图对比
    if (Point) {
        this.findImagesBox(template, Point);
        option.小图宽度 = template.getWidth();
        option.小图高度 = template.getHeight();
        option.dX ? true : option.dX = 0; //默认点击左上角坐标(0,0)
        option.dY ? true : option.dY = 0;
        option.CLICK = {};
        option.CLICK.x = Point.x + option.小图宽度 * option.dX;
        option.CLICK.y = Point.y + option.小图高度 * option.dY;
        option.console == undefined ? console.info("Target found !\noption=>", option) : null;
        option.click == undefined ? click(option.CLICK.x, option.CLICK.y) : null;
        option.sleep ? sleep(option.sleep) : null; //默认无延时，可设置找图成功延迟时间
    } else {
        option.console == undefined ? console.verbose("Find Image? =>", option.Name, " = ", Point) : null;
    }
    return Point;
}


/* 循环找图 */
/*   (识别对象一直存在，则一直点击)
 * @ template {string} 小图对象
 * @ option   {object} 找图选项
 * @ return   {object} 找图成功返回{x,y}位置，失败返回null。*/
library.loopFindImages = function(templat, option, img) {
    for (let i = 0; i < 1; i++) {
        var p = this.findImages(templat, option, img);
        if (p) {
            var pi = p; //保存找图信息，避免循环刷新
            i = -1;
        }
    }
    return pi;
}


/* 找图方框 */
/* @ data  {object} image对象
 * @ Point {object} 找图返回的坐标点，例如{x:0,y:0}
 * @ time  {object} 方框显示时长 */
library.findImagesBox = function(data, Point, time) {
    var Thread = threads.start(function() {
        var window = floaty.rawWindow(
            <frame>
                            <canvas id="board"/>
                        </frame>
        );
        window.setTouchable(false); //关闭设置窗口不可触摸
        window.setSize(-1, -1); //设置全屏
        window.board.on("draw", function(canvas) {
            var paintGreen = new Paint();
            paintGreen.setAntiAlias(true); //抗锯齿
            paintGreen.setAlpha(255); //0~255透明度
            paintGreen.setFakeBoldText(true);
            paintGreen.setStrokeWidth(4); //设置行程宽度
            paintGreen.setStyle(Paint.Style.STROKE); //设置样式：描边
            paintGreen.setColor(colors.parseColor("#FF00FF00")); //设置颜色
            var 状态栏高度 = context.getResources().getDimensionPixelSize(context.getResources().getIdentifier("status_bar_height", "dimen", "android"));
            var 屏幕方向 = context.getSystemService(context.WINDOW_SERVICE).getDefaultDisplay().getRotation();
            var 小图宽度 = data.getWidth();
            var 小图高度 = data.getHeight();
            if (屏幕方向 === 0 || 屏幕方向 === 2) { //竖屏
                var x1 = Point.x;
                var y1 = Point.y - 状态栏高度;
                var x2 = Point.x + 小图宽度;
                var y2 = Point.y + 小图高度 - 状态栏高度;
            } else if (屏幕方向 === 1) { //横屏
                var x1 = Point.x - 状态栏高度;
                var y1 = Point.y;
                var x2 = Point.x + 小图宽度 - 状态栏高度;
                var y2 = Point.y + 小图高度;
            } else if (屏幕方向 === 3) { //反向横屏
                var x1 = Point.x;
                var y1 = Point.y;
                var x2 = Point.x + 小图宽度;
                var y2 = Point.y + 小图高度;
            }
            canvas.drawRect(x1, y1, x2, y2, paintGreen);
        });
        time == undefined ? time = 800 : null; //time默认800ms
        setTimeout(() => {
            window.close();
        }, time);
    });
}


/* 多点找色 */
/* @ template {object} image对象
 * @ option   {object} 选项
 * @ img      {object} 截取当前屏幕并返回一个Image对象
 * # return   {object} 找色成功返回{x,y}位置，失败返回null */
library.多点找色 = function(template, option, img) {
    option == undefined ? option = {} : null;
    img == undefined ? img = captureScreen() : null;
    option.Name = template;
    template = eval(template);
    let Point = images.findMultiColors(img, template[0][2], template, option);
    if (Point) {
        option.Point = Point;
        this.MultiPointColorFindingBox(template, Point);
        option.console == undefined ? console.info("Target found !\noption=>", option) : null;
        option.click == undefined ? click(Point.x, Point.y) : null;
        img.recycle(); //释放内存
        option.sleep ? sleep(option.sleep) : null; //默认无延时，可设置找图成功延迟时间 
    } else {
        option.console == undefined ? console.verbose("Find Image? =>", option.Name, " = ", Point) : null;
    }
    return Point;
}


/* 找色方框 */
/* @ data  {object} image对象
 * @ Point {object} 找图返回的坐标点，例如{x:0,y:0}
 * @ time  {object} 方框显示时长 */
library.MultiPointColorFindingBox = function(data, Point, time) {
    let Thread = threads.start(function() {
        let window = floaty.rawWindow(
            <frame>
                            <canvas id="board"/>
                        </frame>
        );
        window.setTouchable(false); //关闭设置窗口不可触摸
        window.setSize(-1, -1); //设置全屏
        window.board.on("draw", function(canvas) {
            var paintGreen = new Paint();
            paintGreen.setAntiAlias(true); //抗锯齿
            paintGreen.setAlpha(255); //0~255透明度
            paintGreen.setFakeBoldText(true);
            paintGreen.setStrokeWidth(4); //设置行程宽度
            paintGreen.setStyle(Paint.Style.STROKE); //设置样式：描边
            paintGreen.setColor(colors.parseColor("#FF00FF00")); //设置颜色
            var 状态栏高度 = context.getResources().getDimensionPixelSize(context.getResources().getIdentifier("status_bar_height", "dimen", "android"));
            var 屏幕方向 = context.getSystemService(context.WINDOW_SERVICE).getDefaultDisplay().getRotation();
            var 屏幕宽度 = device.height;
            var 屏幕高度 = device.width;
            for (let i = 0; i < data.length; i++) {
                if (屏幕方向 === 0 || 屏幕方向 === 2) { //判断竖屏
                    var x1 = Point.x + data[i][0] - 10;
                    var y1 = Point.y + data[i][1] - 10 - 状态栏高度;
                    var x2 = Point.x + data[i][0] + 10;
                    var y2 = Point.y + data[i][1] + 10 - 状态栏高度;
                } else if (屏幕方向 === 1) { //判断正横屏
                    var x1 = Point.x + data[i][0] - 10 - 状态栏高度;
                    var y1 = Point.y + data[i][1] - 10;
                    var x2 = Point.x + data[i][0] + 10 - 状态栏高度;
                    var y2 = Point.y + data[i][1] + 10;
                } else if (屏幕方向 === 3) { //判断反横屏
                    var x1 = Point.x + data[i][0] - 10;
                    var y1 = Point.y + data[i][1] - 10;
                    var x2 = Point.x + data[i][0] + 10;
                    var y2 = Point.y + data[i][1] + 10;
                }
                var x1 = (x1 > 0 ? x1 : 0); //获取大于0的数字
                var y1 = (y1 > 0 ? y1 : 0); //同上
                var x2 = (x2 > 0 ? x2 : 0);
                var y2 = (y2 > 0 ? y2 : 0);
                canvas.drawRect(x1, y1, x2, y2, paintGreen);
            }
        });
        time == undefined ? time = 800 : null; //time默认800ms
        setTimeout(() => {
            window.close();
        }, time);
    });
}


/* 路径目录下所有图片转换为image对像 */
/*   (属性名为图片文件名本身)
 * @ Extensions {string} 文件扩展名
 * @ path       {string} 文件夹路径
 * @ return     {object} image对象 */
library.imagesObjectFile = function(Extensions, path) {
    var obb = this.getFilesFromPath(path);
    var imgObj = {};
    for (let i = 0; i < obb.length; i++) {
        //筛选文件&&筛选扩展名
        if (files.isFile(obb[i]) && files.getExtension(obb[i]) == Extensions) {
            //获取文件名称
            let fileName = files.getNameWithoutExtension(obb[i]);
            if (fileName.match(/^\d+/) == null) { //筛选非数字开头的图片文件名
                //创建新属性名=image对象
                imgObj[fileName] = images.read(obb[i]);
            } else {
                console.error(obb[i]); //文件名不符合命名规则
            }
        }
    }
    return imgObj;
}


/* 遍历目录下所有文件夹与文件 */
/* @ path   {string} 目录路径
 * @ return {Array} 返回所有文件夹名与文件名 */
library.getFilesFromPath = function(path) {
    var arrDir = [];
    var arrFile = [];
    /*try {
        var rp = /^([/][^\/:*?<>|]+[/]?)+$/;
        if (rp.test(path) == false) throw "非法文件路径,getFilesFromPath(?);" + path;
    } catch (err) {
        log(err);
        exit();
    }*/
    //获取path目录下所有文件夹和文件
    var arr = files.listDir(path);
    //遍历文件和文件夹
    for (var i = 0; i < arr.length; i++) {
        //连接路径
        let newPath = files.join(path, arr[i]);
        //判断路径类型
        if (files.isDir(newPath)) {
            arrDir.push(newPath);
            //递归遍历文件夹
            var arrF = this.getFilesFromPath(newPath);
            arrDir = arrDir.concat(arrF);
        } else if (files.isFile(newPath)) {
            arrFile.push(newPath);
        }
    }
    //连接数组并返回
    return arrDir.concat(arrFile);
}


/* 打开应用 */
/* 
 * @ AppName {string} 应用名||应用包名 */
library.openApp = function(AppName) {
    var o = {};
    //判断该字符串是否是以 (com.)开头的APP包名
    o.pattern = new RegExp(/com.[a-z]/);
    if (o.pattern.test(AppName)) { //是包名
        o.ObtainTheAppName = app.getAppName(AppName); //获取包名对应的应用名称
        launch(AppName) ? o.n = "成功" : o.n = "失败"; //使用包名打开应用
    } else { //非包名
        o.ObtainTheAppName = AppName; //用于显示
        launchApp(AppName) ? o.n = "成功" : o.n = "失败"; //使用应用名打开应用
    }
    //sleep(500);
    //toastLog("启动：" + o.ObtainTheAppName + o.n);
}


/* 强制关闭应用 */
/* 
 * @ AppName {string} 应用名||应用包名 */
library.closeApp = function(AppName) {
    if (auto.service == null) { //判断无障碍服务是否开启
        auto.waitFor();
        back();
    }
    //判断该字符串是否是以 (com.)开头的APP包名
    if (!this.getStringType(AppName).PackageName) { //如果不是包名
        var newAppName = AppName; //应用名称
        var packageName = app.getPackageName(AppName); //获取应用的包名
    } else {
        var newAppName = app.getAppName(AppName); //获取包名对应的应用名称
        var packageName = AppName;
    }
    app.openAppSetting(packageName);
    text(newAppName).waitFor();
    let is_sure = textMatches(/(.*强.*|.*停.*|.*结.*|.*行.*)/).findOne();
    if (is_sure.enabled()) {
        textMatches(/(.*强.*|.*停.*|.*结.*|.*行.*)/).findOne().click();
        sleep(500);
        textMatches(/(.*确.*|.*定.*)/).findOne().click();
        toastLog(newAppName + "App已被关闭");
    } else {
        toastLog(newAppName + "App不在后台运行");
    }
    sleep(500);
    back();
}


/* 写入JSON文件 */
/* @ data {string} 参数
 * @ path {string} 要保存的路径 */
library.writeJSON = function(data, path) {
    /*确保路径jsonPath所在的文件夹存在，
    如果该路径所在文件夹不存在，则创建该文件夹*/
    files.ensureDir(path);
    //将js对象转换为字符串
    let newData = JSON.stringify(data);
    //写入文件
    files.write(path, newData, "utf-8"); //单独使用生成的文件开头就不会有"符号
}


/* 读取JSON文件 */
/*
 * @ path {string} 路径 */
library.callJSON = function(path) {
    //读取文件并解释json文件
    let params = JSON.parse(files.read(path));
    return params;
}

/* 判断字符串类型  */
/*   (正则表达式)
 * @ str {string} 字符串 */
library.getStringType = function(str) {
    var arr = {
        Chinese: RegExp("[\u4E00-\u9FA5]"), //中文
        English: RegExp("[A-Za-z]"), //英文
        Digit: RegExp("[0-9]"), //数字
        Symbol: RegExp("[`~!@#$^&*()=|{}':;',\\[\\]._<>《》/\?~！@#￥……&*（）——|{}【】‘；：”“'。，、？+-/ ]|[\\\\/]"), //符号
        PackageName: RegExp(/^com.[a-z]/), //识别APP包名
        Url: RegExp("^htt+(p||ps)+://.*?"), //识别网址
        CloudScript: RegExp("^htt+(p||ps)+://.*?[.]js$") //识别github云端脚本.js结尾网址
    }
    var type = {};
    for (let X in arr) {
        type[X] = arr[X].test(str) ? true : false;
    }
    return type;
}


/* 播放铃声：叮咚声 */
library.playRingtone = function() {
    let Uri = android.net.Uri;
    let RingtoneManager = android.media.RingtoneManager;
    let uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    let rt = RingtoneManager.getRingtone(context, uri);
    rt.play();
}

library.停止其他脚本 = function() {
    engines.all().map((ScriptEngine) => {
        if (engines.myEngine().toString() !== ScriptEngine.toString()) {
            ScriptEngine.forceStop();
        }
    });
}


library.定时停止脚本 = function(time) {
    threads.start(function() {
        toastLog("定时停止脚本_开始");
        sleep(time);
        console.hide();
        toastLog("定时停止脚本_结束");
        // home();
        exit();
    });
}


module.exports = library;
