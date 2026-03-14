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
    // إعدادات التوقيت
    isRunning: true, // حالة البوت الحالية
    workDuration: 52 * 60 * 1000, // 52 دقيقة بالمللي ثانية
    restDuration: 8 * 60 * 1000   // 8 دقائق بالمللي ثانية
};

const service = new WOLF();

// وظيفة إدارة وقت العمل والراحة
const manageWorkCycle = () => {
    if (settings.isRunning) {
        // إذا كان يعمل، سنوقفه بعد 52 دقيقة
        setTimeout(() => {
            settings.isRunning = false;
            console.log("⏸️ بدأت فترة الراحة (8 دقائق)... البوت متوقف الآن.");
            manageWorkCycle(); // استدعاء الوظيفة لجدولة العودة للعمل
        }, settings.workDuration);
    } else {
        // إذا كان في استراحة، سنعيده للعمل بعد 8 دقائق
        setTimeout(() => {
            settings.isRunning = true;
            console.log("🚀 انتهت الاستراحة! العودة للعمل لـ 52 دقيقة.");
            // إرسال أمر بدء جديد عند العودة من الاستراحة
            service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
            manageWorkCycle(); // استدعاء الوظيفة لجدولة الاستراحة القادمة
        }, settings.restDuration);
    }
};

service.on('ready', async () => {
    console.log(`✅ البوت متصل: ${service.currentSubscriber.nickname}`);
    console.log("⏱️ نظام تجنب السبام مفعل: 52 دقيقة عمل / 8 دقائق راحة.");
    
    // بدء اللعبة لأول مرة
    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
    
    // بدء عداد الدورة (العمل والراحة)
    manageWorkCycle();
});

service.on('privateMessage', async (message) => {
    // إذا كان البوت في فترة الراحة، يتجاهل الرسائل تماماً
    if (!settings.isRunning) return;

    if (message.sourceSubscriberId !== settings.targetBotId) return;

    const text = (message.body || "").toLowerCase();

    // رصد حالة انتهاء اللعبة
    const gameEnded = text.includes("won") || text.includes("lost") || text.includes("draw") || 
                      text.includes("فاز") || text.includes("خسر") || text.includes("تعادل") || text.includes("انتهت");

    if (gameEnded) {
        settings.currentIndex = 0;
        
        setTimeout(async () => {
            // نتحقق مرة أخرى إذا كان لا يزال في وقت العمل قبل إرسال الطلب الجديد
            if (settings.isRunning) {
                try {
                    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
                    console.log(`🔄 إعادة طلب اللعبة...`);
                } catch (err) {
                    console.error("❌ فشل إعادة الطلب:", err.message);
                }
            }
        }, 5000);
        return;
    }

    // رصد الدور (Your Turn)
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
