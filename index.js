import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 224, 
    minuteInterval: 62 * 1000,      // دقيقة واحدة لـ (مهام + إيداع)
    boxInterval: 3 * 60 * 1000      // 3 دقائق لـ (فتح صندوق)
};

const MY_INFO = {
    nickname: "🐈‍⬛", // تأكد من مطابقة اسمك في الغرفة (امل 🌟 أو فزاعنا)
    ownerId: "2481425"
};

const service = new WOLF();

// --- نظام الأوامر التلقائية ---
const sendMinuteCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        setTimeout(async () => {
            await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
        }, 5000);
    } catch (e) {}
};

const sendBoxCommand = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد صندوق فتح");
    } catch (e) {}
};

// --- نظام حل الفخاخ مع المقارنة الذكية ---
service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;
        const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم") && content.includes("أرسل الإجابة بصيغة تبدأ بـ !");
        
        // التحقق من اسمك (يدعم اللقبين لضمان الرد)
        const isForMe = content.includes(MY_INFO.nickname) || content.includes("امل") || content.includes("فزآعنا");

        if (!isTrap || !isForMe) return;

        let answer = null;
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = {'واحد':'1','اثنان':'2','ثلاثة':'3','أربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

        // 1. منطق المقارنة (أكبر / أصغر)
        if (content.includes('أيهما') || content.includes('ايهما')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                if (content.includes('أكبر') || content.includes('اكبر')) {
                    answer = Math.max(n1, n2); // اختيار الرقم الأكبر
                } else if (content.includes('أصغر') || content.includes('اصغر')) {
                    answer = Math.min(n1, n2); // اختيار الرقم الأصغر
                }
            }
        } 
        // 2. العمليات الحسابية
        else if (content.includes('ناتج') || content.includes('؟')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('-') || content.includes('طرح') || content.includes('ناقص')) ? n1 - n2 : n1 + n2;
            }
        }
        // 3. أسئلة الصناديق وعضوية المالك
        else if (content.includes('الصندوق') || content.includes('الصناديق')) {
            answer = "صح"; 
        } else if (content.includes('عضوية صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        // 4. تحويل الأرقام والكلمات
        else if (content.includes('بالكلمات') || content.includes('بالحروف')) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
            for (let word in wordToNum) { if (content.includes(word)) { answer = wordToNum[word]; break; } }
        }
        // 5. اكتب الكلمة كما هي
        else if (content.includes('اكتب كلمة') || content.includes('كما هي')) {
            const match = content.match(/:\s*(\S+)/);
            if (match) answer = match[1];
        }

        if (answer !== null) {
            const finalResponse = `!${answer}`;
            // تأخير بشري عشوائي
            const delay = 5000; // تأخير 5 ثوانٍ ثابتة

            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم حل الفخ (${answer})`);
            }, delay);
        }
    } catch (err) {}
});

// --- الجدولة والتشغيل ---
service.on('ready', async () => {
    console.log(`✅ البوت متصل بنجاح`);
    try {
        await service.group.joinById(settings.targetGroupId);
        sendMinuteCommands();
        sendBoxCommand();
        setInterval(sendMinuteCommands, settings.minuteInterval);
        setInterval(sendBoxCommand, settings.boxInterval);
    } catch (e) {}
});

service.login(settings.identity, settings.secret);
