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
import { access } from 'fs';
import e from 'express';

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
const Leaderboard = mongoose.model('Leaderboard');

app.set('view engine', 'hbs');

//middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session(sessionOptions));

//cookie parser
/*
app.use((req,res,next) => {
    const cookie = req.get('Cookie');
    if(cookie!==undefined){
        const nameValuePairs = cookie.split("; ");
        req.myCookies = {};
    
        //add cookies to myCookies
        for(let i=0; i<nameValuePairs.length; i++){
            const nameAndValue = (nameValuePairs[i]).split("=");
            const name = nameAndValue[0];
            const value = nameAndValue[1];
            req.myCookies[name] = value;
        }
    }

    next();
});
*/
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
app.use(functions.authRequired(['/summary']));

// make {{user}} variable available for all paths
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// logging
app.use((req, res, next) => {
    console.log(req.method, req.path, req.body);
    next();
});

//route handling
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', function(req, res) {
    const state = functions.generateRandomString(16);
    res.cookie(stateKey, state);
  
    // your application requests authorization
    const scope = 'user-read-private user-read-email';
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
    // your application requests refresh and access tokens
    // after checking the state parameter
  
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
  
    if (state === null || state !== storedState) {
      res.redirect('/#' +
        new URLSearchParams({
            error: 'state_mismatch'
        }).toString());
    } else {
        res.clearCookie(stateKey);

        const data = await functions.getToken(client_id, client_secret, code, redirect_uri);
        console.log(data);
        const access_token = data.access_token
        const refresh_token = data.refresh_token

        //create user doc
        function success(newUser) {
            functions.startAuthenticatedSession(req, newUser, (err) => {
                if (!err) {
                    console.log(req.session.user);
                    res.redirect('/');
                } else {
                     
                }
            });
        }
        const userData = await functions.useAccessToken('https://api.spotify.com/v1/me', access_token);
        console.log(userData);
        functions.login(userData, refresh_token, success);
    }
  });
  
  app.get('/refresh_token', async function(req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    const data = await functions.getTokenWithRefresh(client_id, client_secret, refresh_token);
    console.log(data);
    const access_token = data.access_token;
    res.send({
        'access_token': access_token
    });

});

app.get('/summary', (req, res) => {
    res.render('summary');
});

app.get('/leaderboards', (req, res) => {
    res.render('leaderboards');
});

app.get('/profile/:slug', (req, res) => { 
    User.findOne({slug: req.params.slug}).exec((err, user) => {
      if(user && !err){
        if(user.username===req.session.user.username){
            res.render('profile', {user: user, currUser: true});
        }
        else{
            res.render('profile', {user: user, currUser: false});
        }
        
      }
      else{
        //res.render('error', {message: 'User does not exist'});
      }
     });
     
});

app.get('/edit-profile', (req, res) => {
    res.render('edit-profile');
});

app.post('/edit-profile', (req, res) => {
    if(req.session.user){
        const currUser = req.session.user;
        User.findOne({username: currUser.username}).exec((err, user) => {
            if(user && !err){
                if (req.body!={}){
                    if(req.body.username!=''){
                        user.username = req.body.username;
                    }
                    if(req.body.bio!=''){
                        user.bio = req.body.bio;
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
              //res.render('error', {message: 'User does not exist'});
            }
           });
    }
    else{
      res.redirect("/");
    }
  });


app.listen(process.env.PORT || 3000);

