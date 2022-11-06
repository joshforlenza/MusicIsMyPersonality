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