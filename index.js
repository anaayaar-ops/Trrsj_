import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969, 
    minuteInterval: 60 * 1000,      
    boxInterval: 3 * 60 * 1000      
};

/**
 * --- ملاحظة هامة جداً ---
 * انسخ الإيموجي أو الاسم من رسالة البوت في الغرفة مباشرة 
 * وضعه هنا لضمان التطابق 100%
 */
const MY_INFO = {
    nickname: "‏​‏ ‏🐈‍⬛ 🌟"
    ownerId: "2481425"
};

const service = new WOLF();

// --- نظام الأوامر المجدولة ---
const sendMinuteCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        setTimeout(async () => {
            await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
        }, 3000);
    } catch (e) {}
};

const sendBoxCommand = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد صندوق فتح");
    } catch (e) {}
};

// --- نظام حل الفخاخ ---
service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;

        // التحقق من وجود جملة الفخ الشهيرة
        const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم");
        
        // التحقق من وجود لقبك (سواء كان نصاً أو إيموجي) داخل الرسالة
        const isForMe = content.includes(MY_INFO.nickname);

        if (!isTrap || !isForMe) return;

        console.log(`🎯 تم رصد فخ موجه لـ (${MY_INFO.nickname}) .. جاري التحضير للرد`);

        let answer = null;
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = {'واحد':'1','اثنان':'2','ثلاثة':'3','أربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

        // تحليل الأسئلة (صح أم خطأ / أكبر وأصغر / حساب)
        if (content.includes('صح أم خطأ') || content.includes('صح أو خطأ') || content.includes('الصندوق')) {
            answer = "صح"; //
        } 
        else if (content.includes('أيهما') || content.includes('ايهما')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('أكبر') || content.includes('اكبر')) ? Math.max(n1, n2) : Math.min(n1, n2);
            }
        } 
        else if (content.includes('ناتج') || content.includes('؟')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                // حل مشكلة الجمع والطرح
                answer = (content.includes('-') || content.includes('طرح')) ? n1 - n2 : n1 + n2;
            }
        }
        else if (content.includes('صاحب البوت')) {
            answer = MY_INFO.ownerId; //
        }
        else if (content.includes('اكتب كلمة') || content.includes('كما هي')) {
            const match = content.match(/:\s*(\S+)/);
            if (match) answer = match[1]; //
        }

        if (answer !== null) {
            const finalResponse = `!${answer}`;
            // تأخير 5 ثوانٍ ثابتة
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم الرد بـ: ${finalResponse}`);
            }, 5000); 
        }
    } catch (err) {}
});

service.on('ready', async () => {
    console.log(`✅ البوت يعمل وجاهز لمراقبة فخاخ: ${MY_INFO.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        sendMinuteCommands();
        sendBoxCommand();
        setInterval(sendMinuteCommands, settings.minuteInterval);
        setInterval(sendBoxCommand, settings.boxInterval);
    } catch (e) {}
});

service.login(settings.identity, settings.secret);
