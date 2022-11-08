import { URLSearchParams } from 'url';
import fetch from 'node-fetch'

const User = mongoose.model('User');

export const startAuthenticatedSession = (req, user, cb) => {
    req.session.regenerate((err) => {
      if (!err) {
        req.session.user = user;
      } else {
        console.err(err);
      }
      cb(err);
    });
  };
  
export const endAuthenticatedSession = (req, cb) => {
    req.session.destroy((err) => { cb(err); });
  };
  
export const login = (userData, callback) => {
    const username = userData.display_name;
    User.findOne({username:username},(err, result) => {
        if(result){
          console.log("USER HAS ALREADY LOGGED IN");
          callback(user);
        }
        else if (err){
            console.err(err);
        }
        else{ //create user
            const newUser = new User({
                username: userData.display_name,
                refreshToken: refresh_token,
                bio: "Hey it's Josh"
            });
            newUser.save(function(err,user){
                if(err){
                    console.error(err);
                  }
                else{
                    callback(user);
                }
            })
        }
      });
    
  };

export const authRequired = authRequiredPaths => {
    return (req, res, next) => {
      if(authRequiredPaths.includes(req.path)) {
        if(!req.session.user) {
          res.redirect('/'); 
        } else {
          next(); 
        }
      } else {
        next(); 
      }
    };
  };

  /**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
export const generateRandomString = function(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

export const getToken = async (client_id, client_secret, code, redirect_uri) => {
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
    return data;
}

export const getTokenWithRefresh = async (client_id, client_secret, refresh_token) => {
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded', 
            'Authorization' : 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        }),
    });

    const data = await result.json();
    return data;
}

export const useAccessToken = async (url, access_token) => {
    const result = await fetch(url, {
        headers: {
            'Authorization' : 'Bearer ' + access_token 
        }
    });

    const data = await result.json();
    return data;
}

