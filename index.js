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
    console.log(`✅ البوت نشط الآن: ${service.currentSubscriber.nickname}`);
    service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
    manageWorkCycle();
});

service.on('privateMessage', async (message) => {
    if (!settings.isRunning || message.sourceSubscriberId !== settings.targetBotId) return;

    // تجميع كل البيانات الممكنة من الرسالة (النص، المحتوى، والـ Embed)
    const body = (message.body || "").toLowerCase();
    const content = (message.content || "").toLowerCase();
    const embedData = message.embeds ? JSON.stringify(message.embeds).toLowerCase() : "";
    const allData = body + content + embedData;

    // 1. إعادة الطلب عند الفوز أو الخسارة فوراً
    if (allData.includes("won") || allData.includes("lost") || allData.includes("draw") || allData.includes("انتهت")) {
        settings.currentIndex = 0;
        settings.isWaiting = false;
        console.log("🏁 انتهت اللعبة، سأعيد الطلب خلال 5 ثوانٍ...");
        setTimeout(() => {
            if (settings.isRunning) service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
        }, 5000);
        return;
    }

    // 2. التفاعل الفوري مع اللوحة (Your Turn)
    // أضفنا فحص وجود المربعات ⬜ ليعرف أنها لوحة لعب حتى لو لم يقرأ النص
    const isBoardPresent = allData.includes("⬜") || allData.includes("1") || allData.includes("2");
    const isMyTurn = (allData.includes("your turn") || allData.includes("دورك")) && !allData.includes("opponent");

    // سيتفاعل إذا رأى "دورك" أو إذا كانت اللوحة موجودة وهو ليس دور الخصم
    if ((isMyTurn || (isBoardPresent && !allData.includes("opponent"))) && !settings.isWaiting) {
        
        settings.isWaiting = true; 
        const nextMove = settings.moves[settings.currentIndex];

        console.log(`🚀 تفاعل فوري! إرسال الرقم: ${nextMove}`);

        // تقليل التأخير ليكون الرد سريعاً جداً (0.5 ثانية فقط)
        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
                
                // القفل لثانية واحدة فقط لمنع التكرار مع السماح بالسرعة
                setTimeout(() => { settings.isWaiting = false; }, 1500); 
            } catch (err) {
                settings.isWaiting = false;
                console.error("❌ فشل الإرسال:", err.message);
            }
        }, 500); 
    }
});

service.login(settings.identity, settings.secret);
