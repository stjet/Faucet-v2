const config = require('./config.js');
const captcha = require('./captcha.js');
const express = require('express');
const nunjucks = require('nunjucks');

const util = require('./util.js');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//templating, web server
nunjucks.configure('templates', { autoescape: true });

const app = express();

app.use(express.static('files'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

//based on config currencies, set up web servers and import currencies

const captcha_use = config.captcha.use;
const faucet_name = config.faucet;

let default_found = false;

let banano;
let nano;
let xdai;
let vite;
if (config.enabled_coins.includes('banano')) {
  let ip_cache = {};
  banano = require('./cryptos/banano.js');
  let extra = {};
  let extensions = {};
  //turn this into claim time string
  let claim_time_str = util.milliseconds_to_readable(config.banano.claim_frequency);
  let faucet_address = config.banano.address;
  async function banano_get_handler(req, res) {
    let current_bal = await banano.check_bal(faucet_address);
    let challenge_url, challenge_code, challenge_nonce;
    if (captcha_use == 'prussia_captcha') {
      //pass these to nunjucks
      let captcha_info = await captcha.get_captcha();
      challenge_url = captcha_info[0];
      challenge_code = captcha_info[1];
      challenge_nonce = captcha_info[2];
    }
    //claim_time_str, faucet_name, captcha, given, amount, faucet_address, current_bal, errors, (if prussia: challenge_url, challenge_code, challenge_nonce)
    return res.send(
      nunjucks.render('banano.html', {
        claim_time_str: claim_time_str,
        faucet_name: faucet_name.replace("<coin>", "Banano"),
        captcha: captcha_use,
        given: false,
        amount: false,
        faucet_address: faucet_address,
        current_bal: current_bal,
        errors: false,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
        extra: extra,
        extensions: extensions,
      })
    );
  }
  async function banano_post_handler(req, res) {
    //claim_time_str, faucet_name, captcha, given, amount, faucet_address, current_bal, errors, (if prussia: challenge_url, challenge_code, challenge_nonce)
    let address = req.body.address;
    let errors = false;
    let amount = false;
    let given = false;
    let current_bal = await banano.check_bal(faucet_address);
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) {
      errors = 'Too many claims from this IP address';
    }
    //check faucet dry
    if (await banano.dry()) {
      errors = 'Faucet dry';
    }
    //check captcha
    if (!captcha.came_from_site(req)) {
      errors = 'Post request did not come from site';
    }
    let success = await captcha.get_captcha_success(req.body);
    if (!success) {
      errors = 'Failed or expired captcha';
      //return
    }
    let too_soon_db = await util.claim_too_soon_db(address, 'banano');
    //check db
    if (too_soon_db) {
      errors = 'Last claim too soon';
    }
    //check cookies
    let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, 'banano');
    if (too_soon_cookies) {
      errors = 'Last claim too soon';
    }
    //send banano
    //payouts
    let config_payouts = config.banano.payouts;
    let challenge_url, challenge_code, challenge_nonce;
    let payout = util.calculate_payouts(config_payouts);
    let score = await banano.get_score(address);
    //reduce payouts for suspicious accounts
    if (config.unopened_reduced_payouts && (await banano.is_unopened(address))) {
      payout = config.banano.payouts.min_payout * 0.5;
    } else if (score > 5) {
      payout = config.banano.payouts.min_payout * 0.5;
    }
    if (!errors) {
      let success = await banano.send(address, payout);
      if (!success) {
        errors = 'Send failed';
      } else {
        given = true;
        amount = util.format_amount_decimals(payout);
        if (ip_cache[ip]) {
          ip_cache[ip] = ip_cache[ip] + 1;
        } else {
          ip_cache[ip] = 1;
        }
        await util.add_to_db(address, 'banano');
        util.add_to_cookies(res, 'banano');
      }
    } else {
      if (captcha_use == 'prussia_captcha') {
        [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
      }
    }
    return res.send(
      nunjucks.render('banano.html', {
        claim_time_str: claim_time_str,
        faucet_name: faucet_name.replace("<coin>", "Banano"),
        captcha: captcha_use,
        given: given,
        amount: amount,
        faucet_address: faucet_address,
        current_bal: current_bal,
        errors: errors,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
        extra: extra,
        extensions: extensions,
      })
    );
  }
  //I am aware we can set a variable to the url path, but I think this is more readable
  if (config.banano.default) {
    default_found = true;
    app.get('/', banano_get_handler);
    //post will go to /banano no matter the default (4 lines from now)
  } else {
    app.get('/banano', banano_get_handler);
  }
  app.post('/banano', banano_post_handler);
} else if (config.enabled_coins.includes('nano')) {
  let ip_cache = {};
  nano = require('./cryptos/nano.js');
  let extra = {};
  let extensions = {};
  //turn this into claim time string
  let claim_time_str = util.milliseconds_to_readable(config.nano.claim_frequency);
  let faucet_address = config.nano.address;
  async function nano_get_handler(req, res) {
    let challenge_url, challenge_code, challenge_nonce;
    if (captcha_use == 'prussia_captcha') {
      //pass these to nunjucks
      let captcha_info = await captcha.get_captcha();
      challenge_url = captcha_info[0];
      challenge_code = captcha_info[1];
      challenge_nonce = captcha_info[2];
    }
    return res.send(
      nunjucks.render('nano.html', {
        claim_time_str: claim_time_str,
        faucet_name: faucet_name.replace("<coin>", "Nano"),
        captcha: captcha_use,
        given: false,
        faucet_address: faucet_address,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
        extra: extra,
        extensions: extensions,
      })
    );
  }
  async function nano_post_handler(req, res) {
    let address = req.body.address;
    let errors = false;
    let amount = false;
    let given = false;
    let current_bal = await nano.check_bal(faucet_address);
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) {
      errors = 'Too many claims from this IP address';
    }
    if (await nano.dry()) {
      errors = 'Faucet dry';
    }
    if (!captcha.came_from_site(req)) {
      errors = 'Post request did not come from site';
    }
    let success = await captcha.get_captcha_success(req.body);
    if (!success) {
      errors = 'Failed or expired captcha';
      //return
    }
    let too_soon_db = await util.claim_too_soon_db(address, 'nano');
    //check db
    if (too_soon_db) {
      errors = 'Last claim too soon';
    }
    //check cookies
    let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, 'nano');
    if (too_soon_cookies) {
      errors = 'Last claim too soon';
    }
    //payouts
    let config_payouts = config.nano.payouts;
    let challenge_url, challenge_code, challenge_nonce;
    let payout = util.calculate_payouts(config_payouts);
    //reduce payouts for suspicious accounts
    if (config.unopened_reduced_payouts && (await nano.is_unopened(address))) {
      payout = config.nano.payouts.min_payout * 0.5;
    }
    if (!errors) {
      let success = await nano.send(address, payout);
      if (!success) {
        errors = 'Send failed';
      } else {
        given = true;
        amount = util.format_amount_decimals(payout);
        if (ip_cache[ip]) {
          ip_cache[ip] = ip_cache[ip] + 1;
        } else {
          ip_cache[ip] = 1;
        }
        await util.add_to_db(address, 'nano');
        util.add_to_cookies(res, 'nano');
      }
    } else {
      if (captcha_use == 'prussia_captcha') {
        [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
      }
    }
    return res.send(
      nunjucks.render('nano.html', {
        claim_time_str: claim_time_str,
        faucet_name: faucet_name.replace("<coin>", "Nano"),
        captcha: captcha_use,
        given: given,
        amount: amount,
        faucet_address: faucet_address,
        current_bal: current_bal,
        errors: errors,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
        extra: extra,
        extensions: extensions,
      })
    );
  }
  if (config.nano.default) {
    default_found = true;
    app.get('/', nano_get_handler);
  } else {
    app.get('/nano', nano_get_handler);
  }
  app.post('/nano', nano_post_handler);
} else if (config.enabled_coins.includes('xdai')) {
  //
  let ip_cache = {};
  xdai = require('./cryptos/xdai.js');
  let extra = {};
  let extensions = {};
  //turn this into claim time string
  let claim_time_str = util.milliseconds_to_readable(config.xdai.claim_frequency);
  let faucet_address = config.xdai.address;
  async function xdai_get_handler(req, res) {
    let challenge_url, challenge_code, challenge_nonce;
    if (captcha_use == 'prussia_captcha') {
      //pass these to nunjucks
      let captcha_info = await captcha.get_captcha();
      challenge_url = captcha_info[0];
      challenge_code = captcha_info[1];
      challenge_nonce = captcha_info[2];
    }
    return res.send(
      nunjucks.render('xdai.html', {
        //faucet_name, amount, faucet_address, errors,amount ,address, captcha
        faucet_name: faucet_name.replace("<coin>", "xDai"),
        faucet_address: faucet_address,
        errors: false,
        captcha: captcha_use,
        given: false,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
      })
    );
  }
  async function xdai_post_handler(req, res) {
    let address = req.body.address;
    let errors = false;
    let amount = false;
    let given = false;
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) {
      errors = 'Too many claims from this IP address';
    }
    if (await xdai.dry()) {
      errors = 'Faucet dry';
    }
    if (!captcha.came_from_site(req)) {
      errors = 'Post request did not come from site';
    }
    let success = await captcha.get_captcha_success(req.body);
    if (!success) {
      errors = 'Failed or expired captcha';
      //return
    }
    let too_soon_db = await util.claim_too_soon_db(address, 'xdai');
    //check db
    if (too_soon_db) {
      errors = 'Last claim too soon';
    }
    //check cookies
    let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, 'xdai');
    if (too_soon_cookies) {
      errors = 'Last claim too soon';
    }
    //payouts
    let config_payouts = config.xdai.payouts;
    let challenge_url, challenge_code, challenge_nonce;
    let payout = util.calculate_payouts(config_payouts);
    //reduce payouts for suspicious accounts
    if (config.unopened_reduced_payouts && (await xdai.is_unopened(address))) {
      payout = config.xdai.payouts.min_payout * 0.5;
    }
    if (!errors) {
      let success = await xdai.send(address, payout);
      if (!success) {
        errors = 'Send failed';
      } else {
        given = true;
        amount = util.format_amount_decimals(payout);
        if (ip_cache[ip]) {
          ip_cache[ip] = ip_cache[ip] + 1;
        } else {
          ip_cache[ip] = 1;
        }
        await util.add_to_db(address, 'xdai');
        util.add_to_cookies(res, 'xdai');
      }
    } else {
      if (captcha_use == 'prussia_captcha') {
        [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
      }
    }
    return res.send(
      nunjucks.render('xdai.html', {
        faucet_name: faucet_name,
        faucet_address: faucet_address,
        errors: errors,
        captcha: captcha_use,
        given: given,
        amount: amount,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
      })
    );
  }
  if (config.xdai.default) {
    default_found = true;
    app.get('/', xdai_get_handler);
  } else {
    app.get('/xdai', xdai_get_handler);
  }
  app.post('/xdai', xdai_post_handler);
} else if (config.enabled_coins.includes('vite')) {
  let ip_cache = {};
  vite = require('./cryptos/vite.js');
  vite.receive.start({
    checkTime: 3000,
    transctionNumber: 10,
  });
  let extra = {};
  let extensions = {};
  //turn this into claim time string
  let claim_time_str = util.milliseconds_to_readable(config.vite.claim_frequency);
  let faucet_address = config.vite.address;
  //vite is special, in that we also want it to send tokens. should probably also do this for xdai eventually
  async function vite_get_handler(req, res) {
    let challenge_url, challenge_code, challenge_nonce;
    if (captcha_use == 'prussia_captcha') {
      //pass these to nunjucks
      let captcha_info = await captcha.get_captcha();
      challenge_url = captcha_info[0];
      challenge_code = captcha_info[1];
      challenge_nonce = captcha_info[2];
    }
    return res.send(
      nunjucks.render('vite.html', {
        errors: false,
        given: false,
        captcha: captcha_use,
        challenge_url: challenge_url,
        challenge_code: challenge_code,
        challenge_nonce: challenge_nonce,
      })
    );
  }
  async function vite_post_handler(req, res) {
    let address = req.body.address;
    let errors = false;
    let amount = false;
    let given = false;
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) {
      errors = 'Too many claims from this IP address';
    }
    let send_token = true;
    let send_vite = true;
    let dry_info = await vite.dry();
    if ((dry_info[0] && !config.vite.optional) || (config.vite.token && dry_info[1])) {
      errors = 'Faucet dry';
    } else if (!dry_info[0]) {
      send_vite = false;
    } else if (!dry_info[1]) {
      send_token = false;
    }
    if (!captcha.came_from_site(req)) {
      errors = 'Post request did not come from site';
    }
    let success = await captcha.get_captcha_success(req.body);
    if (!success) {
      errors = 'Failed or expired captcha';
      //return
    }
    let too_soon_db = await util.claim_too_soon_db(address, 'vite');
    //check db
    if (too_soon_db) {
      errors = 'Last claim too soon';
    }
    //check cookies
    let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, 'vite');
    if (too_soon_cookies) {
      errors = 'Last claim too soon';
    }
    //payouts
    let config_payouts = config.vite.payouts;
    let challenge_url, challenge_code, challenge_nonce;
    let payout = util.calculate_payouts(config_payouts);
    if (payout === 0) {
      send_vite = false;
    }
    //reduce payouts for suspicious accounts
    if (config.unopened_reduced_payouts && (await vite.is_unopened(address))) {
      payout = config.vite.payouts.min_payout * 0.5;
    }
    if (!errors) {
      //with vite, we may want to send tokens also. Luckily, this is all handled in crypto/vite.js
      let success = await vite.send(address, payout, (send_vite = send_vite), (send_token = send_token));
      if (!success) {
        errors = 'Send failed';
      } else {
        given = true;
        amount = util.format_amount_decimals(payout);
        if (ip_cache[ip]) {
          ip_cache[ip] = ip_cache[ip] + 1;
        } else {
          ip_cache[ip] = 1;
        }
        await util.add_to_db(address, 'vite');
        util.add_to_cookies(res, 'vite');
      }
    } else {
      if (captcha_use == 'prussia_captcha') {
        [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
      }
    }
    if (!config.vite.token) {
      return res.send(
        nunjucks.render('vite.html', {
          errors: errors,
          given: given,
          captcha: captcha_use,
          challenge_url: challenge_url,
          challenge_code: challenge_code,
          challenge_nonce: challenge_nonce,
          amount: amount,
          address: address,
          faucet_address: faucet_address,
          token: false,
        })
      );
    } else {
      return res.send(
        nunjucks.render('vite.html', {
          errors: errors,
          given: given,
          captcha: captcha_use,
          challenge_url: challenge_url,
          challenge_code: challenge_code,
          challenge_nonce: challenge_nonce,
          amount: amount,
          address: address,
          faucet_address: faucet_address,
          token: config.vite.token.id,
          amount_token: config.vite.token.amount,
        })
      );
    }
  }
  if (config.vite.default) {
    default_found = true;
    app.get('/', vite_get_handler);
  } else {
    app.get('/vite', vite_get_handler);
  }
  app.post('/vite', vite_post_handler);
}

if (!default_found) {
  app.get('/', async function (req, res) {
    return res.send(nunjucks.render('main.html', { faucet_name: faucet_name.replace("<coin>", ""), enabled_coins: config.enabled_coins }));
  });
}

app.listen(8080, async () => {
  //recieve banano deposits (nano's POW is much more expensive, so public nodes don't like it when receive_deposits is called)
  if (config.enabled_coins.includes('banano')) {
    await banano.receive_deposits();
  }
  console.log(`App on`);
});
