'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');


// var mongoose = require('mongoose');
// var db = mongoose.connect("mongodb://localhost:27017/lunchbot").connection;
// var Botkit = require('botkit');
// var controller = Botkit.slackbot();

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "norrisbot")
 *      dbPath : the path to access the database (will default to "data/norrisbot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */
function NorrisBot (settings) {
    // console.log('settings', settings)
    this.settings = settings;
    this.settings.name = this.settings.name || 'norrisbot';
    this.dbPath = settings.dbPath || path.resolve(__dirname, '..', 'data', 'norrisbot.db');

    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

/**
 * Run the bot
 * @public
 */
NorrisBot.prototype.run = function () {
    // console.log('I am runnnig')
    NorrisBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
NorrisBot.prototype._onStart = function () {
    this._loadBotUser();
    this._connectDb();
    this._firstRunCheck();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
NorrisBot.prototype._onMessage = function (message) {
    console.log('messages are being checked', message)
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromNorrisBot(message)) {
        if (this._isMentioningChuckNorris(message)) {
            this._replyWithRandomJoke(message);
        } else if (this._isMentioningChocolate(message)) {
            this._sendChocolate(message);
        } else if (this._isMentioningWine(message)) {
            this._sendWine(message);
        } else if (this._isMentioningSweets(message)) {
            this._sendSweets(message);
        } else if (this._isAskingWho(message)) {
            this._sendWho(message);
        } else if (this._isMentioningJoke(message)) {
            this._sendJoke(message);
        } else if (this._isMentioningLunch(message)) {
            this._sendLunch(message);
        } 
    }
};

NorrisBot.prototype._isMentioningJoke = function (message) {
    return message.text.toLowerCase().indexOf('joke') > -1 || message.text.toLowerCase().indexOf('sad') > -1 || message.text.toLowerCase().indexOf('hard day') > -1;
}

NorrisBot.prototype._sendJoke = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    var jokeArr = ["There are 10 types of people in the world: those who understand binary, and those who don’t.",
        "In a world without fences and walls, who needs Gates and Windows?",
        "An SQL statement walks into a bar and sees two tables. It approaches, and asks 'may I join you?'",
        "Q: How many programmers does it take to change a light bulb?\n A: None. It’s a hardware problem.",
        "A programmer tells a colleague his wife just had a baby.\n His colleague asks 'Is it a boy or a girl?' The programmer responds 'Yes'",
        "CAPS LOCK – Preventing Logins Since 1980.",
        "Some things Man was never meant to know. For everything else, there’s Google.",
        "UNIX is basically a simple operating system, but you have to be a genius to understand the simplicity.",
        "The box said ‘Requires Windows Vista or better’. So I installed LINUX.",
        "If at first you don’t succeed; call it version 1.0.",
        "I would love to change the world, but they won’t give me the source code.",
        "If you give someone a program, you will frustrate them for a day; if you teach them how to program, you will frustrate them for a lifetime.",
        "Programmers are tools for converting caffeine into code."];
    var i =  Math.floor(Math.random() * (12 + 1));

    var joke;
    if (message.text.toLowerCase().indexOf('sad') > -1 || message.text.toLowerCase().indexOf('hard day') > -1) joke = "Maybe I can cheer you up with a joke:\n" + jokeArr[i]; 
    else joke = jokeArr[i];    

    self.postMessageToChannel(channel.name, joke, {as_user: true});
    
    // var self = this;
    // self.db.get('SELECT id, joke FROM compjokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    //     if (err) {
    //         return console.error('DATABASE ERROR:', err);
    //     }

    //     var channel = self._getChannelById(originalMessage.channel);
    //     self.postMessageToChannel(channel.name, record.joke, {as_user: true});
    //     self.db.run('UPDATE compjokes SET used = used + 1 WHERE id = ?', record.id);
    // });
}

NorrisBot.prototype._isMentioningLunch = function (message) {
    return message.text.toLowerCase().indexOf('lunch') > -1;
}

NorrisBot.prototype._sendLunch = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    var lunchArr = ["Pisillo Italian Panini's at 97 Nassau St. (the sandwiches are a little pricey but big and delicious!)",
        "Fresh Salt at 146 Beekman St. (general American fare: I hear their sandwiches are great)",
        "Nish Nush at 88 Reade St. for some Middle Eastern fare",
        "Luke's Lobsters at 26 S William St.",
        "the food stand Veronica's Kitchen at Front St. & Pine St. for soul food",
        "Melt Shop at 111 Fulton St. for sandwiches",
        "Roti Mediterranean Grill at 100 Maiden Ln",
        "Thai Sliders & Co. at 108 John St",
        "Open Kitchen for the buffet style and cook to order options at 15 William St",
        "Go! Go! Curry! at 12 John St. for some Japanese fare",
        "sweet and savory crepes at Crepes Du Nord at 17 S. William St.",
        "El Luchador for Mexican at 87 South St.",
        "The Malt House gastropub at 9 Maiden Ln",
        "The Dead Rabbit for some Irish cuisine at 30 Water St.",
        "Dig Inn at 80 Broad St. or 80 Pine St. (lunch here is fast and healthy)",
        "Underground Pizza right below at 3 Hanover Sq.",
        "The GoGo Grill food truck at 1 Broadway",
        "Bahn Mi food cart at Pearl St & Hanover Sq"];

    var i = Math.floor(Math.random() * (17 + 1));
    var j = i;
    while (j === i) {
        j = Math.floor(Math.random() * (17 + 1));
    }

    self.postMessageToChannel(channel.name, "Try out " +lunchArr[i] + " *or maybe* " + lunchArr[j] + " for *lunch* today", {as_user: true});
}

NorrisBot.prototype._isAskingWho = function (message) {
    return message.text.toLowerCase().indexOf('who are you') > -1;
}

NorrisBot.prototype._sendWho = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    var whoArr = ["I am your bestest-estest friend!",
            "You don't know me? I am your fairy godmother!",
            "I am the helpful monster that lives under your bed. Obviously",
            "I am the matrix",
            "I can be whomever you want me to be",
            "By day I am friendbot. But by night... I keep these streets clean",
            "Well I thought I was your friend, but if you don't even know me I guess not",
            "I am 011001100111001001101001011001010110111001100100",
            "The question shouldn't be who I am, but how did I get in here"];
    var i =  Math.floor(Math.random() * (8 + 1));

        self.postMessageToChannel(channel.name, whoArr[i], {as_user: true});
}

NorrisBot.prototype._isMentioningSweets = function (message) {
    return message.text.toLowerCase().indexOf('sweet') > -1 || message.text.toLowerCase().indexOf('sweets') > -1 || message.text.toLowerCase().indexOf('snack') > -1;
}

NorrisBot.prototype._sendSweets = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
        var sweetArr = ["Time for a sweet treat break? The tried and true Insomnia Cookies are at 76 Pearl St. nearby", 
        "Maybe you want a coffee and pastry snack? I would head over to Financier Patisserie at 62 Stone St. then",
        "If you need a handful of bite-size cupcakes then Baked by Melissa is THE spot for you at 110 Fulton St.", 
        "Cupcakes are always the solution. Try Sprinkles Cupcakes at 225 Liberty St.",
        "This might be a bit of a trek but the cupcakes don't disappoint at Sugar Sweet Sunshine at 126 Rivington St.",
        "Want to check out TriBeCa? Maybe it is just for delicious cupcakes at Billy's Bakery at 75 Franklin St.",
        "Looking for rich and yummy Banana Pudding? Well then you better hop on a train to Magnolia's at 401 Bleecker St.",
        "Maybe a bite-size pie is just what you need? Head over to Goodly Delights at 12345 N. St."];
    var i =  Math.floor(Math.random() * (6 + 1));

        self.postMessageToChannel(channel.name, sweetArr[i], {as_user: true});
}

NorrisBot.prototype._isMentioningChocolate = function (message) {
    return message.text.toLowerCase().indexOf('chocolate') > -1;
}

NorrisBot.prototype._sendChocolate = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
        var chocolateArr = ["Chocolate emergency? The closest chocolate is the Leonidas Store at 3 Hanover Square", 
            "In the mood for chocolate ehh? Well I hear La Maison Du Chocolat at 63 Wall St #4 has some treats for you!",
            "Craving chocolate? Try a chocolate shake from Godiva at 33 Maiden Ln. nearby",
            "Don't have much time and maybe you need a coffee pick me up too? If so, I would recommend FIKA at 66 Pearl St."];
    var i =  Math.floor(Math.random() * (3 + 1));

        self.postMessageToChannel(channel.name, chocolateArr[i], {as_user: true});
}

NorrisBot.prototype._isMentioningWine = function (message) {
    return message.text.toLowerCase().indexOf('wine') > -1;
}

NorrisBot.prototype._sendWine = function (message) {
    var self = this;
    var channel = self._getChannelById(message.channel);
    var wineObj = ["Need wine quick? The closest store is Royal Wine Merchant at 13 S. William St.", 
        "Tough day? Maybe it's time to head over to Vintry Wine & Whiskey at 57 Stone St",
        "In the mood for a wine night? Try Bin No. 220 at 220 Front St",
        "Is it time to grab a bottle of wine? A store nearby is New York Vintners at 21 Warren St."];
    var i =  Math.floor(Math.random() * (3 + 1));

        self.postMessageToChannel(channel.name, wineObj[i], {as_user: true});

}
/**
 * Replyes to a message with a random Joke
 * @param {object} originalMessage
 * @private
 */
NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, record.joke, {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};

/**
 * Loads the user object representing the bot
 * @private
 */
NorrisBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

/**
 * Open connection to the db
 * @private
 */
NorrisBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);

    // var startDbPromise = new Promise(function (resolve, reject) {
    //     db.on('open', resolve);
    //     db.on('error', reject);
    // });

    // console.log(chalk.yellow('Opening connection to MongoDB . . .'));
    // startDbPromise.then(function () {
    //     this.db = db;
    //     console.log(chalk.green('MongoDB connection opened!'));
    // });
};

/**
 * Check if the first time the bot is run. It's used to send a welcome message into the channel
 * @private
 */
NorrisBot.prototype._firstRunCheck = function () {
    var self = this;
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

/**
 * Sends a welcome message in the channel
 * @private
 */
NorrisBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isChatMessage = function (message) {
    // console.log('chat', message)
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isChannelConversation = function (message) {
    // console.log('channel', message, message.channel)
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message is mentioning Chuck Norris or the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isMentioningChuckNorris = function (message) {
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

/**
 * Util function to check if a given real time message has ben sent by the norrisbot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
NorrisBot.prototype._isFromNorrisBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
NorrisBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = NorrisBot;
