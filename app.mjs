import './db.mjs';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import * as functions from './functions.mjs';
import path from 'path'
import { fileURLToPath } from 'url';
import { URLSearchParams } from 'url';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser'


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client_id = 'bd7f033f5d294be08b9547187c9ad500'; // Your client id
const client_secret = '35811d16337c4a99b742c94098629bc9'; // Your secret
const redirect_uri = 'https://final-project-joshforlenza-production.up.railway.app/callback/'; // Your redirect uri

const sessionOptions = {
    secret: 'I love Spotify',
	resave: true,
	saveUninitialized: true
};

const stateKey = 'spotify_auth_state';

const User = mongoose.model('User');
const Summary = mongoose.model('Summary');

app.set('view engine', 'hbs');


//middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session(sessionOptions));
app.use(cookieParser());

//logging
app.use((req,res,next) => {
    console.log("Request Method : " + req.method);
    console.log("Request Path : " +req.path);
    console.log("Request Query : " + JSON.stringify(req.query));
    console.log("Request Body : " +JSON.stringify(req.body));
    console.log("Request Cookies : ");
    for(const prop in req.myCookies){
        if(Object.hasOwn(req.myCookies, prop)){
            if(prop==="connect.sid"){
                console.log("        " + prop + "=[REDACTED]");
            }
            else{
                console.log("        " + prop + "=" + req.myCookies[prop]);
            }
        }
    }

    next();
});

// require authenticated user for /summary
app.use(functions.authRequired(['/summary', '/edit-profile']));

// make {{user}} variable available for all paths
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

//route handling
app.get('/', (req, res) => {
    res.render('index');
});


app.get('/login', function(req, res) {
    const state = functions.generateRandomString(16);
    res.cookie(stateKey, state);
  
    // requests authorization
    const scope = 'user-top-read user-library-read user-read-private user-read-email user-top-read playlist-modify-private playlist-modify-public';
    res.redirect('https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }).toString());
});


app.get('/callback', async function(req, res) {
    //application requests refresh and access tokens
    //after checking the state parameter
    const code = req.query.code || null;
    const state = req.query.state || null;
    const storedState = req.cookies ? req.cookies[stateKey] : null;
  
    if (state === null || state !== storedState) {
      res.redirect('/#' +
        new URLSearchParams({
            error: 'state_mismatch'
        }).toString());
    } else {
        res.clearCookie(stateKey);

        const data = await functions.getToken(client_id, client_secret, code, redirect_uri);
        const access_token = data.access_token
        const refresh_token = data.refresh_token

        //create user doc
        function success(newUser) {
            functions.startAuthenticatedSession(req, newUser, (err) => {
                if (!err) {
                    console.log(req.session.user);
                    req.session.refresh_token = refresh_token;
                    res.redirect('/');
                } else {
                    res.render('error', {message: 'Internal Server Error'});
                }
            });
        }
        const userData = await functions.useAccessToken('https://api.spotify.com/v1/me', access_token);
        functions.login(userData, access_token, success);
    }
  });
  
app.get('/refresh_token', async function(req, res) {
    // requesting access token from refresh token
    const refresh_token = req.session.refresh_token;
    const data = await functions.getTokenWithRefresh(client_id, client_secret, refresh_token);
    const access_token = data.access_token;
    try {
        const user = await User.findOne({username:username}).exec();
        user.authToken = access_token;
        await user.save();
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('error', {message: 'Internal Server Error'});
    }
    

});

app.get('/summary', async (req, res) => {
    if(req.session.user){
        
        const response = await functions.useAccessToken("https://api.spotify.com/v1/me/top/artists",req.session.user.authToken);
        if(response==="error"){ //get new token if current one expired
            res.redirect('/refresh_token');
        }
        const topArtists = response.items;
        const response2 = await functions.useAccessToken("https://api.spotify.com/v1/me/top/tracks",req.session.user.authToken);
        const topTracks = response2.items;
        if(topTracks.length===0){ //new account with no data
            res.render('summary', {message: "Sorry your account has insufficient data to produce a user sumamry for you"});
        }
        else{
            try {
                const summary = await Summary.findById(req.session.user.summary).exec();
                res.render('summary', {topArtists: topArtists, topTracks: topTracks, summary: summary.description});

            } catch (err){
                console.error(err);
                res.render('error', {message: 'Internal Server Error'});
            }
        }
        
    }
    else{
        res.redirect("/");
    }
});

app.post('/summary', async (req, res) => {
    if(req.session.user){
        const currUser = req.session.user;
        User.findOne({username: currUser.username}).exec(async (err, user) => {
            if(user && !err){
                const response = await functions.useAccessToken("https://api.spotify.com/v1/me/top/tracks",req.session.user.authToken);
                if(response==="error"){ //get new token if current one expired
                    res.redirect('/refresh_token');
                }

                const topTracks = response.items;
                const trackURIs = topTracks.reduce(function(pV, cV, cI){
                    pV.push(cV.uri);
                    return pV;
                }, []);

                await functions.createPlaylist(req.session.user.spotifyID, functions.addToPlaylist, trackURIs, req.session.user.authToken);
                res.redirect('/summary');
            }
            else{
                res.render('error', {message: 'Internal Server Error'});
            }
           });
    }
    else{
      res.redirect("/");
    }
});

app.get('/leaderboards', (req, res) => {
    User.find({}, function(err, users) {
        res.render('leaderboards', {users: users});
     });
});

app.get('/profile/:slug', (req, res) => { 
    User.findOne({slug: req.params.slug}).exec((err, user) => {
      if(user && !err){
        if(user===req.session.user){
            res.render('profile', {user: user, currUser: true});
        }
        else{
            res.render('profile', {user: user, currUser: false});
        }
        
      }
      else{
        res.render('error', {message: 'Internal Server Error'});
      }
     });
     
});

app.get('/edit-profile', (req, res) => {
    if(req.session.user){
        res.render('edit-profile');
    }
    else{
        res.redirect("/");
    }
});

app.post('/edit-profile', (req, res) => {
    if(req.session.user){
        const currUser = req.session.user;
        User.findOne({username: currUser.username}).exec((err, user) => {
            if(user && !err){
                if (req.body!={}){
                    
                    if(typeof (req.body.bio)!=='undefined'){
                        user.bio = req.body.bio;
                    }
                    if(typeof (req.body.favoriteAlbum1)!=='undefined'){
                        user.favoriteAlbums.first = req.body.favoriteAlbum1;
                    }
                    if(typeof (req.body.favoriteAlbum1)!=='undefined'){
                        user.favoriteAlbums.second = req.body.favoriteAlbum2;
                    }
                    if(typeof (req.body.favoriteAlbum1)!=='undefined'){
                        user.favoriteAlbums.third = req.body.favoriteAlbum3;
                    }
                    if(typeof (req.body.favoriteAlbum1)!=='undefined'){
                        user.favoriteAlbums.fourth = req.body.favoriteAlbum4;
                    }
                    if(typeof (req.body.favoriteAlbum1)!=='undefined'){
                        user.favoriteAlbums.fifth = req.body.favoriteAlbum5;
                    }            

                    user.save(function(err,user){
                        if(err){
                            console.error(err);
                          }
                        else{
                            res.render('edit-profile', {message: "Saved"});
                        }
                    });
                }
            }
            else{
                res.render('error', {message: 'Internal Server Error'});
            }
           });
    }
    else{
      res.redirect("/");
    }
  });


app.listen(process.env.PORT || 3000);