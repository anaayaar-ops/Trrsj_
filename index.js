import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

/** * --- 1. الإعدادات والبيانات الشخصية ---
 */
const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969, 
    intervalDuration: 62 * 1000 
};

const MY_INFO = {
    nickname: "  ", // اسمك كما يظهر في السطر الأول من الفخ
    ownerId: "2481425"    // رقم عضوية صاحب البوت
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
            } catch (err) { console.error("❌ فشل إرسال الأمر الثاني:", err.message); }
        }, 5000);
    } catch (err) { console.error("❌ فشل إرسال الأمر الأول:", err.message); }
};

/**
 * --- 3. نظام معالجة الفخاخ (تجاوز التحقق من المرسل) ---
 */
service.on('groupMessage', async (message) => {
    try {
        // تحويل الرسالة إلى أسطر وتنظيفها من المسافات
        const lines = message.body.split('\n').map(line => line.trim());
        
        // يجب أن تحتوي الرسالة على 4 أسطر على الأقل لتكون "فخ"
        if (lines.length < 4) return;

        // المرحلة الأولى: التحقق من "بنية الفخ" (الأسطر الثابتة)
        // فحص السطر الثاني والسطر الأخير للتأكد أنها رسالة فخ رسمية
        const hasFixedText1 = lines[1].includes("لأنك لاعب مجتهد جدًا اليوم");
        const hasFixedText2 = lines[lines.length - 1].includes("أرسل الإجابة بصيغة تبدأ بـ !");

        if (!hasFixedText1 || !hasFixedText2) return;

        // المرحلة الثانية: التحقق هل اسمك موجود في السطر الأول؟
        if (!lines[0].includes(MY_INFO.nickname)) return;

        // إذا اجتازت الرسالة الشروط، نبدأ باستخراج السؤال من السطر الثالث
        const questionLine = lines[2];
        let answer = null;

        console.log(`🎯 تم اكتشاف فخ موجه لك: "${questionLine}"`);

        // قواميس التحويل
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = Object.fromEntries(Object.entries(numToWord).map(([k, v]) => [v, k]));

        // تحليل أنواع الأسئلة داخل السطر الثالث
        if (questionLine.includes('ناتج') || questionLine.includes('كم ناتج')) {
            const nums = questionLine.match(/\d+/g);
            if (nums && nums.length >= 2) answer = parseInt(nums[0]) + parseInt(nums[1]);
        } 
        else if (questionLine.includes('أيهما أكبر')) {
            const nums = questionLine.match(/\d+/g);
            if (nums && nums.length >= 2) answer = Math.max(parseInt(nums[0]), parseInt(nums[1]));
        }
        else if (questionLine.includes('بالكلمات')) {
            const match = questionLine.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        else if (questionLine.includes('بالأرقام') || questionLine.includes('بالارقام')) {
            for (let word in wordToNum) { if (questionLine.includes(word)) { answer = wordToNum[word]; break; } }
        }
        else if (questionLine.includes('الصناديق') || questionLine.includes('الصندوق')) {
            answer = "صح";
        }
        else if (questionLine.includes('صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        else if (questionLine.includes('اكتب الكلمة كما هي')) {
            const match = questionLine.match(/كما هي:\s*(\S+)/);
            if (match) answer = match[1];
        }
        else if (questionLine.includes('اكتب الرقم')) {
            const match = questionLine.match(/\d+/);
            if (match) answer = match[0];
        }

        // إرسال الرد النهائي
        if (answer !== null) {
            const finalResponse = `!${answer}`;
            // تأخير عشوائي بين 7 و 13 ثانية (للتخفي)
            const delay = Math.floor(Math.random() * (13000 - 7000 + 1)) + 7000;

            setTimeout(async () => {
                try {
                    await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                    console.log(`✅ تم حل الفخ: ${finalResponse}`);
                } catch (err) { console.error("❌ فشل الرد:", err.message); }
            }, delay);
        }

    } catch (err) {
        // خطأ بسيط في القراءة، يتم تجاهله للاستمرار
    }
});

/**
 * --- 4. بدء التشغيل ---
 */
service.on('ready', async () => {
    console.log(`✅ البوت متصل ومستعد. اسم الحساب: ${service.currentSubscriber.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        await sendCommands();
        setInterval(sendCommands, settings.intervalDuration);
    } catch (err) { console.error("❌ خطأ:", err.message); }
});

service.login(settings.identity, settings.secret);
