// Dependencies
const Discord = require(`discord.js`);
global.bot     = new Discord.Client();
const fs      = require(`fs`);
// const path    = require(`path`);

// Helpers
// const pad = require(`./games/helpers/pad`);

// Games
const Gettingoverit = require(`./games/gettingoverit`);

// Variables
const token = `NzQwNTg3NzY0MTE4MTkyMjEy.XyrMGg.-rMRhDGiHj0cXyP4D_Sq6TL2zrs`;
const p = `$`; // Prefix
global.prefix = p;
const moderators = [`187542518659809280`]; // Discord IDs (msg.member.id)
const supportedGames = [`gettingoverit`];

// Connect to the discord api
global.bot.login(token);

// Ready check
global.bot.on(`ready`, () => {
  console.log(`Logged in as ${global.bot.user.tag}!`);
});

// Main method. When a message occurs in a chat this happens
global.bot.on(`message`, (msg) => {
  if (msg.content[0] === p) {
    const argv = msg.content.split(` `).map((arg) => arg.toLowerCase());
    const models = constructModels(msg, argv);

    switch (argv[0]) {
      case `${p}help`: case `${p}h`: case `${p}commands`:
        sendHelpMsg(msg);                               break;
      case `${p}add`: handle(`add`, msg, argv, models); break;
      case `${p}get`: handle(`get`, msg, argv, models); break;
      case `${p}adm`: adm(msg, argv, models);           break;
      default: sendInvalidReply(msg, `command`);        break;
    }
  }
});

// Construct all models here for convenience later
// Names of the models has to be the same as the names in supportedGames
function constructModels(msg, argv) {
  return {
    gettingoverit: new Gettingoverit(msg, argv),
  };
}

function sendInvalidReply(msg, type) {
  msg.reply(`Invalid ${type}. See ${p}help for a list of available commands`);
}

function sendHelpMsg(msg) {
  fs.readFile(`readme.txt`, `utf-8`, (err, data) => {
    if (err) {
      throw err;
    }
    msg.reply(data);
  });
}

function handle(type, msg, argv, models) {
  if (supportedGames.find((game) => argv[1] === game)) {
    switch (type) {
      case `add`: models[argv[1]].add(msg, argv); break;
      case `get`: models[argv[1]].get(msg, argv); break;
      default:
        console.log(`Something went wrong in the handle() function. ${type} is not recognized.`);
        msg.reply(`Fatal bot error.`);
        break;
    }
  }
  else {
    sendInvalidReply(msg, `game`);
  }
}

function adm(msg, argv) {
  if (isModerator(msg.member.id)) {
    switch (argv[1]) {
      default: sendInvalidReply(msg, `command`); break;
    }
  }
  else {
    msg.reply(`Unauthorized.`);
  }
}

function isModerator(userId) {
  return undefined !== moderators.find((modId) => modId === userId);
}

// https://www.reddit.com/r/discordapp/comments/8yfe5f/discordjs_bot_get_username_and_tag/
