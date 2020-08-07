const fs = require(`fs`);
const path = require(`path`);
const prettyMilliseconds = require(`pretty-ms`);
const moment = require(`moment`);

const pad = require(`./helpers/pad`);
const padSpace = (str, newStrLen) => pad(str, newStrLen, ` `);

/* This is an abstract class */
class Game {
  constructor(msg, argv) {
    this.msg = msg;
    this.argv = argv;
    this.filePath = path.join(__dirname, `files`, `${this.constructor.name.toLowerCase()}.json`);

    this.guild = msg.guild;
    this.user = msg.member;
  }

  saveRunRecord(msg, record) {
    fs.readFile(this.filePath, (readErr, data) => {
      // If the file doesn't exist then it doesn't matter. We'll just create it.
      if (readErr && readErr.errno === -4058) {
        data = `[]`; // eslint-disable-line no-param-reassign
      }
      else if (readErr) {
        throw readErr;
      }

      let records = JSON.parse(data);
      // If it's not an array in the file, something is wrong and we'll fix it by making a new array
      if (!Array.isArray(records)) {
        records = [];
      }
      records.push(record);

      fs.writeFile(this.filePath, JSON.stringify(records), (writeErr) => {
        if (writeErr) {
          throw writeErr;
        }
        console.log(`Saved new run succesfully!`);
        msg.reply(`Nice time ${msg.member.user.username}! Run saved.`);
      });
    });
  }

  // A constructor method for a new record
  newRecord(time) {
    return {
      game: this.constructor.name.toLowerCase(),
      player: this.user,
      time,
      date: new Date(),
    };
  }

  // If a third argument is recieved we'll deliver user data. Else we'll deliver a scoreboard.
  get(msg, argv) {
    fs.readFile(this.filePath, (err, data) => {
      if (err) {
        throw err;
      }
      let records = JSON.parse(data);
      let responseString = `Here's the full leaderboard:`;

      // argv[2] is the user/role-mention we might want to look up
      if (argv[2]) {
        const roleFromMention = getRoleFromMention(argv[2], msg);
        const mention = roleFromMention && roleFromMention.name ? roleFromMention.name : argv[2];
        responseString = `Here are the best times for ${mention}:`;

        // Means we have to look up a user, as it wasn't a role that was mentioned
        if (roleFromMention === undefined) {
          const user = getUserFromMention(argv[2]);
          if (user) {
            records = records.filter((record) => record.player.userID === user.id);
          }
          else {
            responseString = `Invalid identifier. Type ${global.prefix}help for help`;
            records = [];
          }
        }
        else {
          records = records.filter((record) => {
            const user = msg.guild.members.cache.get(record.player.userID); // Getting the user by ID.
            if (user) {
              return user.roles.cache.some((role) => role.name === roleFromMention.name); // Role names have to match
            }

            return false;
          });
        }
      }

      records.sort(bestTime);
      const leaderboard = generateLeaderboard(records);
      msg.reply(`${responseString}\n${leaderboard}`);
    });
  }
}

module.exports = Game;

// Sorting function which sorts according to the record's best time
function bestTime(a, b) {
  if (a.time < b.time) {
    return -1;
  }
  if (a.time > b.time) {
    return 1;
  }

  return 0;
}

function generateLeaderboard(records) {
  let leaderboard = `\`\`\`\nPlace ${padSpace(`Player`, 32)} ${padSpace(`Time`, 15)} Date\n`;
  records.forEach((record, i) => {
    leaderboard += `${padSpace(`${i + 1}.`, 5)} `; // Place
    leaderboard += `${padSpace(record.player.displayName, 32)} `;
    leaderboard += `${padSpace(prettyMilliseconds(record.time), 15)} `;
    leaderboard += moment(record.date).fromNow();
    leaderboard += `\n`;
  });
  leaderboard += `\`\`\``;
  return leaderboard;
}

/*
 * From https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
 * The function essentially just works itself through the structure of the mention bit by bit:
 *
 * 1. Check if the mention starts with the <@ and ends with a > and then remove those.
 * 2. If the user has a nickname and their mention contains a ! remove that as well.
 * 3. Only the ID should be left now, so use that to fetch the user from the client.users.cache Collection.
 *    Whenever it encounters an error with the mention (i.e. invalid structure) it simply returns undefined to signal the mention is invalid.
*/
function getUserFromMention(mention) {
  if (!mention) {
    return undefined;
  }

  if (mention.startsWith(`<@`) && mention.endsWith(`>`)) {
    mention = mention.slice(2, -1); // eslint-disable-line no-param-reassign

    if (mention.startsWith(`!`)) {
      mention = mention.slice(1); // eslint-disable-line no-param-reassign
    }

    return global.bot.users.cache.get(mention);
  }
  return undefined;
}

function getRoleFromMention(mention, msg) {
  if (!mention) {
    return undefined;
  }

  // This is if it was a propper mention
  if (mention.startsWith(`<@&`) && mention.endsWith(`>`)) {
    mention = mention.slice(3, -1); // eslint-disable-line no-param-reassign

    if (mention.startsWith(`!`)) {
      mention = mention.slice(1); // eslint-disable-line no-param-reassign
    }

    return msg.guild.roles.cache.get(mention);
  }

  // This is if the role was identified by the id
  if (mention.startsWith(`$`)) {
    mention = mention.slice(1); // eslint-disable-line no-param-reassign
    return msg.guild.roles.cache.get(mention);
  }
  return undefined;
}
