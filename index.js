// Gerekli kütüphaneleri içeri aktarma
const { Client, GatewayIntentBits } = require('discord.js');
const noblox = require('noblox.js');

// --- BOT AYARLARI (BURAYI KENDİ BİLGİLERİNİZLE DOLDURUN) ---
const DISCORD_TOKEN = "Buraya Discord Bot Token'ı gelecek";
const ROBLOX_COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS. . ."; // Roblox çereziniz
const GROUP_ID = 1234567; // Roblox Grup ID'si (sayısal)
const prefix = '!'; // Komutlar için ön ek

// --- AYARLAR BİTTİ ---

// Discord botu ve amacı (intent) tanımlama
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot hazır olduğunda yapılacaklar
client.once('ready', async () => {
    console.log(`Discord botu hazır: ${client.user.tag}`);

    // Roblox'a giriş yap
    try {
        await noblox.setCookie(ROBLOX_COOKIE);
        console.log("Roblox'a başarıyla giriş yapıldı!");
        const currentUser = await noblox.getCurrentUser();
        console.log(`Giriş yapılan kullanıcı: ${currentUser.UserName}`);
    } catch (error) {
        console.error("Roblox'a giriş yaparken hata oluştu:", error.message);
        console.error("Lütfen çerezinizin geçerli olduğundan emin olun.");
    }
});

// Mesaj geldiğinde yapılacaklar
client.on('messageCreate', async message => {
    // Botun kendi mesajlarını görmezden gel
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    // Komutu ve argümanları ayır
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Terfi komutu
    if (command === 'terfi') {
        if (args.length !== 1) {
            return message.reply(`Kullanım: \`${prefix}terfi <Roblox Kullanıcı Adı>\``);
        }
        const username = args[0];
        try {
            const userId = await noblox.getIdFromUsername(username);
            await noblox.promote(GROUP_ID, userId);
            message.reply(`\`${username}\` adlı kullanıcı başarıyla terfi ettirildi.`);
        } catch (error) {
            console.error(error);
            message.reply(`Bir hata oluştu: ${error.message}.`);
        }
    }

    // Tenzil komutu
    if (command === 'tenzil') {
        if (args.length !== 1) {
            return message.reply(`Kullanım: \`${prefix}tenzil <Roblox Kullanıcı Adı>\``);
        }
        const username = args[0];
        try {
            const userId = await noblox.getIdFromUsername(username);
            await noblox.demote(GROUP_ID, userId);
            message.reply(`\`${username}\` adlı kullanıcı başarıyla tenzil ettirildi.`);
        } catch (error) {
            console.error(error);
            message.reply(`Bir hata oluştu: ${error.message}.`);
        }
    }
});

// Discord'a giriş yap
client.login(DISCORD_TOKEN);
