'use strict';

/**
 * Command line script that generates a SQLite database file that contains jokes about Chuck Norris using the
 * wonderful http://api.icndb.com/jokes APIs
 *
 * Usage:
 *
 *   node databaseGenerator.js [destFile]
 *
 *   destFile is optional and it will default to "norrisbot.db"
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */

var path = require('path');
var request = require('request');
var Async = require('async');
var ProgressBar = require('progress');
var sqlite3 = require('sqlite3').verbose();

var outputFile = process.argv[2] || path.resolve(__dirname, 'norrisbot.db');
var db = new sqlite3.Database(outputFile);


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


// executes an API request to count all the available jokes
request('http://api.icndb.com/jokes/count', function (error, response, body) {
    if (!error && response.statusCode === 200) {
        var count = JSON.parse(body).value;
        var savedJokes = 0;
        var index = 0;
        var bar = new ProgressBar(':bar :current/:total', {total: count});

        // Prepares the database connection in serialized mode
        db.serialize();
        // Creates the database structure
        db.run('CREATE TABLE IF NOT EXISTS compjokes (id INTEGER PRIMARY KEY, joke TEXT, used INTEGER DEFAULT 0)');
        db.run('CREATE INDEX compjokes_used_idx ON compjokes (used)');

        db.run('CREATE TABLE IF NOT EXISTS info (name TEXT PRIMARY KEY, val TEXT DEFAULT NULL)');
        db.run('CREATE TABLE IF NOT EXISTS jokes (id INTEGER PRIMARY KEY, joke TEXT, used INTEGER DEFAULT 0)');
        db.run('CREATE INDEX jokes_used_idx ON jokes (used)');

        // The idea from now on is to iterate through all the possible jokes starting from the index 1 until we can
        // find all the available ones. There might be holes in the sequence, so we might want to issue all the request
        // sequentially and count the successful requests until we get the total amount of jokes.
        // We are going to use the function Async.whilst so we need to define 3 functions: test, task and onComplete

        // Tests whether to stop fetching jokes. It gets called before starting a new iteration
        var test = function () {
            return savedJokes < count;
        };

        // The task executed at every iteration. Basically fetches a new joke and creates a new record in the database.
        var task = function (cb) {

        jokeArr.forEach(function(compjoke) {
            db.run('INSERT INTO compjokes (joke) VALUES (?)', compjoke);
        });

            request('http://api.icndb.com/jokes/' + (++index) + '?escape=javascript', function (err, response, body) {
                // handle possible request errors by stopping the whole process
                if (err || response.statusCode !== 200) {
                    console.log(index, error, response.statusCode);

                    return cb(error || response.statusCode);
                }

                // invalid ids generates an invalid JSON response (basically an HTML output), so we can
                // check for it by detecting JSON parse errors and skip the id by calling the callback completion
                // function for the current iteration
                var result = null;
                try {
                    result = JSON.parse(body).value;
                } catch (ex) {
                    return cb(null);
                }

                db.run('INSERT INTO jokes (joke) VALUES (?)', result.joke, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    ++savedJokes;
                    bar.tick();
                    return cb(null);
                });
            });
        };

        // On completion we just need to show errors in case we had any and close the database connection
        var onComplete = function (err) {
            db.close();
            if (err) {
                console.log('Error: ', err);
                process.exit(1);
            }
        };

        // triggers the asynchronous iteration using the previously defined test, task and onComplete functions
        return Async.whilst(test, task, onComplete);
    }

    console.log('Error: unable to count the total number of jokes');
    process.exit(1);
});
