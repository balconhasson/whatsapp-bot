const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const fs = require('fs');
const { MessageMedia } = require('whatsapp-web.js');
const express = require('express');

// אתחול הלקוח עם הגדרות מיוחדות עבור השרת של Railway
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: puppeteer.executablePath(),
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
