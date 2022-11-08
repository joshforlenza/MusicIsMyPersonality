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
    //|| state !== storedState
  
    if (state === null) {
      res.redirect('/#' +
        new URLSearchParams({
            error: 'state_mismatch'
        }).toString());
    } else {
        res.clearCookie(stateKey);
        /*
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
            },
            headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };
        */

        
        //const data = functions._getToken();
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
            }),
        });

        const data = await result.json();
        console.log(data);
      
      /*
      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
  
          var access_token = body.access_token,
              refresh_token = body.refresh_token;
  
          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
  
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            console.log(body);
          });
  
          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            new URLSearchParams({
                access_token: access_token,
                refresh_token: refresh_token
            }).toString());
        } else {
          res.redirect('/#' +
            new URLSearchParams({
                error: 'invalid_token'
            }).toString());
        }
      });
      */

    }
  });
  
  app.get('/refresh_token', function(req, res) {
  
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
});

app.get('/summary', (req, res) => {
    res.render('summary');
});

app.get('/leaderboards', (req, res) => {
    res.render('leaderboards');
});

app.get('/profile/:slug', (req, res) => {
    const test = new User({
        username: 'Josh123',
        email: 'joshforlenza@gmail.com',
        password: 'abcd123',
        // username provided by Spotify API plugin
        // password hash provided by Spotify API plugin
        bio: 'Lol'
    })
    test.save(function(err,user){
        if(err){
            console.error(err);
          }
          else{
            res.render('profile', {user: user});
          }
    })
    /*
    User.findOne({slug: req.params.slug}).exec((err, user) => {
      if(user && !err){
        res.render('profile', {user: user});
      }
      else{
        res.render('error', {message: 'User does not exist'});
      }
     });
     */
});



app.listen(process.env.PORT || 3000);

