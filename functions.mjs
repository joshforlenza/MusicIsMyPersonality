import { URLSearchParams } from 'url';

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

export const _getToken = async () => {

    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/x-www-form-urlencoded', 
            'Authorization' : 'Basic ' + Buffer.from(clientId + ':' + clientSecret, 'base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri
        }),
    });

    const data = await result.json();
    return data.access_token;
}

