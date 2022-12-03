const controller = require('./controller');
const utils = require('./utils');

function storage(options) {
  return (req, res, next) => {
    // Create a new captcha cache set if not found. Sets are faster to traverse than arrays and objects
    if (!req.app.locals.captcha_cache) req.app.locals.captcha_cache = new Set();

    // Create a new path cache set if undefined.
    if (!req.app.locals.protected_paths) req.app.locals.protected_paths = new Set(options.protected_paths);

    return next();
  };
}

function templating(options) {
  return (req, res, next) => {
    res.locals.captcha_provider_url = options.captcha_provider_url;
    res.locals.captcha_title = options.captcha_title;
    res.locals.expiration_time = options.expiration_time;
    res.locals.return_to = req.path;

    next();
  };
}

function validation() {
  return (req, res, next) => {
    // Parse the signed cookie from the request if found
    if (req.signedCookies.faucet_session) res.locals.faucet_session_cookie = JSON.parse(req.signedCookies.faucet_session);

    // Compare the received cookie against our stored cookie data
    if (utils.check_cookie(res.locals.faucet_session_cookie, req.app.locals.captcha_cache)) res.locals.valid_cookie = true;
    else res.locals.valid_cookie = false;

    next();
  };
}

function captcha(opts) {
  const options = utils.options_builder(opts);
  return [storage(options), templating(options), validation(), controller.splash];
}

module.exports = captcha;
