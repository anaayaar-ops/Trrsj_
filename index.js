process.env.WOLF_JS_IGNORE_VOICE = 'true'; 

import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814,
    targetPlayerId: 51660277,
    gameCommand: "!او خاص 51660277",
    moves: ["2", "5", "8"],
    currentIndex: 0,
    isRunning: true, 
    workDuration: 52 * 60 * 1000, 
    restDuration: 8 * 60 * 1000   
};

const service = new WOLF();

const manageWorkCycle = () => {
    if (settings.isRunning) {
        setTimeout(() => {
            settings.isRunning = false;
            console.log("⏸️ بدأت فترة الراحة (8 دقائق)... البوت متوقف الآن.");
            manageWorkCycle();
        }, settings.workDuration);
    } else {
        setTimeout(() => {
            settings.isRunning = true;
            console.log("🚀 انتهت الاستراحة! العودة للعمل.");
            service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
            manageWorkCycle();
        }, settings.restDuration);
    }
};

service.on('ready', async () => {
    console.log(`✅ البوت متصل: ${service.currentSubscriber.nickname}`);
    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
    manageWorkCycle();
});

service.on('privateMessage', async (message) => {
    if (!settings.isRunning) return;
    if (message.sourceSubscriberId !== settings.targetBotId) return;

    const text = (message.body || "").toLowerCase();

    // 1. رصد رسائل انتهاء الوقت أو الانسحاب (Forfeited) وإعادة الطلب
    const isForfeited = text.includes("forfeited") || text.includes("failed to chose") || text.includes("failed to pick");

    // 2. رصد حالة انتهاء اللعبة الطبيعية
    const gameEnded = text.includes("won") || text.includes("lost") || text.includes("draw") || 
                      text.includes("فاز") || text.includes("خسر") || text.includes("تعادل") || text.includes("انتهت");

    if (gameEnded || isForfeited) {
        settings.currentIndex = 0;
        console.log("🏁 انتهت الجولة أو حدث انسحاب. الانتظار 5 ثوانٍ قبل الطلب الجديد...");
        
        setTimeout(async () => {
            if (settings.isRunning) {
                try {
                    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
                    console.log(`🔄 إعادة طلب اللعبة...`);
                } catch (err) {
                    console.error("❌ فشل إعادة الطلب:", err.message);
                }
            }
        }, 5000); // الانتظار 5 ثوانٍ
        return;
    }

    // 3. رصد الدور (Your Turn)
    const isMyTurn = text.includes("your turn") || (text.includes("دورك") && !text.includes("opponent"));

    if (isMyTurn) {
        const nextMove = settings.moves[settings.currentIndex];

        setTimeout(async () => {
            if (settings.isRunning) {
                try {
                    await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                    console.log(`🕹️ لعبت الرقم: ${nextMove}`);
                    settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
                } catch (err) {
                    console.error("❌ فشل إرسال الحركة:", err.message);
                }
            }
        }, 1500);
    }
});

service.login(settings.identity, settings.secret);
