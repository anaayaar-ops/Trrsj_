import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetBotId: 82727814, // تم التغيير لرقم بوت الألعاب المذكور
    gameCommand: "!او خاص 51660277", 
    moves: ["2", "5", "8"],
    currentIndex: 0
};

const service = new WOLF();

service.on('ready', async () => {
    console.log(`✅ البوت جاهز: ${service.currentSubscriber.nickname}`);
    console.log(`🎮 الهدف: البوت رقم ${settings.targetBotId}`);
    
    // إرسال طلب بدء اللعبة الأول في الخاص
    await service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
});

service.on('privateMessage', async (message) => {
    // التأكد أن الرسالة قادمة من بوت الألعاب حصراً
    if (message.sourceSubscriberId !== settings.targetBotId) return;

    const text = message.body || "";

    // رصد اللوحة (المربعات البيضاء أو علامات X و O)
    if (text.includes("⬜") || text.includes("X") || text.includes("O") || text.includes("دورك")) {
        const nextMove = settings.moves[settings.currentIndex];
        
        // تأخير بسيط جداً (نصف ثانية) لضمان استلام اللوحة كاملة قبل الرد
        setTimeout(async () => {
            try {
                await service.messaging.sendPrivateMessage(settings.targetBotId, nextMove);
                console.log(`🕹️ تم إرسال الرقم: ${nextMove}`);
                
                // الانتقال للرقم التالي في القائمة (2 -> 5 -> 8)
                settings.currentIndex = (settings.currentIndex + 1) % settings.moves.length;
            } catch (err) {
                console.error("❌ فشل في إرسال الرقم:", err.message);
            }
        }, 500); 
    }

    // إعادة التصفير عند انتهاء الجولة (فوز أو تعادل) لبدء جولة جديدة
    if (text.includes("فاز") || text.includes("تعادل") || text.includes("انتهت") || text.includes("مبروك")) {
        console.log("🏁 الجولة انتهت. العودة للرقم 2...");
        settings.currentIndex = 0;
        
        // انتظار 3 ثواني قبل طلب لعبة جديدة تلقائياً
        setTimeout(() => {
            service.messaging.sendPrivateMessage(settings.targetBotId, settings.gameCommand);
        }, 3000);
    }
});

service.login(settings.identity, settings.secret);

