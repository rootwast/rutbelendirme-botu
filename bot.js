// Gerekli kütüphaneleri içeri aktarma
const { Client, GatewayIntentBits, EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const noblox = require('noblox.js');
const crypto = require('crypto');

// --- BOT AYARLARI (BURAYI KENDİ BİLGİLERİNİZLE DOLDURUN) ---
const DISCORD_TOKEN = "BURAYA DİSCORD BOT TOKENİN GELECEK";
const ROBLOX_COOKIE = "_|WARNING:-DO-NOT-SHARE-THIS. . ."; // Roblox çereziniz
const GROUP_ID = 1234567; // Roblox Grup ID'si (sayısal)
const GAME_PLACE_ID = 8888888; // Roblox oyununuzun Place ID'si
const VERIFIED_ROLE_ID = "BURAYA DOĞRULAMA SONRASI VERİLECEK DİSCORD ROL ID'Sİ GELECEK";
const PROMOTION_ROLE_ID = "BURAYA TERFİ VE TENZİL KOMUTLARINI KULLANACAK ROL ID'Sİ GELECEK";
const MODERATION_ROLE_ID = "BURAYA MODERASYON KOMUTLARINI KULLANACAK ROL ID'Sİ GELECEK";
const MUTED_ROLE_ID = "BURAYA SUSTURULMUŞ KULLANICILARA VERİLECEK ROL ID'Sİ GELECEK";

// --- AYARLAR BİTTİ ---

const verificationCodes = new Map();
let groupRoles = new Map();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

client.once('ready', async () => {
    console.log(`Discord botu hazır: ${client.user.tag}`);

    try {
        await noblox.setCookie(ROBLOX_COOKIE);
        console.log("Roblox'a başarıyla giriş yapıldı!");
        const roles = await noblox.getRoles(GROUP_ID);
        roles.forEach(role => {
            groupRoles.set(role.name.toLowerCase(), role.rank);
        });
        console.log("Grup rolleri başarıyla yüklendi.");
    } catch (error) {
        console.error("Roblox'a giriş yaparken veya roller yüklenirken hata oluştu:", error.message);
    }

    const commands = [
        { name: 'verify', description: 'Doğrulama işlemini başlatır.' },
        { name: 'verifydone', description: 'Doğrulama işlemini tamamlar.', options: [{ name: 'roblox_kullanici_adi', description: 'Roblox kullanıcı adınız.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'rütbe-sorgu', description: 'Bir kullanıcının gruptaki rütbesini sorgular.', options: [{ name: 'roblox_kullanici_adi', description: 'Sorgulanacak Roblox kullanıcı adı.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'aktiflik-sorgu', description: 'Bir kullanıcının en son ne zaman aktif olduğunu sorgular.', options: [{ name: 'roblox_kullanici_adi', description: 'Sorgulanacak Roblox kullanıcı adı.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'game', description: 'Roblox oyunundaki aktif oyuncu sayısını gösterir.' },
        { name: 'terfi', description: 'Bir Roblox kullanıcısını terfi ettirir.', options: [{ name: 'roblox_kullanici_adi', description: 'Terfi edilecek Roblox kullanıcı adı.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'tenzil', description: 'Bir Roblox kullanıcısını tenzil ettirir.', options: [{ name: 'roblox_kullanici_adi', description: 'Tenzil edilecek Roblox kullanıcı adı.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'rütbe-ver', description: 'Bir kullanıcıya belirli bir rütbe atar.', options: [{ name: 'roblox_kullanici_adi', description: 'Rütbe verilecek Roblox kullanıcı adı.', type: ApplicationCommandOptionType.String, required: true }, { name: 'rütbe_adi', description: 'Verilecek rütbenin adı.', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'ban', description: 'Bir Discord üyesini yasaklar.', options: [{ name: 'kullanici', description: 'Yasaklanacak üye.', type: ApplicationCommandOptionType.User, required: true }, { name: 'sebep', description: 'Yasaklama sebebi.', type: ApplicationCommandOptionType.String, required: false }] },
        { name: 'mute', description: 'Bir Discord üyesini susturur.', options: [{ name: 'kullanici', description: 'Susturulacak üye.', type: ApplicationCommandOptionType.User, required: true }, { name: 'süre', description: 'Susturma süresi (dk).', type: ApplicationCommandOptionType.Integer, required: false }] }
    ];

    await client.application.commands.set(commands);
    console.log("Slash komutları başarıyla kaydedildi!");
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, member } = interaction;
    const isModerator = member.roles.cache.has(MODERATION_ROLE_ID);
    const isPromoter = member.roles.cache.has(PROMOTION_ROLE_ID);

    try {
        switch (commandName) {
            case 'verify': {
                const userId = interaction.user.id;
                const verificationCode = crypto.randomBytes(8).toString('hex');
                verificationCodes.set(userId, verificationCode);
                const embed = new EmbedBuilder().setColor('#0099ff').setTitle('Doğrulama İşlemi').setDescription(`Merhaba! Lütfen aşağıdaki kodu **Roblox bio'nuza** ekleyin ve ardından \`/verifydone <Roblox Kullanıcı Adınız>\` komutunu kullanın.\n\n**Doğrulama Kodunuz**: \`${verificationCode}\``);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
            case 'verifydone': {
                const discordUserId = interaction.user.id;
                const robloxUsername = options.getString('roblox_kullanici_adi');
                if (!verificationCodes.has(discordUserId)) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Doğrulama Hatası').setDescription('Önce `/verify` komutunu kullanarak bir doğrulama oturumu başlatmalısınız.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const requiredCode = verificationCodes.get(discordUserId);
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const userBlurb = await noblox.getBlurb(userId);
                if (userBlurb && userBlurb.includes(requiredCode)) {
                    const member = await interaction.guild.members.fetch(discordUserId);
                    const role = interaction.guild.roles.cache.get(VERIFIED_ROLE_ID);
                    if (member && role) {
                        await member.roles.add(role);
                        const embed = new EmbedBuilder().setColor('#00ff00').setTitle('Doğrulama Başarılı!').setDescription(`Tebrikler, \`${robloxUsername}\` hesabınız başarıyla doğrulandı ve rolünüz verildi!`);
                        await interaction.reply({ embeds: [embed] });
                        verificationCodes.delete(discordUserId);
                    } else {
                        const embed = new EmbedBuilder().setColor('#ffcc00').setTitle('Doğrulama Başarılı Ama Rol Hatası').setDescription("Doğrulama tamamlandı, ancak rol verilirken bir hata oluştu. Lütfen botun yetkilerini kontrol edin.");
                        await interaction.reply({ embeds: [embed], ephemeral: true });
                    }
                } else {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Doğrulama Hatası').setDescription('Roblox bio\'nuzda doğru kod bulunamadı. Lütfen kodu doğru bir şekilde eklediğinizden emin olun.');
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                break;
            }
            case 'rütbe-sorgu': {
                if (!isPromoter) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const robloxUsername = options.getString('roblox_kullanici_adi');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const rankName = await noblox.getRankNameInGroup(GROUP_ID, userId);
                const embed = new EmbedBuilder().setColor('#ffcc00').setTitle('Rütbe Sorgu Sonucu').setDescription(`\`${robloxUsername}\` adlı kullanıcının gruptaki rütbesi: **${rankName}**`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'aktiflik-sorgu': {
                if (!isPromoter) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const robloxUsername = options.getString('roblox_kullanici_adi');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const joinDate = new Date(await noblox.getJoinDate(userId));
                const embed = new EmbedBuilder().setColor('#00ffcc').setTitle('Aktiflik Sorgu Sonucu').setDescription(`\`${robloxUsername}\` adlı kullanıcı **${joinDate.toLocaleDateString()}** tarihinde Roblox'a katıldı.`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'game': {
                const gameInfo = await noblox.getGameInfo(GAME_PLACE_ID);
                const embed = new EmbedBuilder().setColor('#00ffcc').setTitle('Oyun Aktiflik Sorgusu').setDescription(`\`${gameInfo.name}\` adlı oyunda şu anda **${gameInfo.playing}** kişi oynuyor.`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'terfi': {
                if (!isPromoter) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const robloxUsername = options.getString('roblox_kullanici_adi');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                await noblox.promote(GROUP_ID, userId);
                const embed = new EmbedBuilder().setColor('#00ff00').setTitle('Terfi Başarılı').setDescription(`\`${robloxUsername}\` adlı kullanıcı başarıyla terfi ettirildi.`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'tenzil': {
                if (!isPromoter) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const robloxUsername = options.getString('roblox_kullanici_adi');
                const userId = await noblox.getIdFromUsername(robloxUsername);
                await noblox.demote(GROUP_ID, userId);
                const embed = new EmbedBuilder().setColor('#00ff00').setTitle('Tenzil Başarılı').setDescription(`\`${robloxUsername}\` adlı kullanıcı başarıyla tenzil ettirildi.`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'rütbe-ver': {
                if (!isPromoter) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const robloxUsername = options.getString('roblox_kullanici_adi');
                const rankName = options.getString('rütbe_adi').toLowerCase();
                const rankId = groupRoles.get(rankName);
                if (!rankId) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Hata').setDescription('Girdiğiniz rütbe adı bulunamadı. Lütfen doğru bir rütbe adı girdiğinizden emin olun.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const userId = await noblox.getIdFromUsername(robloxUsername);
                await noblox.setRank(GROUP_ID, userId, rankId);
                const embed = new EmbedBuilder().setColor('#00ff00').setTitle('Rütbe Atama Başarılı').setDescription(`\`${robloxUsername}\` adlı kullanıcıya başarıyla \`${rankName}\` rütbesi verildi.`);
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'ban': {
                if (!isModerator) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const targetUser = options.getMember('kullanici');
                const reason = options.getString('sebep') || 'Sebep belirtilmedi.';
                await targetUser.ban({ reason });
                const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Kullanıcı Yasaklandı').setDescription(`${targetUser.user.tag} adlı kullanıcı sunucudan yasaklandı.`).addFields({ name: 'Sebep', value: reason });
                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'mute': {
                if (!isModerator) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Yetkisiz Erişim').setDescription('Bu komutu kullanma yetkiniz yok.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                const targetUser = options.getMember('kullanici');
                const muteDuration = options.getInteger('süre');
                const muteRole = interaction.guild.roles.cache.get(MUTED_ROLE_ID);

                if (!muteRole) {
                    const embed = new EmbedBuilder().setColor('#ff0000').setTitle('Hata').setDescription('Susturma (mute) rolü bulunamadı. Lütfen ayarlarda doğru rol ID\'sini girdiğinizden emin olun.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await targetUser.roles.add(muteRole);
                let description = `${targetUser.user.tag} adlı kullanıcı susturuldu.`;
                if (muteDuration) {
                    setTimeout(() => targetUser.roles.remove(muteRole), muteDuration * 60 * 1000);
                    description += `\n**Süre:** ${muteDuration} dakika`;
                }

                const embed = new EmbedBuilder().setColor('#ffcc00').setTitle('Kullanıcı Susturuldu').setDescription(description);
                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    } catch (error) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Bir Hata Oluştu')
            .setDescription(`Hata: \`${error.message}\``);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.login(DISCORD_TOKEN);
