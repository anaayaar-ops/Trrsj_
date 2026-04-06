import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

/** * --- 1. الإعدادات والبيانات الشخصية ---
 * تأكد من ملء بياناتك في ملف .env أو وضعها هنا مباشرة
 */
const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969,           // رقم الغرفة (القناة)
    intervalDuration: 62 * 1000   // تكرار الدورة كل 62 ثانية
};

const MY_INFO = {
    nickname: "   ",         // اسمك كما يظهر في أول سطر من رسالة الفخ
    medBotId: 51660277 ,           // معرف بوت المدينة (مد)
    ownerId: "2481425"            // رقم عضوية صاحب البوت
};

const service = new WOLF();

/**
 * --- 2. وظيفة إرسال الأوامر التلقائية ---
 * ترسل !مد مهام ثم تنتظر 5 ثوانٍ وترسل !مد تحالف ايداع كل
 */
const sendCommands = async () => {
    try {
        // إرسال الأمر الأول
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        console.log(`[${new Date().toLocaleTimeString()}] ✅ تم إرسال: !مد مهام`);

        // الانتظار 5 ثوانٍ قبل الأمر الثاني
        setTimeout(async () => {
            try {
                await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
                console.log(`[${new Date().toLocaleTimeString()}] ✅ تم إرسال: !مد تحالف ايداع كل`);
            } catch (err) {
                console.error("❌ فشل إرسال الأمر الثاني:", err.message);
            }
        }, 5000);

    } catch (err) {
        console.error("❌ فشل إرسال الأمر الأول:", err.message);
    }
};

/**
 * --- 3. نظام معالجة الفخاخ (الرد الذكي) ---
 */
service.on('groupMessage', async (message) => {
    // التحقق من صحة الرسالة (المصدر والمستهدف)
    const isFromMed = message.subscriberId === MY_INFO.medBotId;
    const firstLine = message.body.split('\n')[0];
    const isTargetingMe = firstLine.includes(MY_INFO.nickname);
    const isInRightGroup = message.targetGroupId === settings.targetGroupId;

    if (!isInRightGroup || !isFromMed || !isTargetingMe) return;

    const content = message.body;
    let answer = null;

    // قواميس التحويل
    const numToWord = {
        '1':'واحد', '2':'اثنان', '3':'ثلاثة', '4':'أربعة', '5':'خمسة',
        '6':'ستة', '7':'سبعة', '8':'ثمانية', '9':'تسعة', '10':'عشرة'
    };
    const wordToNum = Object.fromEntries(Object.entries(numToWord).map(([k, v]) => [v, k]));

    console.log(`⚠️ فخ مكتشف! جاري تحليل السؤال...`);

    // --- منطق استخراج الإجابة ---

    // أ) تحويل الرقم إلى كلمات (مثال: اكتب الرقم بالكلمات 7)
    if (content.includes('بالكلمات')) {
        const match = content.match(/\d+/);
        if (match && numToWord[match[0]]) answer = numToWord[match[0]];
    }
    // ب) تحويل الكلمات إلى أرقام (مثال: اكتب بالأرقام سبعة)
    else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
        for (let word in wordToNum) {
            if (content.includes(word)) { answer = wordToNum[word]; break; }
        }
    }
    // ج) ناتج عملية حسابية أو أيهما أكبر
    else if (content.includes('ناتج') || content.includes('أيهما أكبر')) {
        const nums = content.match(/\d+/g);
        if (nums && nums.length >= 2) {
            answer = content.includes('أكبر') ? Math.max(parseInt(nums[0]), parseInt(nums[1])) : (parseInt(nums[0]) + parseInt(nums[1]));
        }
    }
    // د) أسئلة الصناديق أو العضوية
    else if (content.includes('الصناديق') || content.includes('الصندوق')) {
        answer = "صح";
    } else if (content.includes('صاحب البوت')) {
        answer = MY_INFO.ownerId;
    }
    // هـ) اكتب الكلمة كما هي أو اكتب الرقم فقط
    else if (content.includes('اكتب الكلمة كما هي')) {
        const match = content.match(/كما هي:\s*(\S+)/);
        if (match) answer = match[1];
    } else if (content.includes('اكتب الرقم')) {
        const match = content.match(/\d+/);
        if (match) answer = match[0];
    }

    // --- إرسال الرد النهائي ---
    if (answer !== null) {
        const finalResponse = `!${answer}`;
        // تأخير عشوائي بين 7 و 14 ثانية ليبدو بشرياً
        const delay = Math.floor(Math.random() * (14000 - 7000 + 1)) + 7000;

        setTimeout(async () => {
            try {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`🎯 تم حل الفخ بالإجابة: ${finalResponse}`);
            } catch (err) {
                console.error("❌ فشل إرسال رد الفخ:", err.message);
            }
        }, delay);
    }
});

/**
 * --- 4. بدء التشغيل والاتصال ---
 */
service.on('ready', async () => {
    console.log(`✅ البوت متصل بنجاح باسم: ${service.currentSubscriber.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        console.log(`🏠 دخلت الغرفة رقم: ${settings.targetGroupId}`);
        
        // تنفيذ الدورة الأولى فوراً
        await sendCommands();
        
        // بدء الحلقة التكرارية
        setInterval(sendCommands, settings.intervalDuration);
    } catch (err) {
        console.error("❌ خطأ عند بدء التشغيل:", err.message);
    }
});

service.login(settings.identity, settings.secret);
