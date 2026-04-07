import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 224, 
    minuteInterval: 62 * 1000,      // دقيقة (مهام + إيداع)
    boxInterval: 3 * 60 * 1000      // 3 دقائق (فتح صندوق)
};

const MY_INFO = {
    nickname: "🐈‍⬛", // اسمك البرمجي
    ownerId: "2481425"
};

const service = new WOLF();

// --- 1. الأوامر المجدولة ---
const sendMinuteCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        setTimeout(async () => {
            await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
        }, 3000); // فاصل بسيط بين الأمرين
    } catch (e) {}
};

const sendBoxCommand = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد صندوق فتح");
    } catch (e) {}
};

// --- 2. نظام حل الفخاخ الذكي ---
service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;
        const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم") && content.includes("أرسل الإجابة بصيغة تبدأ بـ !");
        
        // فحص الاسم (يدعم لقبك ولقب امل الذي ظهر في الصور)
        const isForMe = content.includes(MY_INFO.nickname) || content.includes("امل") || content.includes("🌟");

        if (!isTrap || !isForMe) return;

        let answer = null;
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = {'واحد':'1','اثنان':'2','ثلاثة':'3','أربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

        console.log(`⚠️ فخ مكتشف.. جاري التحليل...`);

        // أ) الأولوية القصوى: أي سؤال يحتوي على "صح أم خطأ" أو "صح او خطأ"
        if (content.includes('صح أم خطأ') || content.includes('صح او خطأ') || content.includes('صح أو خطأ')) {
            answer = "صح"; 
        } 
        // ب) المقارنة (أكبر / أصغر)
        else if (content.includes('أيهما') || content.includes('ايهما')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('أكبر') || content.includes('اكبر')) ? Math.max(n1, n2) : Math.min(n1, n2);
            }
        } 
        // ج) الحساب (جمع / طرح)
        else if (content.includes('ناتج') || content.includes('؟')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('-') || content.includes('طرح') || content.includes('ناقص')) ? n1 - n2 : n1 + n2;
            }
        }
        // د) عضوية صاحب البوت
        else if (content.includes('صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        // هـ) تحويل الكلمات والأرقام
        else if (content.includes('بالكلمات') || content.includes('بالحروف')) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
            for (let word in wordToNum) { if (content.includes(word)) { answer = wordToNum[word]; break; } }
        }
        // و) اكتب الكلمة كما هي
        else if (content.includes('اكتب كلمة') || content.includes('اكتب كلمة :') || content.includes('كما هي')) {
            const match = content.match(/:\s*(\S+)/) || content.match(/هي\s+(\S+)/);
            if (match) answer = match[1];
        }

        // إرسال الإجابة
        if (answer !== null) {
            const finalResponse = `!${answer}`;
            const delay = 5000; // تأخير 5 ثوانٍ ثابتة كما طلبت

            setTimeout(async () => {
                try {
                    await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                    console.log(`✅ تم الرد بـ: ${finalResponse}`);
                } catch (err) {}
            }, delay);
        }
    } catch (err) {}
});

// --- 3. بدء التشغيل ---
service.on('ready', async () => {
    console.log(`✅ البوت متصل وجاهز`);
    try {
        await service.group.joinById(settings.targetGroupId);
        
        // تنفيذ الأوامر المجدولة
        sendMinuteCommands();
        sendBoxCommand();
        setInterval(sendMinuteCommands, settings.minuteInterval);
        setInterval(sendBoxCommand, settings.boxInterval);
    } catch (e) {}
});

service.login(settings.identity, settings.secret);
