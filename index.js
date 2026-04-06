import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 9969, 
    minuteInterval: 62 * 1000,      // دقيقة واحدة
    boxInterval: 3 * 60 * 1000      // 3 دقائق
};

const MY_INFO = {
    nickname: "🐈‍⬛", 
    ownerId: "2481425"
};

const service = new WOLF();

// --- 1. وظيفة الأوامر التي ترسل كل دقيقة ---
const sendMinuteCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        console.log(`[${new Date().toLocaleTimeString()}] 🟢 إرسال: !مد مهام`);

        setTimeout(async () => {
            try {
                await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
                console.log(`[${new Date().toLocaleTimeString()}] 🟢 إرسال: !مد تحالف ايداع كل`);
            } catch (e) {}
        }, 5000);
    } catch (e) {}
};

// --- 2. وظيفة فتح الصندوق كل 3 دقائق ---
const sendBoxCommand = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد صندوق فتح");
        console.log(`[${new Date().toLocaleTimeString()}] 📦 إرسال: !مد صندوق فتح`);
    } catch (e) {}
};

// --- 3. نظام حل الفخاخ (نفس المنطق المصحح) ---
service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;
        const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم") && content.includes("أرسل الإجابة بصيغة تبدأ بـ !");
        const isForMe = content.includes(MY_INFO.nickname);

        if (!isTrap || !isForMe) return;

        let answer = null;
        const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'اربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
        const wordToNum = {'واحد':'1','اثنان':'2','ثلاثة':'3','اربعة':'4','خمسة':'5','ستة':'6','سبعة':'7','ثمانية':'8','تسعة':'9','عشرة':'10'};

        // تحليل الأسئلة
        if (content.includes('الصندوق') || content.includes('الصناديق') || content.includes('فئات صناديق')) {
            answer = "صح"; 
        } 
        else if (content.includes('عضوية صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        else if (content.includes('ناتج') || content.includes('؟')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('-') || content.includes('طرح') || content.includes('ناقص')) ? n1 - n2 : n1 + n2;
            }
        }
        else if (content.includes('بالكلمات') || content.includes('بالحروف')) {
            const match = content.match(/\d+/);
            if (match && numToWord[match[0]]) answer = numToWord[match[0]];
        }
        else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
            for (let word in wordToNum) { if (content.includes(word)) { answer = wordToNum[word]; break; } }
        }
        else if (content.includes('اكتب كلمة') || content.includes('كما هي')) {
            const match = content.match(/:\s*(\S+)/);
            if (match) answer = match[1];
        }
        else if (content.includes('اكتب الرقم')) {
            const match = content.match(/\d+/);
            if (match) answer = match[0];
        }

        if (answer !== null) {
            const finalResponse = `!${answer}`;
            const delay = Math.floor(Math.random() * (14000 - 8000 + 1)) + 8000;
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم حل الفخ: ${finalResponse}`);
            }, delay);
        }
    } catch (err) {}
});

// --- 4. تشغيل البوت والجدولة ---
service.on('ready', async () => {
    console.log(`✅ البوت جاهز ويعمل الآن`);
    try {
        await service.group.joinById(settings.targetGroupId);
        
        // تشغيل الأوامر لأول مرة
        sendMinuteCommands();
        sendBoxCommand();

        // ضبط التكرار الدوري
        setInterval(sendMinuteCommands, settings.minuteInterval);
        setInterval(sendBoxCommand, settings.boxInterval);
        
    } catch (e) { console.error("❌ خطأ في الاتصال:", e.message); }
});

service.login(settings.identity, settings.secret);
