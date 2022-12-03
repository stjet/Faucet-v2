const config = require('./config.js');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const nunjucks = require('nunjucks');

// Express setup
const app = express();

// Templating engine
nunjucks.configure('templates', { autoescape: true, express: app });

// Express settings
app.set('view engine', 'html');
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.captcha_secret));
app.use(express.static(path.join(__dirname, 'files')));

// Based on config currencies, set up default faucet and routes
if (config.banano.default) app.locals.default_faucet = 'banano';
else if (config.nano.default) app.locals.default_faucet = 'nano';
else if (config.xdai.default) app.locals.default_faucet = 'xdai';
else if (config.vite.default) app.locals.default_faucet = 'vite';
else app.locals.default_faucet = null;

// Then make it available to through the lifetime of the app
const use_default = app.locals.default_faucet;

// Prussia Captcha Splash Middleware
if (config.captcha.use_splash) {
  const splash = require('./utils/splash/middleware');

  app.use(
    splash({
      captcha_title: config.name.replace('<coin>', ''),
      valid_redirect_to: '/',
      invalid_redirect_to: '/captcha',
      authentication_paths: ['/captcha'],
      protected_paths: config.enabled_coins_paths,
    })
  );
}

// Banano
if (config.enabled_coins.includes('banano')) {
  banano_controller = require('./controllers/banano.js');

  app.get(use_default === 'banano' ? '/' : '/banano', banano_controller.get_banano);
  app.post(use_default === 'banano' ? '/' : '/banano', banano_controller.post_banano);
}

// Nano
if (config.enabled_coins.includes('nano')) {
  nano_controller = require('./controllers/nano.js');

  app.get(use_default === 'nano' ? '/' : '/nano', nano_controller.get_nano);
  app.post(use_default === 'nano' ? '/' : '/nano', nano_controller.post_nano);
}

// xDai
if (config.enabled_coins.includes('xdai')) {
  xdai_controller = require('./controllers/xdai.js');

  app.get(use_default === 'xdai' ? '/' : '/xdai', xdai_controller.get_xdai);
  app.post(use_default === 'xdai' ? '/' : '/xdai', xdai_controller.post_xdai);
}

// Vite
if (config.enabled_coins.includes('vite')) {
  vite_controller = require('./controllers/vite.js');

  app.get(use_default === 'vite' ? '/' : '/vite', vite_controller.get_vite);
  app.post(use_default === 'vite' ? '/' : '/vite', vite_controller.post_vite);
}

// If no default faucet was found in config, use a generic route
if (use_default === null) {
  app.get('/', async function (req, res) {
    res.locals.faucet_name = config.name.replace('<coin>', '');
    res.locals.enabled_coins = config.enabled_coins;
    return res.render('index');
  });
}

// Error handlers
app.use([
  (req, res, next) => {
    res.locals.faucet_name = config.name.replace('<coin>', '');
    res.locals.error = {
      status: '404 Not Found',
      message: 'The server cannot find the requested resource.',
    };
    res.status(404);
    return res.render('error');
  },
  (error, req, res, next) => {
    if (config.debug) console.log(error);
    if (error.status === 405) {
      res.status(405);
      res.locals.error = {
        status: '405 Method Not Allowed',
        message: 'The method received in the request is not supported by the target resource.',
      };
    } else {
      res.status(500);
      res.locals.error = {
        status: '500 Internal Server Error',
        message: 'Something went wrong, please contact the developer if the problem persists.',
      };
    }
    res.locals.faucet_name = config.name.replace('<coin>', '');
    return res.render('error');
  },
]);

app.listen(config.port, async () => {
  // Proof of work for Nano is expensive and it is a feature we recommend to have disabled
  app.locals.received_nano = false;
  app.locals.received_banano = false;
  console.log(`App running on port ${config.port}`);
});
