process.env.WOLF_JS_IGNORE_VOICE = 'true'; 

import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814,
    gameCommand: "!او خاص 51660277",
    moves: ["2", "5", "8"],
    currentIndex: 0,
    isRunning: true,
    isWaiting: false,
    workDuration: 52 * 60 * 1000,
    restDuration: 8 * 60 * 1000
};

const service = new WOLF();

const manageWorkCycle = () => {
    if (settings.isRunning) {
        setTimeout(() => { settings.isRunning = false; manageWorkCycle(); }, settings.workDuration);
    } else {
        setTimeout(() => { 
            settings.isRunning = true; 
            service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
            manageWorkCycle(); 
        }, settings.restDuration);
    }
};

service.on('ready', () => {
    console.log(`✅ المتصل: ${service.currentSubscriber.nickname}`);
    service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
    manageWorkCycle();
});

service.on('privateMessage', async (message) => {
    if (!settings.isRunning || message.sourceSubscriberId !== settings.targetBotId) return;

    // تحويل كل محتوى الرسالة (النص أو الوصف) لنص صغير للبحث فيه
    const text = (message.body || message.content || "").toLowerCase();
    const embedText = message.embeds ? JSON.stringify(message.embeds).toLowerCase() : "";
    const fullContent = text + embedText;

    // 1. رصد انتهاء اللعبة
    if (fullContent.includes("won") || fullContent.includes("lost") || fullContent.includes("draw") || fullContent.includes("انتهت")) {
        settings.currentIndex = 0;
        settings.isWaiting = false;
        setTimeout(() => {
            if (settings.isRunning) service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
        }, 5000);
        return;
    }

    // 2. التحقق من الدور (جعلنا الشرط أسهل لضمان الاستجابة)
    // سيبحث عن كلمة turn أو seconds (بسبب رسالة الـ 15 ثانية) أو دورك
    const hasTurnIndicator = fullContent.includes("turn") || fullContent.includes("seconds") || fullContent.includes("دورك");
    const isNotOpponent = !fullContent.includes("opponents turn");

    if (hasTurnIndicator && isNotOpponent && !settings.isWaiting) {
        settings.isWaiting = true;
        const nextMove = settings.moves[settings.currentIndex];

        console.log(`🎯 تم رصد الدور. إرسال الرقم: ${nextMove}`);

        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
                
                // فك القفل بعد فترة بسيطة للسماح بالحركة التالية
                setTimeout(() => { settings.isWaiting = false; }, 3000); 
            } catch (err) {
                settings.isWaiting = false;
                console.error("❌ خطأ إرسال:", err.message);
            }
        }, 1000);
    }
});

service.login(settings.identity, settings.secret);
