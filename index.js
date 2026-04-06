import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

/**
 * --- 1. الإعدادات والبيانات الشخصية ---
 */
const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969,           // رقم الغرفة (القناة)
    intervalDuration: 62 * 1000   // تكرار المهام كل 62 ثانية
};

const MY_INFO = {
    nickname: "  ",         // لقبك كما يظهر في رسالة الفخ
    ownerId: "2481425"            // رقم عضوية صاحب البوت
};

const service = new WOLF();

/**
 * --- 2. وظيفة إرسال الأوامر التلقائية المزدوجة ---
 */
const sendCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        console.log(`[${new Date().toLocaleTimeString()}] ✅ تم إرسال: !مد مهام`);

        // فاصل 5 ثوانٍ بين الأمرين
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
 * --- 3. نظام حل الفخاخ الذكي (المطور والمصحح) ---
 */
service.on('groupMessage', async (message) => {
    try {
        // منع البوت من الرد على نفسه أو في غرف أخرى
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;

        // التحقق من بنية الفخ الرسمية ومن أنك أنت المستهدف
        const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم") && content.includes("أرسل الإجابة بصيغة تبدأ بـ !");
        const isForMe = content.includes(MY_INFO.nickname);

        if (!isTrap || !isForMe) return;

        let answer = null;
        
        // قواميس ثابتة للتحويل (لمنع أخطاء الدمج النصي)
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = {'واحد':'1','اثنان':'2','ثلاثة':'3','أربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

        console.log(`⚠️ فخ موجه لك مكتشف! جاري التحليل الرياضي واللفظي...`);

        // --- منطق استخراج الإجابة ---

        // أ) العمليات الحسابية (دعم الجمع والطرح)
        if (content.includes('ناتج') || content.includes('؟')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]);
                const n2 = parseInt(nums[1]);
                
                // التحقق هل العملية طرح أم جمع (حل مشكلة 10 - 7)
                if (content.includes('-') || content.includes('طرح') || content.includes('ناقص')) {
                    answer = n1 - n2;
                } else {
                    answer = n1 + n2;
                }
            }
        }

        // ب) تحويل الرقم إلى كلمات/حروف (مثال: اكتب الرقم بالحروف 7 -> !سبعة)
        if (answer === null && (content.includes('بالكلمات') || content.includes('بالحروف'))) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) {
                answer = numToWord[match[0]];
            }
        }

        // ج) تحويل الكلمات إلى أرقام (مثال: اكتب بالأرقام سبعة -> !7)
        if (answer === null && (content.includes('بالأرقام') || content.includes('بالارقام'))) {
            for (let word in wordToNum) {
                if (content.includes(word)) {
                    answer = wordToNum[word];
                    break;
                }
            }
        }

        // د) أسئلة الصناديق أو عضوية المالك
        if (answer === null) {
            if (content.includes('الصناديق') || content.includes('الصندوق')) {
                answer = "صح";
            } else if (content.includes('صاحب البوت')) {
                answer = MY_INFO.ownerId;
            } else if (content.includes('أيهما أكبر')) {
                const nums = content.match(/\d+/g);
                if (nums && nums.length >= 2) answer = Math.max(parseInt(nums[0]), parseInt(nums[1]));
            }
        }

        // هـ) اكتب الكلمة كما هي أو اكتب الرقم فقط
        if (answer === null) {
            if (content.includes('اكتب كلمة') || content.includes('كما هي')) {
                const match = content.match(/:\s*(\S+)/) || content.match(/هي\s+(\S+)/);
                if (match) answer = match[1];
            } else if (content.includes('اكتب الرقم') && !content.includes('بالكلمات')) {
                const match = content.match(/\d+/);
                if (match) answer = match[0];
            }
        }

        // --- تنفيذ الرد النهائي بصيغة !الإجابة ---
        if (answer !== null) {
            const finalResponse = `!${answer}`;
            // تأخير عشوائي بين 8 و 14 ثانية ليبدو السلوك بشرياً
            const delay = Math.floor(Math.random() * (14000 - 8000 + 1)) + 8000;

            setTimeout(async () => {
                try {
                    await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                    console.log(`🎯 تم حل الفخ بالإجابة الصحيحة: ${finalResponse}`);
                } catch (err) {
                    console.error("❌ فشل إرسال الرد:", err.message);
                }
            }, delay);
        }

    } catch (err) {
        console.error("❌ خطأ غير متوقع في معالجة الرسالة:", err.message);
    }
});

/**
 * --- 4. بدء التشغيل والاتصال ---
 */
service.on('ready', async () => {
    console.log(`✅ البوت متصل بنجاح: ${service.currentSubscriber.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        console.log(`🏠 الغرفة المستهدفة: ${settings.targetGroupId}`);
        
        // تنفيذ الدورة الأولى فوراً
        await sendCommands();
        
        // بدء الحلقة التكرارية للمهام
        setInterval(sendCommands, settings.intervalDuration);
    } catch (err) {
        console.error("❌ خطأ عند الانضمام للغرفة:", err.message);
    }
});

service.login(settings.identity, settings.secret);
