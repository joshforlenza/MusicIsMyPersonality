import mongoose from 'mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const UserSchema = new mongoose.Schema({
    username: {type:String, unique: true, required: true},
    email: {type:String, unique: true, required: true},
    password: {type:String, unique: true, required: true},
    // username provided by Spotify API plugin
    // password hash provided by Spotify API plugin
    bio: {type:String},
    stats: [{type: String, percent: String}],
    ranking: [{type: String, rank: String}],
    summary:  { type: mongoose.Schema.Types.ObjectId, ref: 'Summary' }
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