import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 224, 
    minuteInterval: 302 * 1000,
    boxInterval: 5 * 60 * 1000
};

const MY_INFO = {
    emoji1: "🐈‍⬛", 
    emoji2: "🌟",
    ignoreKeyword: "فزآعنا", // استبعاد الحساب الآخر
    ownerId: "2481425"     //
};

// الخرائط اللازمة للتحويل
const numToWord = {'0':'صفر','1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
const wordToNum = {'صفر':'0','واحد':'1','اثنان':'2','ثلاثة':'3','أربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

const service = new WOLF();

const sendAutoCommands = async (cmd) => {
    try { await service.messaging.sendGroupMessage(settings.targetGroupId, cmd); } catch (e) {}
};

service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;
        if (!content.includes("لأنك لاعب مجتهد جدًا اليوم")) return;

        /**
         * المنطق المحدث حسب طلبك:
         * 1. يجب وجود القطة "و" النجمة معاً (AND).
         * 2. يجب عدم وجود كلمة "فزآعنا" (NOT).
         */
        const hasBothEmojis = content.includes(MY_INFO.emoji1) && content.includes(MY_INFO.emoji2);
        const isExcluded = content.includes(MY_INFO.ignoreKeyword);

        if (!hasBothEmojis || isExcluded) {
            console.log("⏭️ تجاهل: الفخ لا يحتوي على الإيموجيين معاً أو يخص حساب فزآعنا.");
            return;
        }

        console.log("🎯 فخ موجه لك (🐈‍⬛ + 🌟)، جاري استخراج الإجابة...");
        let answer = null;

        // 1. عضوية المالك
        if (content.includes('عضوية')) {
            answer = MY_INFO.ownerId;
        }
        // 2. تحويل الكلمات والأرقام
        else if (content.includes('بالكلمات') || content.includes('بالحروف')) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        else if (content.includes('بالأرقام')) {
            for (let word in wordToNum) {
                if (content.includes(word)) { answer = wordToNum[word]; break; }
            }
        }
        // 3. اكتب الكلمة كما هي
        else if (content.includes('اكتب') && (content.includes('كلمة') || content.includes('كما هي'))) {
            const match = content.match(/:\s*(\S+)/) || content.match(/هي\s+(\S+)/);
            if (match) answer = match[1];
        }
        // 4. صح أم خطأ
        else if (content.includes('صح أم خطأ') || content.includes('صح أو خطأ')) {
            answer = "صح";
        }
        // 5. المقارنة
        else if (content.includes('أيهما')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('أكبر')) ? Math.max(n1, n2) : Math.min(n1, n2);
            }
        }

        if (answer !== null) {
            const finalResponse = `!${answer}`;
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم الرد بـ: ${finalResponse}`);
            }, 5000); 
        }
    } catch (err) {}
});

service.on('ready', async () => {
    console.log(`✅ البوت يراقب الحساب الذي يحتوي على (🐈‍⬛ و 🌟) حصراً.`);
    try {
        await service.group.joinById(settings.targetGroupId);
        setInterval(() => {
            sendAutoCommands("!مد مهام");
            setTimeout(() => sendAutoCommands("!مد تحالف ايداع كل"), 3000);
        }, settings.minuteInterval);
        setInterval(() => sendAutoCommands("!مد صندوق فتح"), settings.boxInterval);
    } catch (e) {}
});

service.login(settings.identity, settings.secret);
