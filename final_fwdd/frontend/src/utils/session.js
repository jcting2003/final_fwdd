// backend/utils/session.js
function saveSession(req) {
    return new Promise((resolve, reject) => {
      req.session.save(err => (err ? reject(err) : resolve()));
    });
  }
  
  module.exports = { saveSession };
  