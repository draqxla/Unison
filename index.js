const Discord = require('discord.js');
const bot = new Discord.Client();
const ms = require('ms');
const ytdl = require("ytdl-core");

const PREFIX = '=';

var version = '1.0.0';

var servers = {};


bot.on('ready', () => {
    console.log('This bot is now online!');
    bot.user.setActivity(`${bot.guilds.size} server(s) | =help`, {
        type: "WATCHING"
    }).catch(console.error);
})

bot.on('guildMemberAdd', member => {

    const channel = member.guild.channels.find(channel => channel.name === 'welcome')
    if (!channel) return;

    channel.send(`Welcome to the server, ${member}, please read the rules in the rules channel!`)

});

bot.on('message', message => {

    const user = message.mentions.users.first();
    const member = message.guild.member(user);

    let args = message.content.substring(PREFIX.length).split(" ");

    switch (args[0]) {
        case 'help':
            let help = new Discord.RichEmbed()
                .setColor(0x002ACA)
                .setTitle("HELP - Commands (1/2)")
                .addField('=clearchat [length]', 'Clears the chat of a specified length.')
                .addField('=botinfo', 'Displays information about the bot.')
                .addField('=mute @[member] [timeperiod]', 'Mutes a member for the specified time period.')
                .addField('=ban @[member]', 'Bans a current member from the server.')
                .setTimestamp()
                .setFooter('Type "=help2" for the second page.')
            message.channel.sendEmbed(help);
            break;

        case 'help2':
            let help2 = new Discord.RichEmbed()
                .setColor(0x002ACA)
                .setTitle("HELP - Commands (2/2)")
                .addField('=play [link]', 'Plays a song from the specified link.')
                .addField('=skip', 'Skips the current song and plays the next one in queue.')
                .addField('=stop', 'Stops the song.')
                .setTimestamp()
            message.channel.sendEmbed(help2);
            break;


        case 'play':

            function play(connection, message) {
                var server = servers[message.guild.id];

                server.dispatcher = connection.playStream(ytdl(server.queue[0], {
                    filter: "audioonly"
                }));

                server.queue.shift();

                server.dispatcher.on("end", function () {
                    if (server.queue[0]) {
                        play(connection, message);
                    } else {
                        connection.disconnect();
                    }
                });


            }

            if (!args[1]) {
                let providelink = new Discord.RichEmbed()
                    .setColor(0xFF0000)
                    .addField('ERROR:', 'Please provide a link!')
                    .setTimestamp()
                    .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
                message.channel.sendEmbed(providelink);
                return;
            }

            if (!message.member.voiceChannel) {
                let mustbeinchannel = new Discord.RichEmbed()
                    .setColor(0xFF0000)
                    .addField('ERROR:', `You idiot, how are you gonna listen to music if you're not in a channel?`)
                    .setTimestamp()
                    .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
                message.channel.sendEmbed(mustbeinchannel);
                return;
            }

            if (!servers[message.guild.id]) servers[message.guild.id] = {
                queue: []
            }

            var server = servers[message.guild.id];

            server.queue.push(args[1]);

            if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function (connection) {
                play(connection, message);
            })
            break;

        case 'skip':
            var server = servers[message.guild.id];
            if (server.dispatcher) server.dispatcher.end();
            let nextsongskip = new Discord.RichEmbed()
                .setColor(0x00FF00)
                .addField('BEEP BOOP', `Skipped to the next song.`)
                .setTimestamp()
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
            message.channel.sendEmbed(nextsongskip);
            break;

        case 'stop':
            var server = servers[message.guild.id];
            if (message.guild.voiceConnection) {
                for (var i = server.queue.length - 1; i >= 0; i--) {
                    server.queue.splice(i, 1);
                }

                server.dispatcher.end();
                let musicleave = new Discord.RichEmbed()
                    .setColor(0x00FF00)
                    .addField('WHOOSH', `I have left the channel.`)
                    .setTimestamp()
                    .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
                message.channel.sendEmbed(musicleave);
                console.log('Stopped the queue')
            }

            if (message.guild.connection) message.guild.voiceConnection.disconnect();
            break;

        case 'botinfo':
            let botinfoembed = new Discord.RichEmbed()
                .setTitle(`Bot Information`, `${bot.user.tag}`)
                .addField('Author', 'draq#4883', true)
                .addField('Version', version, true)
                .addField('Description', 'Just a simple test bot')
                .setColor(0x00FF00)
                .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
            message.channel.sendEmbed(botinfoembed);
            break;

        case 'clearchat':
            if (!args[1]) {
                let clearchaterror = new Discord.RichEmbed()
                    .setColor(0xFF0000)
                    .addField('ERROR:', `Please specify the number of lines you want to clear.`)
                    .setTimestamp()
                message.channel.sendEmbed(clearchaterror);
            } else {
                message.channel.bulkDelete(args[1]);
                let clearchat = new Discord.RichEmbed()
                    .setColor(0x00FF00)
                    .setTitle('Chat has been cleared successfully.')
                    .setTimestamp()
                    .setFooter(`Issued by: ${message.author.tag}`, message.author.displayAvatarURL)
                message.channel.sendEmbed(clearchat);
            }
            break;

        case 'mute':
            let person = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[1]))
            if (!person) return
            let muteerror = new Discord.RichEmbed()
                .setColor(0xFF0000)
                .addField('ERROR:', `Could not find that member.`)
                .setTimestamp()
            message.channel.sendEmbed(muteerror);

            let mainrole = message.guild.roles.find(role => role.name === "Member");
            let muterole = message.guild.roles.find(role => role.name === "Muted");


            if (!muterole) return message.channel.send("Coudn't find the muted role.");

            let time = args[2];

            if (!time) return 
            {
                let mutespecifytime = new Discord.RichEmbed()
                    .setColor(0xFF0000)
                    .addField(`ERROR:`, `Please specify a period of time.`)
                    .setTimestamp()
                message.channel.sendEmbed(mutespecifytime);
            }

            person.removeRole(mainrole.id);
            person.addRole(muterole.id);

            let mutesuccesstime = new Discord.RichEmbed()
                .setColor(0x00FF00)
                .setTitle(`${person.user} has been muted for [${ms(ms(time))}]`)
                .setTimestamp()
                .setFooter(`Issued by: ${message.author.tag}`, message.author.displayAvatarURL)
            message.channel.sendEmbed(mutesuccesstime);

            setTimeout(function () {
                person.addRole(mainrole.id);
                person.removeRole(muterole.id);
                
                let muteunmute = new Discord.RichEmbed()
                    .setColor(0x00FF00)
                    .setTitle(`${person.user} has been unmuted.`)
                    .setTimestamp()
                message.channel.sendEmbed(muteunmute);
            }, ms(time));

            break;

        case 'kick':

            if (user) {

                if (member) {
                    member.kick('You have been kicked from the server.').then(() => {
                        let kicksuccess = new Discord.RichEmbed()
                            .setColor(0x00FF00)
                            .setTitle(`${user.tag} has been kicked from the server.`)
                            .setTimestamp()
                            .setFooter(`Issued by: ${message.author.tag}`, message.author.displayAvatarURL)
                        message.channel.sendEmbed(kicksuccess);

                    }).catch(err => {
                        let kickerror = new Discord.RichEmbed()
                            .setColor(0xFF0000)
                            .addField(`ERROR:`, `You were unable to kick that member.`)
                            .setTimestamp()
                        message.channel.sendEmbed(kickerror);
                        console.log(err);
                    });
                } else {
                    let kickerrornotinserver = new Discord.RichEmbed()
                        .setColor(0xFF0000)
                        .addField(`ERROR:`, `That user is not in this server.`)
                        .setTimestamp()
                    message.channel.sendEmbed(kickerrornotinserver);
                }
            } else {
                let kickspecifyperson = new Discord.RichEmbed()
                    .setColor(0xFF0000)
                    .addField(`ERROR:`, `Please specify a member.`)
                    .setTimestamp()
                message.channel.sendEmbed(kickspecifyperson);
            }
            break;

        case 'ban':

            if (user) {
                if (member) {
                    member.ban({
                        ression: 'You were not following the server rules.'
                    }).then(() => {
                        message.reply(`${user.tag} has been banned from the server.`)
                    })
                } else {
                    let bannotinserver = new Discord.RichEmbed()
                        .setColor(0x00FF00)
                        .addField('ERROR:', `That member is not in the servers.`)
                        .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
                    message.channel.sendEmbed(bannotinserver)
                }
            } else {
                let banspecify = new Discord.RichEmbed()
                    .setColor(0x00FF00)
                    .addField('ERROR:', `Please specify a member.`)
                    .setFooter(`${message.author.tag}`, message.author.displayAvatarURL)
                message.channel.sendEmbed(banspecify)
            }

            break;
    }
});

bot.login(process.env.BOT_TOKEN);
