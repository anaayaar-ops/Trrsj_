process.env.WOLF_JS_IGNORE_VOICE = 'true'; 

import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814, // بوت الألعاب الذي تصله الرسائل
    targetPlayerId: 51660277, // العضوية التي تريد اللعب معها
    gameCommand: "!او خاص 51660277", // الأمر الكامل كما طلبته
    moves: ["2", "5", "8"],
    currentIndex: 0
};

const service = new WOLF();

service.on('ready', async () => {
    console.log(`✅ البوت متصل: ${service.currentSubscriber.nickname}`);
    // بدء اللعبة لأول مرة
    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
});

service.on('privateMessage', async (message) => {
    // التفاعل فقط مع رسائل بوت الألعاب
    if (message.sourceSubscriberId !== settings.targetBotId) return;

    const text = (message.body || "").toLowerCase();

    // 1. رصد حالة انتهاء اللعبة (فوز، خسارة، تعادل)
    const gameEnded = text.includes("won") || 
                      text.includes("lost") || 
                      text.includes("draw") || 
                      text.includes("فاز") || 
                      text.includes("خسر") || 
                      text.includes("تعادل") ||
                      text.includes("انتهت");

    if (gameEnded) {
        console.log("🏁 انتهت اللعبة. جاري إعادة إرسال أمر اللعب...");
        settings.currentIndex = 0; // إعادة تصفير الحركات (2-5-8)
        
        // الانتظار 5 ثواني ثم إرسال الأمر الجديد
        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
                console.log(`🚀 تم إرسال: ${settings.gameCommand}`);
            } catch (err) {
                console.error("❌ فشل إعادة الطلب:", err.message);
            }
        }, 5000);
        return;
    }

    // 2. التحقق من أن الدور لك (Your Turn) لإرسال الحركة التالية
    const isMyTurn = text.includes("your turn") || (text.includes("دورك") && !text.includes("opponent"));

    if (isMyTurn) {
        const nextMove = settings.moves[settings.currentIndex];

        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                console.log(`🕹️ لعبت الرقم: ${nextMove}`);
                
                // الانتقال للرقم التالي في التسلسل
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
            } catch (err) {
                console.error("❌ فشل إرسال الحركة:", err.message);
            }
        }, 1500);
    }
});

service.login(settings.identity, settings.secret);
