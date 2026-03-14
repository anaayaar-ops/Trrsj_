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
            console.log("⏸️ بدأت فترة الراحة (8 دقائق)...");
            manageWorkCycle();
        }, settings.workDuration);
    } else {
        setTimeout(() => {
            settings.isRunning = true;
            console.log("🚀 العودة للعمل لـ 52 دقيقة.");
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

    // دمج محتوى الرسالة والـ Embed لضمان القراءة الصحيحة
    const body = (message.body || "").toLowerCase();
    const embedData = message.embeds ? JSON.stringify(message.embeds).toLowerCase() : "";
    const allData = body + embedData;

    // رصد حالة انتهاء اللعبة
    const gameEnded = allData.includes("won") || allData.includes("lost") || allData.includes("draw") || 
                      allData.includes("فاز") || allData.includes("خسر") || allData.includes("تعادل") || allData.includes("انتهت");

    if (gameEnded) {
        settings.currentIndex = 0;
        console.log("🏁 انتهت اللعبة. الانتظار 5 ثوانٍ قبل الطلب الجديد...");
        
        // ⬇️ هنا تم ضبط الانتظار لـ 5 ثواني قبل بدء قيم جديد
        setTimeout(async () => {
            if (settings.isRunning) {
                try {
                    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
                    console.log(`🔄 تم إرسال طلب لعبة جديد بعد انتظار 5 ثوانٍ.`);
                } catch (err) {
                    console.error("❌ فشل إعادة الطلب:", err.message);
                }
            }
        }, 5000); // 5000ms = 5 ثواني
        return;
    }

    // رصد الدور (Your Turn)
    const isMyTurn = (allData.includes("your turn") || allData.includes("دورك")) && !allData.includes("opponent");

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
