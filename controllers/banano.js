const config = require('../config');
const banano = require('../cryptos/banano');

const faucet = require('../utils/faucet');
const format = require('../utils/format');
const captcha = require('../utils/captcha');
const score = require('../utils/score');

const faucet_name = config.name;
const faucet_address = config.banano.address;

let blacklisted_addresses = config.blacklist.banano;
let ip_cache = {};
let seed;

// Reset IP cache every 24 hours
setInterval(() => {
  ip_cache = {};
}, 24*60*60*1000);

config.secrets.use_env ? (seed = process.env.bn_seed) : (seed = config.secrets.bn_seed);

banano.set_rpc(config.banano.rpc);

async function get_banano(req, res, next) {
  try {
    if (config.banano.auto_receive && !req.app.locals.receive_banano) {
      req.app.locals.receive_banano = await banano.receive_deposits(seed);
    }

    // DRY
    res.locals.faucet_name = faucet_name.replace('<coin>', 'Banano');
    res.locals.faucet_address = faucet_address;
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.banano.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.banano.default;
    res.locals.given = false;
    res.locals.errors = false;
    res.locals.logo = config.logo;
    res.locals.coin = 'banano';
    return res.render('banano');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

async function post_banano(req, res, next) {
  try {
    let address = req.body.address;
    let errors = false;
    let given = false;
    let balance = false;
    let amount = false;
    let tx;

    // Validate and sanitize address input
    if (!address || typeof address !== "string") errors = 'Empty address field.';
    else address = address.trim();
    if (!banano.is_valid(address)) errors = 'Invalid Banano address.';

    // Check client IP address
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) errors = 'Too many claims from this IP address.';

    // Check if faucet is dry
    if (await banano.dry(faucet_address)) errors = 'Faucet dry.';

    // Check request procedence
    if (!captcha.came_from_site(req)) errors = 'Post request did not come from site.';

    // Check captcha
    const check_captcha = await captcha.get_captcha_success(req.body);
    if (!check_captcha) errors = 'Failed or expired captcha.';

    // Check database
    const too_soon_db = await faucet.claim_too_soon_db(address, 'banano');
    if (too_soon_db) errors = 'Last claim too soon.';

    // Check cookies
    const too_soon_cookies = await faucet.claim_too_soon_cookies(req.cookies, 'banano');
    if (too_soon_cookies) errors = 'Last claim too soon.';

    // Payouts
    let config_payouts = config.banano.payouts;
    let payout = faucet.calculate_payouts(config_payouts);

    // Send Banano
    if (!errors) {
      //Check score
      let recipient_balance = await banano.check_bal(address);
      let recipient_account_history = await banano.get_account_history(address);

      let user_score = await score.get_score({
        account_balance: recipient_balance,
        account_history: recipient_account_history,
        blacklisted_addresses: blacklisted_addresses,
      });

      // Reduce payouts for suspicious accounts
      if ((config.unopened_reduced_payouts && !recipient_account_history) || user_score > 5) {
        payout = config.banano.payouts.min_payout * 0.5;
      }

      // Actually send Banano
      const success = await banano.send(seed, address, payout);
      tx = success;

      if (success) {
        given = true;
        amount = format.format_amount_decimals(payout);

        // Check faucet balance on success
        balance = await banano.check_bal(faucet_address);

        if (ip_cache[ip]) ip_cache[ip] = ip_cache[ip] + 1;
        else ip_cache[ip] = 1;

        await faucet.add_to_db(address, 'banano');
        faucet.add_to_cookies(res, 'banano');
      } else {
        errors = 'There was an error, try again later.';
      }
    }

    // DRY
    res.locals.faucet_name = faucet_name.replace('<coin>', 'Banano');
    res.locals.faucet_address = faucet_address;
    res.locals.current_bal = format.format_amount_decimals(balance);
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.banano.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.banano.default;
    res.locals.logo = config.logo;
    res.locals.amount = amount;
    res.locals.given = given;
    res.locals.given_to = address;
    res.locals.tx = tx;
    res.locals.errors = errors;
    res.locals.coin = 'banano';
    return res.render('banano');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

module.exports = {
  get_banano: get_banano,
  post_banano: post_banano,
};
