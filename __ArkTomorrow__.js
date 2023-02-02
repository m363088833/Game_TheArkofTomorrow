var library = {};

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


/* 申请权限 */
/* 
 * @ morePermissions {boolean} true: 开启更多权限 */
library.getPermission = function(morePermissions) {
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
        floaty.requestPermission();
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
    //开启更多权限
    if (morePermissions == true) {
        var Thread3 = threads.start(function() {
            //关闭内存泄露检测
            $debug.setMemoryLeakDetectionEnabled(false);
            console.warn("已关闭内存泄露检测");
            //忽略电池优化
            if (!$power_manager.isIgnoringBatteryOptimizations()) {
                toastLog("请开启忽略电池优化功能");
                $power_manager.requestIgnoreBatteryOptimizations();
            } else {
                console.warn("已开启忽略电池优化");
            }
            //前台服务
            if (!$settings.isEnabled("foreground_service")) {
                toastLog("请开启前台服务");
                $settings.setEnabled("foreground_service", true); //开启前台服务
            } else {
                console.warn('已开启前台服务');
            }
        });
    }
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


/* 普通方框 */
/* @ x1|y1|x2|y2 {number} 坐标点 
 * @ time  {object} 方框显示时长 */
library.ordinaryBox = function(x1, y1, x2, y2, time) {
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
            canvas.drawRect(x1, y1, x2, y2, paintGreen);
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


/* 图片编码转换base64 */
/* @ data {string} 图片image对象
 * @ path {string} 保存的文件路径 */
library.image_Convert_Base64 = function(data, path) {
    var obb = {};
    for (let X in data) {
        //图片编码为base64数据并返回
        obb[X] = images.toBase64(data[X], "png", 100);
    }
    if (path != undefined) {
        files.ensureDir(path); //确保文件夹路径存在
        this.writeJSON(obb, path); //将js对象转换为字符串并写入文件
    }
    return obb;
}


/* 图片编码转换为Byte数据 */
/* @ data {string} 图片对象
 * @ path {string} 要保存的文件路径 */
library.image_Convert_Bytes = function(data, path) {
    var obb = {};
    for (let X in data) {
        //图片编码为base64数据并返回
        obb[X] = images.toBytes(data[X], "png", 100);
    }
    if (path != undefined) {
        files.ensureDir(path); //确保文件夹路径存在
        this.writeJSON(obb, path); //将js对象转换为字符串并写入文件
    }
    return obb;
}


/* base64编码转换图片 */
/* @ JSONPath   {string} JSON文件路径
 * @ Extensions {string} 文件扩展名
 * @ FolderPath {string} 要保存的文件夹路径 */
library.base64_Convert_Image = function(JSONPath, Extensions, FolderPath) {
    if (typeof JSONPath == "string" && files.isFile(JSONPath)) {
        var arr = this.callJSON(JSONPath);
    } else {
        var arr = JSONPath;
    }
    /*确保路径所在的文件夹存在。
    如果该路径所在文件夹不存在，则创建该文件夹。*/
    files.ensureDir(FolderPath);
    for (let i in arr) {
        //解码Base64数据并返回解码后的图片Image对象
        let img = images.fromBase64(arr[i]);
        //合成图片路径
        let newPath = i + "." + Extensions;
        newPath = files.join(FolderPath, newPath);
        console.info(newPath);
        //把base64数据以PNG格式保存到path中。
        images.save(img, newPath, Extensions, 100);
    }
}


/* 多目标找图 */
/* @ template {string} 小图对象
 * @ option   {object} 选项
 * @ return   {object} 找图成功返回[{x,y}]位置数组，失败返回[]。 */
library.findImagesMax = function(template, option) {
    option == undefined ? option = {} : false; //(确保option省略不写)不会报错
    var Point = images.matchTemplate(captureScreen(), template, option);
    /*排序方向包括 left (左), top (上), right (右), bottom (下)。
    默认将匹配结果按匹配位置从左往右、从上往下排序。*/
    option.sorting ?
        Point = Point.sortBy(option.sorting).points :
        Point = Point.sortBy("left-top").points;
    //first() 返回 {Match}第一个匹配结果。如果没有任何匹配，则返回null。
    if (Point.first()) {
        for (let i = 0; i < Point.length; i++) {
            option.click ? click(Point[i].x, Point[i].y) : false; //默认不点击
        }
        return Point; //识别不成功返回的是空数组，转换布尔值是true。
    } else {
        return false;
    }
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


/* 生成xml启动图 */
/* @ imageBase64Date {data}   image图片对象base64数据
 * @ xmlPath         {string} 保存文件路径 */
library.generateXmlStartupDiagram = function(imageBase64Date, xmlPath) {
    let xmlText = `<?xml version="1.0" encoding="UTF-8" ?>
<vertical>
    <img w="*" h="0" layout_weight="1" src="data:image/png;base64,` + imageBase64Date + `" scaleType="fitXY"/>
</vertical>`;
    files.ensureDir(xmlPath);
    files.write(xmlPath, xmlText);
}


/* 不支持Android11以及后续的版本 */
library.移动QQ文件 = function(path) {
    //QQ下载保存的，默认文件夹路径
    let qqPath = "/storage/emulated/0/Android/data/com.tencent.mobileqq/Tencent/QQfile_recv/";
    if (files.isFile(qqPath)) { //检查该文件夹路径是否存在
        //移动所有在QQ下载的文件到指定path路径
        files.move(qqPath, path);
        toastLog("移动成功" + path);
    } else {
        toastLog("不支持Android11以及后续的版本");
    }
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


/* 慢放属性名 */
library.Display_Data = function(data, pauseTime) {
    var arr = Object.keys(data);
    var t = 0;
    for (let i in data) {
        sleep(pauseTime);
        console.info(arr[t], "=>", data[i]);
        t++;
    }
}


library.停止其他脚本 = function() {
    engines.all().map((ScriptEngine) => {
        if (engines.myEngine().toString() !== ScriptEngine.toString()) {
            ScriptEngine.forceStop();
        }
    });
}


library.停止自己当前脚本 = function() {
    engines.myEngine().forceStop();
}


/* UI全屏无状态栏(常用) */
library.UI全屏 = function() {
    importClass(android.view.WindowManager);
    importClass(android.view.View);
    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    activity.getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | android.view.View.SYSTEM_UI_FLAG_FULLSCREEN);
}


/* 是否显示UI全屏，不太好用 */
library.是否显示UI全屏 = function(enable) {
    importClass(android.view.WindowManager);
    if (enable) {
        //设置全屏
        let lp = activity.getWindow().getAttributes();
        lp.flags |= WindowManager.LayoutParams.FLAG_FULLSCREEN;
        activity.getWindow().setAttributes(lp);
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    } else {
        //取消全屏
        let attr = activity.getWindow().getAttributes();
        attr.flags &= ~WindowManager.LayoutParams.FLAG_FULLSCREEN;
        activity.getWindow().setAttributes(attr);
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    }
}


library.设置UI全屏 = function() {
    importClass(android.view.WindowManager);
    let lp = activity.getWindow().getAttributes();
    lp.flags |= WindowManager.LayoutParams.FLAG_FULLSCREEN;
    activity.getWindow().setAttributes(lp);
    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
}


library.设置状态栏颜色 = function(color) {
    var color = color == undefined ? "#ffffff" : color;
    ui.statusBarColor(color);
}


/* 向前加零，必须写成"number"，否则数字前方有一个0则默认识别为八进制 */
library.forwardPlusZero = function(number, 位数) {
    number = number.toString(8);
    number = Number(number);
    var arr = 位数 - this.JudgeTheNumberOfDigits(number)
    for (let i = arr; i > 0; i--) {
        number = "0" + number;
    }
    return number;
}


/* 判断数字的位数，必须写成"number"，否则数字前方有一个0则默认识别为八进制 */
library.JudgeTheNumberOfDigits = function(number) {
    for (let i = 1, e = 0, t = 1; i <= 100; i++) {
        if (e <= number / t && number / t < 10) {
            return i;
        }
        e === 0 ? e = 1 : 0; //在个位数0~1之前的数判断条件需要改成(0<=数字/1 && 数字/1<10)
        t *= 10;
    }
}


library.importClass_语音播报 = function() {
    importClass(android.speech.tts.TextToSpeech.Engine);
    importClass(java.util.Locale);
    importClass(android.speech.tts.TextToSpeech);
    importClass(android.speech.tts.TextToSpeech.OnInitListener);
}


library.语音播报 = function(str) {
    var pitch = 1.0;
    var speechRate = 1.0;
    var obj = {
        onInit: function(status) {
            if (status == TextToSpeech.SUCCESS) {
                if (tts.setLanguage(Locale.CHINESE) == TextToSpeech.SUCCESS && tts.setPitch(pitch) == TextToSpeech.SUCCESS && tts.setSpeechRate(speechRate) == TextToSpeech.SUCCESS) {} else {
                    exit();
                }
            } else {}
        }
    }
    tts = new TextToSpeech(context, TextToSpeech.OnInitListener(obj))
    sleep(100);
    tts.speak(str, TextToSpeech.QUEUE_ADD, null);
}


/* 连接图片 */
/* 
 * @ FolderPath {string} 文件夹路径 */
library.connectPicture = function(FolderPath, 漫画文件夹名, 保存的漫画路径) {
    //获取目录下所有文件与文件夹并整合为数组
    var data = this.getFilesFromPath(FolderPath);
    log("data= " + data);
    for (var i = 1; i < data.length; i++) {
        let w = i - 1;
        console.log("循环次数i= " + i + "\n合成图片张数：" + w);
        var 图片路径1 = "/storage/emulated/0/脚本/漫画集/" + 漫画文件夹名 + "/" + i + "." + "jpg";
        var t = i + 1;
        var 图片路径2 = "/storage/emulated/0/脚本/漫画集/" + 漫画文件夹名 + "/" + t + "." + "jpg";
        if (files.isFile(图片路径1)) {
            if (i == 1) {
                var img1 = images.read(图片路径1);
            } else {
                var img1 = img;
            }
            var img2 = images.read(图片路径1);
            //图片连接
            var img = images.concat(img1, img2, "BOTTOM");
        }
    }
    var 合并图片保存路径 = 保存的漫画路径 + "合成图片" + "." + "jpg";
    alert("合并图片保存路径=" + 合并图片保存路径);
    images.save(img, 合并图片保存路径, "jpg", 100); //保存图片
    app.viewFile(合并图片保存路径); //查看合成图片
}


library.保存全屏截图 = function(imgPath) {
    files.ensureDir(imgPath); //确保相关文件夹存在
    images.save(captureScreen(), imgPath, "png", 100);
    //app.viewFile(imgPath); //用其他应用查看
}


library.文本截取 = function(Condition, text) {
    //截取某个字符串前面的内容：text.match(/(.*?)fff/)[1];
    //截取某个字符串后面的内容：text.match(/aaa(.*?)/)[1];
    //截取某个字符串中间的内容：text.match("^//newFile:(.*?)//");
    //如果包括换行和空格的格式是：/function([\s\S]*)/  或者  "function([\\s\\S]*)"
    if (typeof text == "string" && text.search(Condition) != -1) { //防报错
        return text.match(Condition)[1];
    }
}


library.获取字符串中最后一个斜杠前后内容 = function(str) {
    let index = str.lastIndexOf("\/");
    return [
        str.substring(0, index + 1), //[0]斜杠前面内容
        str.substring(index + 1, str.length) //[1]斜杠后面内容
    ]
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


/* 监听剪贴板内容 */
/*   (也就是说平时返回值都是undefined)
 * 需要搭配使用，使用前一定要粘贴以下内容。
    importClass(android.content.ClipData.Item);
    var clip_Timestamp = null; */
library.getClipstr = function() {
    var clipborad = context.getSystemService(context.CLIPBOARD_SERVICE);
    var clip = clipborad.getPrimaryClip()
    try {
        //时间戳
        if (clip_Timestamp != clip.getDescription().getTimestamp()) {
            if (clip_Timestamp == null) {
                //首次存储时间戳,下次进行比对
                clip_Timestamp = clip.getDescription().getTimestamp()
            } else {
                var item = clip.getItemAt(0);
                clip_Timestamp = clip.getDescription().getTimestamp()
                item = clip.getItemAt(0)
                // log(item.getText()) //获取剪贴板内容
                var 剪贴板内容 = item.getText();
                //进行发送
                send_msg(item.getText())
            }
        }
    } catch (e) {}
    return 剪贴板内容;
}


/* 监听剪贴板内容(刷新界面实时返回剪贴板信息) */
library.clip_listener = function(time) {
    importClass(android.os.Build);
    var version = Build.VERSION.RELEASE;
    //log("安卓版本号："+version);
    var sum = threads.disposable(); //声明一个变量来接受 线程通讯返回的数据
    if (version < 10) { //安卓10以下版本【推荐，不存在焦点抢占的情况】
        this.getClipstr();
    } else { //安卓10以上版本
        var Thread = threads.start(function() {
            time == undefined ? time = 4000 : null; //默认时间4秒
            sleep(time);
            var w = floaty.window(
                <text />);
            ui.run(function() {
                w.requestFocus();
                setTimeout(() => {
                    //将计算好的结果通知主线程接收结果
                    sum.setAndNotify(this.getClipstr());
                    log();
                    w.close();
                }, 1200);
            });
        });
    }
    Thread.join();
    return sum.blockedGet();
}


/* 数字排序：0,1,2,3,4,5,6,7,8,9,10,11 */
library.SortArr = function(arr) {
    arr.sort((a, b) => {
        return a - b
    })
    return arr
}


/* ui提示：输入不能为空(storages保存输入框内数据) */
/* @ storages {string} storages模块名称
 * @ arr      {object}
 * @ return   {string} */
library.ui_setError = function(icu, arr) {
    var obb = true;
    for (let X in arr) {
        let text = eval("ui." + X + ".text()");
        if (text.length == 0) {
            //自定义提示
            eval("ui." + X + ".setError(\"" + arr[X] + "\")");
            obb = false;
        } else {
            icu.put(X, text); //保存输入框内数据
        }
    }
    return obb; //判断输入框是否空白
}


/* 把当前文件夹内的所有.jpg图片整理运行成ui漫画界面 */
library.textCartoonJS = function() {
    return `"ui";

ui.layout(
    <ScrollView >
        <grid id="icons">
            <img src="file://./{{this}}.jpg"/>
        </grid>
    </ScrollView>
);

main(files.cwd());

function main(path) {
    threads.start(function() {
        var 存档_ssd;
        while (true) {
            var arr = files.listDir(path, function(name) {
                return name.endsWith(".jpg") && files.isFile(files.join(path, name));
            });
            var ssd = [];
            for (let i = 0; i < arr.length; i++) {
                let ds = arr[i].match("(.*?).jpg")[1];
                ssd.push(ds);
            }
            ssd.sort((a, b) => {
                return a - b
            });
            if (ssd.join() != 存档_ssd) {
                存档_ssd = ssd.join();
                ui.run(function() {
                    ui.icons.setDataSource(ssd);
                })
            }
        }
    });
}`
}


library.ui_再按一次退出程序 = function() {
    let lastPressedTime = 0;
    ui.emitter.on("back_pressed", (e) => {
        let time = Date.now();
        if (time - lastPressedTime < 600) {
            return;
        }
        toastLog("再按一次退出程序");
        e.consumed = true;
        lastPressedTime = time;
    });
}


module.exports = library;