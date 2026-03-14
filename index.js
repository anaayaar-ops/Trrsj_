process.env.WOLF_JS_IGNORE_VOICE = 'true'; // حل مشكلة wrtc نهائياً

import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814,
    gameCommand: "!او خاص 51660277 ",
    moves: ["2", "5", "8"],
    currentIndex: 0
};

const service = new WOLF();

service.on('ready', async () => {
    console.log(`✅ جاهز للعب: ${service.currentSubscriber.nickname}`);
    // بدء اللعبة
    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
});

service.on('privateMessage', async (message) => {
    if (message.sourceSubscriberId !== settings.targetBotId) return;

    const text = (message.body || "").toLowerCase();

    // 1. التحقق من انتهاء اللعبة لإعادة تصفير التسلسل
    if (text.includes("فاز") || text.includes("تعادل") || text.includes("انتهت") || text.includes("winner")) {
        console.log("🏁 انتهت الجولة، إعادة التصفير...");
        settings.currentIndex = 0;
        setTimeout(() => service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand), 5000);
        return;
    }

    // 2. التحقق من أن الدور لك (Your Turn) وليس دور الخصم (Opponent)
    // بناءً على الصورة، البوت يرسل "Opponents Turn" عندما لا يكون دورك
    // لذا سنبحث عن غياب كلمة "Opponent" أو وجود كلمة "Your Turn"
    const isMyTurn = (text.includes("your turn") || text.includes("دورك")) && !text.includes("opponents turn");

    if (isMyTurn) {
        const nextMove = settings.moves[settings.currentIndex];

        console.log(`🎯 دوري الآن! سأرسل الرقم: ${nextMove}`);

        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                
                // تحديث المؤشر للرقم التالي في المصفوفة
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
            } catch (err) {
                console.error("❌ فشل الإرسال:", err.message);
            }
        }, 1200); // تأخير بسيط لضمان استقرار البوت
    }
});

service.login(settings.identity, settings.secret);
