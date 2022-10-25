// 1ST DRAFT DATA MODEL
const mongoose = require('mongoose');

//users
const User = new mongoose.Schema({
  // username provided by Spotify API plugin
  // password hash provided by Spotify API plugin
  stats: [{type: String, percent: String}],
  ranking: [{type: String, rank: String}],
  summary:  { type: mongoose.Schema.Types.ObjectId, ref: 'Summary' }

});

//summary
const Summary = new mongoose.Schema({
  name: String,
  description: String
});

//leaderboard
const Leaderboard = new mongoose.Schema({
    name: String,
    users: [{username: String, stat: Number, rank: Number}]
});

// TODO: add remainder of setup for slugs, connection, registering models, etc. below