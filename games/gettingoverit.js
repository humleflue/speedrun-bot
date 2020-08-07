const Game = require(`./Game`);

class Gettingoverit extends Game {
  add(msg, argv) {
    const time         = argv[2].split(`:`);
    let hours          = parseInt(time[0]);
    let minutes        = parseInt(time[1]);
    let seconds        = parseInt(time[2]);
    const milliseconds = parseInt(time[3]);

    if (milliseconds === undefined || Number.isNaN(milliseconds)) {
      msg.reply(`Invalid time format. Format should be as follows: **hh:mm:ss:ms**`);
    }
    else {
      // Convert to milliseconds
      hours   *= 3600000;
      minutes *= 60000;
      seconds *= 1000;

      const totalTime = hours + minutes + seconds + milliseconds;
      const record = this.newRecord(totalTime);

      this.saveRunRecord(msg, record);
    }
  }
}

module.exports = Gettingoverit;
