const engine = require('./engine');
const template = require('./template');
const services = require('./services');
const HttpError = require('./error');

async function splash(req, res, next) {
  try {
    if (res.locals.valid_cookie || !req.app.locals.protected_paths.has(req.path)) return next();

    if (req.method === 'GET' || req.method === 'POST') {
      res.locals.captcha = await services.request_captcha(res.locals.captcha_provider_url);
    }

    if (req.method === 'POST') {
      if (await services.validate_captcha(req.body, res.locals.captcha_provider_url)) {
        req.app.locals.captcha_cache.add({ timestamp: Date.now(), token: req.body.nonce });
        res.cookie('faucet_session', JSON.stringify({ timestamp: Date.now(), token: req.body.nonce }), {
          maxAge: res.locals.expiration_time,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          signed: true,
        });

        return res.redirect(req.path);
      } else {
        res.locals.error = 'Invalid captcha.';
      }
    }

    if (req.method !== 'GET' && req.method !== 'POST' && !res.locals.error) {
      throw new HttpError.HttpMethodNotAllowed('Method Not Allowed');
    }

    return res.send(engine.render(res.locals, template));
  } catch (error) {
    if (res.locals.debug) console.log(error);
    next(error);
  }
}

module.exports.splash = splash;
