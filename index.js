import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetGroupId: 9969, 
    intervalDuration: 62 * 1000 
};

const MY_INFO = {
    nickname: "  ", 
    ownerId: "2481425"
};

const service = new WOLF();

// --- نظام الأوامر التلقائية ---
const sendCommands = async () => {
    try {
        await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد مهام");
        setTimeout(async () => {
            await service.messaging.sendGroupMessage(settings.targetGroupId, "!مد تحالف ايداع كل");
        }, 5000);
    } catch (e) {}
};

// --- نظام حل الفخاخ المطور ---
service.on('groupMessage', async (message) => {
    // 1. التحقق الأساسي من المجموعة ومنع البوت من الرد على نفسه
    if (message.targetGroupId !== settings.targetGroupId || message.subscriberId === service.currentSubscriber.id) return;

    const content = message.body;

    // 2. التحقق الصارم: هل الرسالة "فخ" وهل هي موجهة لي حصراً؟
    // نبحث عن اسمك والعبارات الثابتة في كامل نص الرسالة لضمان الدقة
    const isTrap = content.includes("لأنك لاعب مجتهد جدًا اليوم") && content.includes("أرسل الإجابة بصيغة تبدأ بـ !");
    const isForMe = content.includes(MY_INFO.nickname);

    if (!isTrap || !isForMe) return;

    let answer = null;
    const numToWord = {'1':'واحد','2':'اثنان','3':'ثلاثة','4':'أربعة','5':'خمسة','6':'ستة','7':'سبعة','8':'ثمانية','9':'تسعة','10':'عشرة'};
    const wordToNum = Object.fromEntries(Object.entries(numToWord).map(([k, v]) => [v, k]));

    console.log(`⚠️ فخ موجه لك مكتشف.. جاري التحليل`);

    // 3. تحليل المحتوى بناءً على الكلمات المفتاحية في كامل الرسالة
    if (content.includes('ناتج') || content.includes('كم ناتج')) {
        const nums = content.match(/\d+/g);
        if (nums && nums.length >= 2) answer = parseInt(nums[0]) + parseInt(nums[1]);
    } 
    else if (content.includes('أيهما أكبر')) {
        const nums = content.match(/\d+/g);
        if (nums && nums.length >= 2) answer = Math.max(parseInt(nums[0]), parseInt(nums[1]));
    }
    else if (content.includes('بالكلمات')) {
        const match = content.match(/\d+/);
        if (match && numToWord[match[0]]) answer = numToWord[match[0]];
    }
    else if (content.includes('بالأرقام') || content.includes('بالارقام')) {
        for (let word in wordToNum) { if (content.includes(word)) { answer = wordToNum[word]; break; } }
    }
    else if (content.includes('الصناديق') || content.includes('الصندوق')) {
        answer = "صح";
    }
    else if (content.includes('صاحب البوت')) {
        answer = MY_INFO.ownerId;
    }
    else if (content.includes('اكتب الكلمة كما هي')) {
        // استخراج الكلمة التي تأتي بعد النقطتين
        const match = content.match(/هي:\s*(\S+)/) || content.match(/هي\s+(\S+)/);
        if (match) answer = match[1];
    }
    else if (content.includes('اكتب الرقم') && !content.includes('بالكلمات')) {
        const match = content.match(/\d+/);
        if (match) answer = match[0];
    }

    // 4. إرسال الإجابة مع تأخير بشري
    if (answer !== null) {
        const finalResponse = `!${answer}`;
        const delay = Math.floor(Math.random() * (12000 - 7000 + 1)) + 7000;

        setTimeout(async () => {
            try {
                await service.messaging.sendGroupMessage(settings.targetGroupId, finalResponse);
                console.log(`✅ تم حل الفخ: ${finalResponse}`);
            } catch (err) {}
        }, delay);
    }
});

service.on('ready', async () => {
    console.log(`✅ متصل باسم: ${service.currentSubscriber.nickname}`);
    try {
        await service.group.joinById(settings.targetGroupId);
        await sendCommands();
        setInterval(sendCommands, settings.intervalDuration);
    } catch (e) {}
});

service.login(settings.identity, settings.secret);
