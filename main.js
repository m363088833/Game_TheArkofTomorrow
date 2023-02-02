定时停止脚本(1000 * 60 * 60);
console.show(); //悬浮日志(测试完成则立即删除本行代码)
console.setPosition(0, 200); //(测试完成则立即删除本行代码)

var ARK = require("./module_exports/__ArkTomorrow__.js");
ARK.getPermission(true); //获取权限
var options = 找图选项();

var sum = threads.disposable(); //声明一个变量来接受 线程通讯返回的数据
let Threada = threads.start(function() {
    let sex = dialogs.select("请选择玩家", palyData().PlayerName);
    sum.setAndNotify(sex);
});

var Template = ARK.imagesObjectFile("png", "./"); //创建图片对象

Threada.join();

let sex = sum.blockedGet();
// console.log("sex =" + sex);
if (sex == palyData().AccountNumber.length) {
    依次登录游戏();
} else if (sex == -1) { /*点击框外取消选择*/ } else {
    单人游戏(palyData().AccountNumber[sex], palyData().Password[sex]);
}



//==============================================//
function 依次登录游戏() {
    for (let i = 0; i < palyData().AccountNumber.length; i++) {
        单人游戏(palyData().AccountNumber[i], palyData().Password[i]);
    }
}

function 单人游戏(账号, 密码) {
    ARK.closeApp("com.hypergryph.arknights"); //关闭明日方舟
    sleep(500);
    ARK.openApp("com.hypergryph.arknights"); //打开明日方舟
    sleep(2000);

    var i = 0;
    while (true) {
        log("登录", i++);
        ARK.findImages("Template.小黄标", options[1]);
        ARK.findImages("Template.账号管理", options[1]);
        if (ARK.findImages("Template.账号登录", options[1])) {
            break;
        }
    }
    while (true) {
        log("登录账号密码", i++);
        if (ARK.findImages("Template.账号", options[1])) {
            setText([0], 账号); //账号
            sleep(1000);
            click(1000, 150);
            sleep(1000);
        }
        if (ARK.findImages("Template.密码", options[1])) {
            setText([0], 密码); //密码
            sleep(1000);
            click(1000, 150);
            sleep(1000);
        }
        if (ARK.loopFindImages("Template.登录", options[1])) {
            (function Conformity() {
                活动与签到();
                关卡_上次作战();
                代理行动();
                基建();
                home();
                sleep(1500);
            })();
            return;
        }
    }
}

function 活动与签到() {
    var i = 0;
    var ic = 0;
    while (true) {
        log("活动与签到", i++)
        ARK.findImages("Template.关闭活动");
        ARK.findImages("Template.关闭每日签到");
        ARK.findImages("Template.获得物资");
        if (ARK.findImages("Template.采购中心", options[0])) {
            ic++;
            if (ic >= 4) {
                return;
            }
        }
    }
}

function 关卡_上次作战() {
    var i = 0
    while (true) {
        log("关卡_上次作战", i++);
        ARK.findImages("Template.采购中心");
        ARK.findImages("Template.多界面", options[1]);
        if (ARK.findImages("Template.终端")) {
            break;
        }
    }
    while (true) {
        if (ARK.findImages("Template.前往上一次作战")) {
            return;
        }
    }
}

function 代理行动() {
    var i = 0
    while (true) {
        log("代理行动", i++)
        ARK.findImages("Template.蓝色开始行动");
        ARK.loopFindImages("Template.红色开始行动");
        ARK.loopFindImages("Template.战斗结束", options[4]);
        ARK.findImages("Template.确认剿灭加速");
        ARK.loopFindImages("Template.剿灭结束报告");
        if (ARK.findImages("Template.合成玉已达到上限") ||
            ARK.findImages("Template.源石购买理智")) {
            return;
        }
    }
}

function 基建() {
    var i = 0
    while (true) {
        log("基建", i++)
        ARK.findImages("Template.多界面", options[1]);
        if (ARK.loopFindImages("Template.基建", options[1])) {
            break;
        }
    }
    for (let i = 0; i < 50; i++) {
        if (ARK.loopFindImages("Template.基建蓝铃铛", options[1])) {
            i = 50;
        }
        if (ARK.loopFindImages("Template.基建点击全部", options[1])) {
            return;
        }
    }
}

function palyData() {
    return {
        "PlayerName": [
            "丘吉尔宇飞",
            "myf",
            "新城",
            "所有玩家"
        ],
        "AccountNumber": [
            "19962112330",
            "15375665837",
            "16251734019"
        ],
        "Password": [
            "19962112330",
            "15375665837",
            "jr964707"
        ]
    }
}

function 找图选项() {
    return [{ //找图选项
            click: false //[0]取消默认点击
        },
        {
            sleep: 1000 //[1]识别成功后延迟1000ms
        },
        {
            sleep: 3000 //[2]
        },
        {
            console: false //[3]取消打印信息
        },
        {
            dX: 0.9 //[4]
        }
    ]
}

function 定时停止脚本(time) {
    threads.start(function() {
        toastLog("定时停止脚本_开始");
        sleep(time);
        console.hide();
        toastLog("定时停止脚本_结束");
        // home();
        exit();
    });
}
