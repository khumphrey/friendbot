var mongoose = require('mongoose');
var db = mongoose.connect("mongodb://localhost:27017/lunchbot").connection;



var lunchSchema = new mongoose.Schema({
	lunchTime: {
		type:  Date,
		default: Date.now
	},
	location: {
		type: String
	},
	person: {
		type: String
	}

});

mongoose.model('Lunch', lunchSchema);

var jokeSchema = new mongoose.Schema({
	joke: {
		type:  String,
		count: {
			type: Number,
			default: 0
		}
	}
});

mongoose.model('Joke', jokeSchema);
