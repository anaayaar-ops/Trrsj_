process.env.WOLF_JS_IGNORE_VOICE = 'true'; 

import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814,
    gameCommand: "!او خاص 51660277", // أو الأمر الخاص بالبوت المساعد
    moves: ["2", "5", "8"], // أو ["1", "3", "7"] للمساعد
    currentIndex: 0,
    isRunning: true,
    isWaiting: false, // القفل لمنع التكرار
    workDuration: 52 * 60 * 1000,
    restDuration: 8 * 60 * 1000
};

const service = new WOLF();

// نفس وظيفة manageWorkCycle السابقة...
const manageWorkCycle = () => {
    if (settings.isRunning) {
        setTimeout(() => {
            settings.isRunning = false;
            manageWorkCycle();
        }, settings.workDuration);
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

    const text = (message.body || "").toLowerCase();

    // رصد انتهاء اللعبة وتصفير القفل والمؤشر
    if (text.includes("won") || text.includes("lost") || text.includes("draw") || text.includes("انتهت")) {
        settings.currentIndex = 0;
        settings.isWaiting = false; // فك القفل للجولة الجديدة
        setTimeout(() => {
            if (settings.isRunning) service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
        }, 5000);
        return;
    }

    // التحقق من الدور مع فحص القفل (isWaiting)
    const isMyTurn = (text.includes("your turn") || text.includes("دورك")) && !text.includes("opponent");

    if (isMyTurn && !settings.isWaiting) {
        settings.isWaiting = true; // تفعيل القفل فوراً
        const nextMove = settings.moves[settings.currentIndex];

        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                console.log(`🕹️ لعبت: ${nextMove}`);
                
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
                
                // نترك القفل مفعلاً لثانية إضافية لضمان عدم الرد على نفس الرسالة مرة أخرى
                setTimeout(() => { settings.isWaiting = false; }, 2000); 
            } catch (err) {
                settings.isWaiting = false; // فك القفل في حال فشل الإرسال للمحاولة ثانية
                console.error("❌ خطأ:", err.message);
            }
        }, 1000);
    }
});

service.login(settings.identity, settings.secret);
