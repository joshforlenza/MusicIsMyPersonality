import mongoose from 'mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const UserSchema = new mongoose.Schema({
    username: {type:String, unique: true, required: true},
    authToken: {type:String, unique: true, required: true}, //used for Spotify auth
    bio: {type:String},
    favoriteAlbums: {first: String, second: String, 
      third: String, fourth: String, fifth: String},
    stats: [{name: String, percent: Number}],
    ranking: [{name: String, rank: Number}],
    summary:  { type: mongoose.Schema.Types.ObjectId, ref: 'Summary' },
    message: String
});

const SummarySchema = new mongoose.Schema({
  name: String,
  description: String
});

//leaderboard
const LeaderboardSchema = new mongoose.Schema({
  name: String,
  users: [{username: String, stat: Number, rank: Number}]
});

UserSchema.plugin(mongooseSlugPlugin,{tmpl: '<%=username%>'});

mongoose.model('User', UserSchema);
mongoose.model('Summary', SummarySchema);
mongoose.model('Leaderboard', LeaderboardSchema);

mongoose.connect('mongodb+srv://joshforlenza:8oOo4Kg8YptJUNPa@cluster0.8vwdo6a.mongodb.net/?retryWrites=true&w=majority');