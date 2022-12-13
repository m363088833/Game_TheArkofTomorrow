//file:__明日方舟__.js//
/*自调用+递归
(function ALL(data) {
    for (var X in data) {
        typeof data[X] == "function" ? eval(X + "=" + data[X]) : false;
        typeof data[X] == "object" ? ALL(data[X]) : console.log(X + "=" + data[X]);
    }
})(require("./__library__.js"));
*/

var library = {};


library.多线程找图 = function(template, option, img) {
    option.sleep1 ? sleep(option.sleep1) : null;
    let Thread = threads.start(function() {
        library.findImages(template, option, img);
    });
    option.sleep2 ? sleep(option.sleep2) : null;
}



// 5.找图
/* @ template {string} image对象
 * @ option   {object} 选项
 * @ return   {object} 找图成功返回{x,y}位置，失败返回null。
 */
library.findImages = function(template, option, img) {
    option == undefined ? option = {} : null; //确保option省略不写不会报错
    img == undefined ? img = captureScreen() : null;
    option.Name = template;
    template = eval(template);
    let Point = findImage(img, template, option);
    if (Point) {
        option.dX ? true : option.dX = 0; //默认点击左上角坐标(0,0)
        option.dY ? true : option.dY = 0;
        option.CLICK = {};
        option.CLICK.x = Point.x + template.getWidth() * option.dX;
        option.CLICK.y = Point.y + template.getHeight() * option.dY;
        option.console == undefined ? console.info("Target found !\noption=>", option) : null;
        // {CLICK.x:?} 0.0~1.0浮点值，选择点击位置
        option.click == undefined ? click(option.CLICK.x, option.CLICK.y) : null;
        option.sleep ? sleep(option.sleep) : null; //默认无延时，可设置找图成功延迟时间
    } else {
        option.console == undefined ? console.verbose("Find Image? =>", Point) : null;
    }
    return Point;
}



// 1.申请权限
/* @ morePermissions {boolean}
 *     {true} 开启更多权限
 */
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
    //截图权限
    if ($images.getScreenCaptureOptions() == null) {

        let Thread = threads.start(function() {
            let Allow = textMatches(/(允许|立即开始|统一)/).findOne(10 * 1000);
            if (Allow) {
                Allow.click();
            }
        });

        var 线程2 = threads.start(function() {
            if (!requestScreenCapture()) {
                toastLog("请求截图权限失败");
                exit();
            }
        });
        线程2.join();

    }
    console.warn("已获得截图权限");

    if (morePermissions == true) {
        //判断Autojs是否是最新版本(以下代码在旧版本可能会报错)
        if (app.autojs.versionName == "Pro 9.2.13-0") {
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
        } else {
            toastLog("当前是旧版本，不支持开启更多权限");
        }
    }
}


// 2.路径目录下所有图片转换为image对象
/* (属性名为图片文件名本身)
 * @ Extensions {string} 文件扩展名
 * @ path       {string} 文件夹路径
 * @ return     {object} image对象
 */
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


// 3.图片编码转换base64
/* @ data {string} 图片对象
 * @ path {string} 要保存的文件路径
 */
library.imageConvertBase64 = function(data, path) {
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


// 4.base64编码转换图片
/* @ JSONPath   {string} JSON文件路径
 * @ Extensions {string} 文件扩展名
 * @ FolderPath {string} 要保存的文件夹路径
 */
library.base64ConvertImage = function(JSONPath, Extensions, FolderPath) {
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




// 6.多目标找图
/* @ template {string} 小图对象
 * @ option   {object} 选项
 * @ return   {object} 找图成功返回[{x,y}]位置数组，失败返回[]。
 */
library.findImagesMax = function(template, option) {
    option == undefined ? option = {} : false; //(确保option省略不写)不会报错
    let Point = images.matchTemplate(captureScreen(), template, option);
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


// 7.循环找图
/*     (识别对象一直存在，则一直点击)
 *
 * @ template {string} 小图对象
 * @ option   {object} 找图选项
 * @ return   {object} 找图成功返回{x,y}位置，失败返回null。
 */
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


// 8.遍历目录下所有文件夹与文件
/* @ path   {string} 目录路径
 * @ return {Array} 返回所有文件夹名与文件名
 */
library.getFilesFromPath = function(path) {
    var arrDir = [];
    var arrFile = [];
    /* try {
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


// 9.打开应用
/* @ AppName {string} 应用名||应用包名
 */
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


// 10.强制关闭应用
/* @ AppName {string} 应用名||应用包名
 */
library.closeApp = function(AppName) {
    if (auto.service == null) { //判断无障碍服务是否开启
        auto.waitFor();
        back();
    }
    //判断该字符串是否是以 (com.)开头的APP包名
    if (!this.getStringType(AppName).type_PackageName) { //如果不是包名
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
        textMatches(/(.*确.*|.*定.*)/).findOne().click();
        toastLog(newAppName + "App已被关闭");
    } else {
        toastLog(newAppName + "App不在后台运行");
    }
    back();
}


// 11.写入JSON文件
/* @ data {string} 参数
 * @ path {string} 要保存的路径
 */
library.writeJSON = function(data, path) {
    /*确保路径jsonPath所在的文件夹存在，
    如果该路径所在文件夹不存在，则创建该文件夹*/
    files.ensureDir(path);
    //将js对象转换为字符串
    let newData = JSON.stringify(data);
    //写入文件
    files.write(path, newData, "utf-8");
}


// 12.读取JSON文件
/* @ path {string} 路径
 */
library.callJSON = function(path) {
    //读取文件
    let arr = files.read(path);
    //解释json文件
    let params = JSON.parse(arr);
    return params;
}


//不支持Android11以及后续的版本
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


// 13.判断字符串类型(正则表达式)
/* @ strings {string} 需要判断的字符串
 */
library.getStringType = function(strings) {
    var arr = {
        type_Chinese: RegExp("[\u4E00-\u9FA5]"), //中文
        type_English: RegExp("[A-Za-z]"), //英文
        type_Digit: RegExp("[0-9]"), //数字
        type_Symbol: RegExp("[`~!@#$^&*()=|{}':;',\\[\\]._<>《》/\?~！@#￥……&*（）——|{}【】‘；：”“'。，、？+-/ ]|[\\\\/]"), //符号
        type_PackageName: RegExp(/^com.[a-z]/), //识别APP包名
        type_Url: RegExp("^htt+(p||ps)+://.*?"), //识别网址
        type_CloudScript: RegExp("^htt+(p||ps)+://.*?[.]js$") //识别github云端脚本.js结尾网址
    }
    var type = {};
    for (let X in arr) {
        arr[X].test(strings) ? type[X] = true : type[X] = false;
    }
    return type;
}


// 14.自定义控制台
/* @ option {string} 选项
 */
library.consoles = function(option) {
    if (option.x && option.y) {
        console.setPosition(option.x, option.y);
    }
    option.show ? console.show() : false;
    option.隐藏 ? console.hide() : false;
    option.清空 ? console.clear() : false;
}


//测试1
library.测试加法 = function(a, b) {
    let c = a + b;
    console.info(c);
    alert(c);
    return c;
}
library.说明书 = function() {
    var a = "img.小黄标";
    var ab = split(".")[1];
    console.log(ab);
}
//播放铃声：叮咚声
library.playRingtone = function() {
    let Uri = android.net.Uri;
    let RingtoneManager = android.media.RingtoneManager;
    let uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    let rt = RingtoneManager.getRingtone(context, uri);
    rt.play();
}
//慢放属性名
library.Display_Data = function(data, pauseTime) {
    var arr = Object.keys(data);
    var t = 0;
    for (let i in data) {
        sleep(pauseTime);
        console.info(arr[t], "=>", data[i]);
        t++;
    }
}


//ui提示：输入不能为空(storages保存输入框内数据)
/* @ arr    {string} 
 * @ return {string} 
 */
function setError(arr) {
    var obb = true;
    for (let X in arr) {
        let text = eval("ui." + X + ".text()");
        if (text.length == 0) {
            //自定义提示
            eval("ui." + X + ".setError(\"" + arr[X] + "\")");
            obb = false;
        } else {
            storage.put(X, text); //保存输入框内数据
        }
    }
    return obb; //判断输入框是否空白
}


function 获取github云端脚本文件名(url) {
    var 仓库 = "https://raw.githubusercontent.com/m363088833/Cloud-Script/main/";
    var arr = url.split(仓库)[url.split(仓库).length - 1];
    //console.log("仓库名：" + arr);
    return arr;
}


function 停止其他脚本() {
    engines.all().map((ScriptEngine) => {
        if (engines.myEngine().toString() !== ScriptEngine.toString()) {
            ScriptEngine.forceStop();
        }
    });
}

function 停止自己当前脚本() {
    engines.myEngine().forceStop();
}

// UI全屏无状态栏(常用)
function UI全屏() {
    importClass(android.view.WindowManager);
    importClass(android.view.View);
    activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    activity
        .getWindow()
        .getDecorView()
        .setSystemUiVisibility(
            android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR |
            android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
            android.view.View.SYSTEM_UI_FLAG_FULLSCREEN
        );
}

//是否显示UI全屏full(true);//不太好用。
function full(enable) {
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


function 状态栏颜色() {
    ui.statusBarColor("#ffffff");
}

module.exports = library;
