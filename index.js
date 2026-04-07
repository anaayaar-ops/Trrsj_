import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    targetGroupId: 224, 
    minuteInterval: 62 * 1000,
    boxInterval: 3 * 60 * 1000
};

const MY_INFO = {
    emoji1: "🐈‍⬛",       // الإيموجي الأول المطلوب
    emoji2: "🌟",         // الإيموجي الثاني المطلوب
    excludedKeyword: "فزآعنا", // الكلمة التي سيتم تجاهلها تماماً
    ownerId: "2481425"
};

const service = new WOLF();

// --- 1. الأوامر التلقائية ---
const sendAutoCommands = async (cmd) => {
    try { await service.messaging.sendGroupMessage(settings.targetGroupId, cmd); } catch (e) {}
};

// --- 2. المحرك الذكي لحل الفخاخ ---
service.on('groupMessage', async (message) => {
    try {
        if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

        const content = message.body;
        if (!content.includes("لأنك لاعب مجتهد جدًا اليوم")) return;

        /**
         * التحقق المحدث:
         * 1. يجب أن تحتوي الرسالة على القطة والنجمة.
         * 2. يجب ألا تحتوي الرسالة على كلمة "فزآعنا".
         */
        const isTargetEmoji = content.includes(MY_INFO.emoji1) && content.includes(MY_INFO.emoji2);
        const hasExcludedWord = content.includes(MY_INFO.excludedKeyword);

        if (!isTargetEmoji || hasExcludedWord) {
            console.log("⏭️ تم تجاهل الفخ (إما لا يحتوي على الإيموجيات المطلوبة أو يخص حساب 'فزآعنا').");
            return;
        }

        console.log("🎯 فخ موجه لحساب الإيموجيات، جاري استخراج الإجابة...");
        let answer = null;

        // أ) سؤال عضوية المالك
        if (content.includes('عضوية مالك البوت') || content.includes('عضوية صاحب البوت')) {
            answer = MY_INFO.ownerId;
        }
        // ب) أسئلة صح أم خطأ (التحالف، الصناديق)
        else if (content.includes('صح أم خطأ') || content.includes('صح أو خطأ') || content.includes('التحالف') || content.includes('الصناديق')) {
            answer = "صح";
        }
        // ج) المقارنة (أكبر / أصغر)
        else if (content.includes('أيهما') || content.includes('ايهما')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('أكبر') || content.includes('اكبر')) ? Math.max(n1, n2) : Math.min(n1, n2);
            }
        }
        // د) العمليات الحسابية
        else if (content.includes('ناتج') || content.includes('+') || content.includes('-')) {
            const nums = content.match(/\d+/g);
            if (nums && nums.length >= 2) {
                const n1 = parseInt(nums[0]), n2 = parseInt(nums[1]);
                answer = (content.includes('-') || content.includes('طرح') || content.includes('ناقص')) ? n1 - n2 : n1 + n2;
            }
        }
        // هـ) اكتب الكلمة كما هي
        else if (content.includes('اكتب كلمة') || content.includes('كما هي')) {
            const match = content.match(/:\s*(\S+)/) || content.match(/هي\s+(\S+)/);
            if (match) answer = match[1];
        }

        // إرسال الرد بعد 5 ثوانٍ فقط
        if (answer !== null) {
            const finalResponse = `!${answer}`;
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم الرد بـ: ${finalResponse}`);
            }, 5000); 
        }
    } catch (err) {}
});

// --- 3. التشغيل والجدولة ---
service.on('ready', async () => {
    console.log(`✅ البوت متصل ومراقب للإيموجيات: ${MY_INFO.emoji1} ${MY_INFO.emoji2}`);
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
