import mongoose from 'mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const UserSchema = new mongoose.Schema({
    username: {type:String, unique: true, required: true},
    authToken: {type:String, unique: true, required: true}, //used for Spotify auth
    bio: {type:String},
    favoriteAlbums: {first: String, second: String, 
      third: String, fourth: String, fifth: String},
    stats: {obscurity: Number},
    summary: { type: mongoose.Schema.Types.ObjectId, ref: 'Summary' }
});

const SummarySchema = new mongoose.Schema({
  name: String,
  description: String
});

UserSchema.plugin(mongooseSlugPlugin,{tmpl: '<%=username%>'});

mongoose.model('User', UserSchema);
mongoose.model('Summary', SummarySchema);

mongoose.connect('mongodb+srv://joshforlenza:8oOo4Kg8YptJUNPa@cluster0.8vwdo6a.mongodb.net/?retryWrites=true&w=majority');