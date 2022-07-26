
let storage = storages.create("cp")
const key_ori = 'sp_ori'
const key_dest = 'sp_dest'
const key_date = 'sp_date'
const key_xing = 'sp_xing'
const key_ming = 'sp_ming'
const key_phone = 'sp_phone'
const key_email = 'sp_email'
let args = {
    ori: storage.get(key_ori, ''),
    dest: storage.get(key_dest, ''),
    date: storage.get(key_date, ''),
    xing: storage.get(key_xing, ''),
    ming: storage.get(key_ming, ''),
    phone: storage.get(key_phone, ''),
    email: storage.get(key_email, ''),
}

try {
    start()
} catch (err) {
    log('运行错误: ' + err)
} finally {
    events.broadcast.emit("stop")
}

function start() {
    log('start, args: ' + JSON.stringify(args))
    ret = app.launchApp('国泰航空')
    if (!ret) {
        toastLog('启动app失败')
        return
    }
    while (currentActivity() == 'com.stardust.autojs.execution.ScriptExecuteActivity' || currentActivity() == 'com.cathaypacific.mobile.activities.SplashScreenActivity') {
        sleep(100)
    }
    if (currentActivity() == 'com.cathaypacific.mobile.activities.SelectLanguageDialogActivity') {
        id('rlSelectLanguage').findOne().click()
        textContains('简体中文').findOne().parent().clickCenter()
        id('ctvConfirm').findOne().click()
        waitForActivity('com.cathaypacific.mobile.activities.AcceptTermsOfUseActivity')
        id('ctaButton').findOne().click()
        waitForActivity('com.cathaypacific.mobile.activities.SignInActivity')
        id('tvSignInSkip').findOne().click()
    }
    waitForActivity('com.cathaypacific.mobile.module.home.activity.MainActivity')
    id('layoutCtaTitle').findOne().clickCenter()

    log('选择单程')
    desc('单程').findOne().click()

    // 选择始发地和目的地
    log('选择始发地')
    id('rlOrigin').findOne().click()
    id('etAirports').findOne().setText(args.ori)
    id('tvContent').findOne().click()
    sleep(1000)
    log('1')

    id('rlDestination').findOne().click()
    id('etAirports').findOne().setText(args.dest)
    log('2')
    id('tvContent').findOne().click()
    log('2')

    seletDate(true)

    search()
}

let ch_month = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
function seletDate(needClick) {
    // 选择日期
    log('seletDate, month: ' + ch_month)
    if (needClick) {
        id('tvDepartingDate').findOne().parent().clickCenter()
        log('click')
        waitForActivity('com.cathaypacific.icecalendar.CalendarActivity')
    }

    date = new Date(args.date)
    titles = id('title').find()
    log('titles: ' + titles + ', month: ' + date.getMonth())
    found = false
    for (var i = 0; i < titles.size(); i++) {
        title = titles[i]
        log('title: ' + title.text())
        month = title.text().split(' ')[0]
        log('month: ' + month)
        if (ch_month[date.getMonth()] == month) {
            log('找到目标日期')
            title.parent().findOne(text(date.getDate() + '').enabled(true)).click()
            found = true
            break
        }
    }

    if (found) {
        id('btnConfirm').findOne().click()
    } else {
        id('calendar_view').findOne().scrollDown()
        seletDate(false)
    }
}

function search() {
    // 搜索
    id('ctaBookingPanel').findOne().click()

    while (id('ctvLoadingContent').exists()) {
        sleep(200)
    }

    sleep(1000)

    if (currentActivity() == 'com.cathaypacific.mobile.module.ndcBooking.activity.SearchResultSummaryActivity') {
        push()
        log('选择航班')
        id('select_button').findOne().click()
        select()
    } else {
        log('未找到可用航班')
        text('新搜索').findOne().click()
        search()
    }
}

function select() {
    log('选择航班')
    while (id('ctvLoadingContent').exists()) {
        sleep(100)
    }
    id('btn_select_fare').findOne().click()
    waitForActivity('com.cathaypacific.mobile.module.ndcBooking.activity.NdcFlightSummaryActivity', 100)
    id('ctaFlightSummary').findOne().click()

    fillPassenger()
}

function fillPassenger() {
    // cetItemPassengerDetailEditText
    log('乘客详情')
    waitForActivity('com.cathaypacific.mobile.activities.PassengerDetailActivity')
    log('填写乘客详情')
    id('llItemPassengerDetailSelector').findOne().click()
    text('先生').findOne().click()

    log('填写其他信息')
    text('输入姓氏').findOne().setText(args.xing)
    text('输入名字和中间名').findOne().setText(args.ming)
    text('电话号码').findOne().setText(args.phone)
    text('输入电子邮件').findOne().setText(args.email)

    id('ctaNdcPaxDetails').findOne().click()
    pay()
}

function pay() {
    // id('ivPaymentOption').findOne().click()
    // id('cbAcceptTC').findOne().click()
}

function push() {
    threads.start(function () {
        let token = "0d5541a0cf2049d781a31dd6eda09deb";
        let url = "http://www.pushplus.plus/send";
        let r = http.postJson(url, {
            token: token,
            topic: 'cp',
            title: "新航班",
            content: '设备: ' + device.product + "\n姓名: " + args.xing + args.ming,
        })
        log(r.body.string())
    })
}
