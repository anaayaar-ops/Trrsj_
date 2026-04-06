import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

/** * --- 1. الإعدادات والبيانات الشخصية ---
 */
const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969,           // رقم الغرفة
    intervalDuration: 62 * 1000   // تكرار الدورة كل 62 ثانية
};

const MY_INFO = {
    nickname: "  ",         // اسمك كما يظهر في الفخ
    botName: "᷂فزآعنا²³⁰",       // اسم البوت الذي يرسل الفخاخ
    ownerId: "2481425"            // رقم عضوية صاحب البوت
};

const service = new WOLF();

/**
 * --- 2. وظيفة إرسال الأوامر التلقائية ---
 */
const sendCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        console.log(`[${new Date().toLocaleTimeString()}] ✅ تم إرسال: !مد مهام`);

        setTimeout(async () => {
            try {
                await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
                console.log(`[${new Date().toLocaleTimeString()}] ✅ تم إرسال: !مد تحالف ايداع كل`);
            } catch (err) {
                console.error("❌ فشل إرسال الأمر الثاني:", err.message);
            }
        }, 5000); // فاصل 5 ثوانٍ

    } catch (err) {
        console.error("❌ فشل إرسال الأمر الأول:", err.message);
    }
};

/**
 * --- 3. نظام معالجة الفخاخ (الرد الذكي بالاسم) ---
 */
service.on('groupMessage', async (message) => {
    try {
        // جلب بيانات مرسل الرسالة للتحقق من اسمه
        const sender = await service.subscriber.getById(message.subscriberId);
        const senderName = sender.nickname;

        // التحقق: هل الرسالة من "بوت المدينة"؟ وهل اسمك في أول سطر؟ وفي الغرفة الصحيحة؟
        const isFromMedBot = senderName.includes(MY_INFO.botName);
        const firstLine = message.body.split('\n')[0];
        const isTargetingMe = firstLine.includes(MY_INFO.nickname);
        const isInRightGroup = message.targetGroupId === settings.targetGroupId;

        if (!isInRightGroup || !isFromMedBot || !isTargetingMe) return;

        const content = message.body;
        let answer = null;

        // قواميس التحويل
        const numToWord = {
            '1':'واحد', '2':'اثنان', '3':'ثلاثة', '4':'أربعة', '5':'خمسة',
            '6':'ستة', '7':'سبعة', '8':'ثمانية', '9':'تسعة', '10':'عشرة'
        };
        const wordToNum = Object.fromEntries(Object.entries(numToWord).map(([k, v]) => [v, k]));

        console.log(`⚠️ فخ مكتشف من [${senderName}] موجه لك... جاري التحليل.`);

        // --- منطق استخراج الإجابة ---
        
        // 1. تحويل رقم لـ كلمات
        if (content.includes('بالكلمات')) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        // 2. تحويل كلمات لـ أرقام
        else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
            for (let word in wordToNum) {
                if (content.includes(word)) { answer = wordToNum[word]; break; }
            }
        }
        // 3. حسابات وأكبر
        else if (content.includes('ناتج') || content.includes('أيهما أكبر')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                answer = content.includes('أكبر') ? Math.max(parseInt(nums[0]), parseInt(nums[1])) : (parseInt(nums[0]) + parseInt(nums[1]));
            }
        }
        // 4. صناديق وعضوية
        else if (content.includes('الصناديق') || content.includes('الصندوق')) {
            answer = "صح";
        } else if (content.includes('صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        // 5. اكتب كما هي أو اكتب الرقم
        else if (content.includes('اكتب الكلمة كما هي')) {
            const match = content.match(/كما هي:\s*(\S+)/);
            if (match) answer = match[1];
        } else if (content.includes('اكتب الرقم')) {
            const match = content.match(/\d+/);
            if (match) answer = match[0];
        }

        // إرسال الرد
        if (answer !== null) {
            const finalResponse = `!${answer}`;
            const delay = Math.floor(Math.random() * (13000 - 6000 + 1)) + 6000;

            setTimeout(async () => {
                try {
                    await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                    console.log(`🎯 تم الرد على الفخ: ${finalResponse}`);
                } catch (err) { console.error("❌ فشل رد الفخ:", err.message); }
            }, delay);
        }
    } catch (err) {
        // تجاهل الأخطاء البسيطة في جلب بيانات المستخدمين
    }
});

/**
 * --- 4. بدء التشغيل ---
 */
service.on('ready', async () => {
    console.log(`✅ البوت متصل باسم: ${service.currentSubscriber.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        await sendCommands();
        setInterval(sendCommands, settings.intervalDuration);
    } catch (err) { console.error("❌ خطأ بالبداية:", err.message); }
});

service.login(settings.identity, settings.secret);
