// באנר עמיד בפני כל בעיית caching/logging - אם השורה הזו לא מופיעה בלוג
// הריצה, זו הוכחה חד-משמעית שה-container לא מריץ את הקובץ הזה בכלל.
process.stdout.write('BOOT-MARKER build-fix-2026-08-24-v2: index.js loaded\n');

// לוכדים כל שגיאה לא-מטופלת עם stack trace מלא, כדי שלא נאבד מידע אם
// client.initialize() נכשל בצורה לא צפויה.
process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

// --- חייב לרוץ לפני כל require של puppeteer/whatsapp-web.js! ---
// Puppeteer קורא את PUPPETEER_EXECUTABLE_PATH פעם אחת בלבד, ברגע ה-require,
// ושומר את זה בזיכרון פנימי לכל שאר חיי התהליך. אם המשתנה הזה מוגדר ב-Railway
// לערך שגוי (למשל משאריות ניסיון תיקון קודם), שום שינוי קוד אחרי ה-require
// לא יעזור - הערך הפגום כבר "נאפה" פנימית. חובה לנקות אותו כאן, לפני השורה
// הבאה, לפני שהוא נטען כלל (require('whatsapp-web.js') בעצמו כבר עושה
// require('puppeteer') פנימית).
const fs = require('fs');
{
    const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (envPath !== undefined) {
        console.log(`PUPPETEER_EXECUTABLE_PATH is set. type=${typeof envPath} value=${JSON.stringify(envPath)}`);
        if (typeof envPath === 'string' && envPath.length > 0 && fs.existsSync(envPath)) {
            console.log(`✅ Using browser from PUPPETEER_EXECUTABLE_PATH: ${envPath}`);
        } else {
            console.error(`⚠️ PUPPETEER_EXECUTABLE_PATH is set but invalid (not a real, existing file path) - ignoring it. Please remove this variable from Railway's environment settings, it should not be needed.`);
            delete process.env.PUPPETEER_EXECUTABLE_PATH;
        }
    }
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const { MessageMedia } = require('whatsapp-web.js');
const express = require('express');

// נתיב הדפדפן נקבע כאן במפורש, עם בדיקת תקינות ולוג ברור - כדי שאם משהו
// עדיין ישתבש, נראה בדיוק איזה ערך ומאיזה סוג התקבל, במקום שגיאה עמומה.
function resolveChromeExecutablePath() {
    const computed = puppeteer.executablePath();
    console.log(`Puppeteer computed executablePath: type=${typeof computed} value=${JSON.stringify(computed)}`);

    if (typeof computed !== 'string' || computed.length === 0) {
        throw new Error(`puppeteer.executablePath() did not return a valid string (got type=${typeof computed}, value=${JSON.stringify(computed)}). Refusing to start with an invalid browser path.`);
    }
    if (!fs.existsSync(computed)) {
        console.error(`⚠️ Computed executablePath does not exist on disk: ${computed}. Make sure the build step (npx puppeteer browsers install chrome) ran successfully and .puppeteerrc.cjs's cacheDirectory matches between build and runtime.`);
    } else {
        console.log(`✅ Chrome found at: ${computed}`);
    }
    return computed;
}

// אתחול הלקוח עם הגדרות מיוחדות עבור השרת של Railway
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: resolveChromeExecutablePath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

// יצירת תמונת QR ברגע שהמערכת מוכנה
client.on('qr', async (qr) => {
    try {
        await QRCode.toFile('./qr.png', qr);
        console.log('קובץ תמונה בשם qr.png נוצר בהצלחה!');
    } catch (err) {
        console.error('שגיאה ביצירת קובץ ה-QR:', err);
    }
});

client.on('ready', () => {
    console.log('הוואטסאפ של לעוף על המרפסת מחובר ומוכן! 🌿');
});

// הקשבה להודעות נכנסות ומענה חכם
client.on('message', async message => {
    const text = message.body;

    // הדפסת ההודעה בטרמינל כדי לראות שהיא התקבלה בזמן אמת
    console.log('התקבלה הודעה חדשה:', text);

    // 1. בדיקה אם הלקוח שואל על הסדנאות הרגילות
    if (text.includes('סדנה') || text.includes('סדנאות') || text.includes('איך זה עובד')) {
        
        const responseText = `היי! איזה כיף שאתה מתעניין בסדנאות הבטון של 'לעוף על המרפסת'! 🌿

הרבה אנשים שואלים אותנו איך מספיקים ליצור תוצר מושלם בשעתיים וחצי. הקסם הוא שבמהלך הסדנה אתם גם מתנסים בשלב היציקה, וגם מקבלים מוצרים מוכנים מראש שעברו את כל שלבי הייבוש המקצועיים כדי שיחזיקו מעמד לשנים רבות! 🛡️

בסדנה תעצבו ותצבעו שני תוצרים מהממים לבחירתכם בעזרת מכחולים, טושים אקריליים, שבלונות וספריי לק ששומר על הצבע לאורך זמן. בסוף, נשתול בהם שילוב משגע של סוקולנטים! 🌵✨

רוצה לראות דוגמאות מתוך קרוב ל-300 היצירות באתר שלנו ולהירשם? 
כנס לכאן: www.balconi.co.il 🔗`;

        // שליחת הטקסט של הסדנה
        await message.reply(responseText);
        
        // שליחת תמונה מספר 1 (אווירה) באופן אוטומטי
        try {
            const media1 = MessageMedia.fromFilePath('./pic1.png');
            await client.sendMessage(message.from, media1);
            console.log('הבוט ענה על סדנה ושלח את תמונה 1 בהצלחה! 📸');
        } catch (error) {
            console.error('שגיאה בשליחת תמונה 1:', error);
        }
    }

    // 2. בדיקה אם הלקוח שואל על אירוע חברה, יום גיבוש או הצעת מחיר לקבוצה
    if (text.includes('אירוע') || text.includes('גיבוש') || text.includes('חברה') || text.includes('מחיר') || text.includes('הולדת')) {
        
        const eventResponse = `מתכננים אירוע? איזה כיף! הגעתם למקום הנכון. 🌿✨
ב'לעוף על המרפסת' אנחנו מעבירים סדנאות בטון חווייתיות ויצירתיות לימי גיבוש, חברות, ימי הולדת ואירועים פרטיים. 🛠️

בסדנה כל משתתף מעצב, צובע ויוצא עם שני תוצרים מהממים: אביזר נוי מבטון ועציץ בשילוב צמחי סוקולנטים! 🌵🎨

הסדנאות שלנו מתאימות לעד 30 משתתפים אצלנו במשתלה, או לקבוצות גדולות יותר באירועי חוץ. המחירים שלנו מתחילים מ-150 ש"ח למשתתף, ואנו מתאימים את גודל ומורכבות התוצרים בהתאם לתקציב שלכם. 💰

כדי שנוכל לשלוח לכם הצעת מחיר מדויקת, נשמח אם תשיבו לנו עם הפרטים הבאים:
1. מהו סוג האירוע? 🎉
2. מהי כמות המשתתפים המשוערת? 👥
3. האם יש תאריך מועדף או תקציב מסוים שתרצו שנתחשב בו? 📅

נשמח לעוף יחד איתכם באירוע שלכם! 🌿`;

        // שליחת הטקסט של האירוע
        await message.reply(eventResponse);
        
        // שליחת תמונה מספר 2 (תוצרים מהממים) באופן אוטומטי
        try {
            const media2 = MessageMedia.fromFilePath('./pic2.png');
            await client.sendMessage(message.from, media2);
            console.log('הבוט ענה על אירוע ושלח את תמונה 2 בהצלחה! 📸');
        } catch (error) {
            console.error('שגיאה בשליחת תמונה 2:', error);
        }
    }
});

// שרת אינטרנט בסיסי כדי למנוע מ-Render לקרוס מחוסר האזנה לפורט
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('הבוט של לעוף על המרפסת פעיל באוויר! 🌿');
});

app.listen(PORT, () => {
    console.log(`שרת הרשת מאזין לפורט ${PORT}`);
});

client.initialize();
