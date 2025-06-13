// authenticateMiddleware.js

module.exports = (req, res, next) => {
    console.log('[Auth] Session on request:', req.session);
  
    // If there's a user object in the session, consider the user authenticated
    if (req.session && typeof req.session.user === 'object') {
      req.user = req.session.user;  // attach full user object to req
      console.log('[Auth] User authenticated:', req.user);
      return next();
    }
  
    // No valid session user found
    console.log('[Auth] No authenticated user found');
    return res.status(401).json({ error: 'Not logged in' });
  };