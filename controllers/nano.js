const config = require('../config');
const nano = require('../cryptos/nano');

const faucet = require('../utils/faucet');
const format = require('../utils/format');
const captcha = require('../utils/captcha');
const score = require('../utils/score');

const faucet_name = config.name;
const faucet_address = config.nano.address;

let blacklisted_addresses = config.blacklist.nano;
let ip_cache = {};
let seed;

setInterval(() =>  {
  ip_cache = {};
}, 24*60*60*1000);

config.secrets.use_env ? (seed = process.env.bn_seed) : (seed = config.secrets.bn_seed);

nano.set_rpc(config.nano.rpc);

if (config.nano.auth && config.secrets.use_env) nano.set_auth(process.env.nano_apikey);
else if (config.nano.auth) nano.set_auth(config.nano.auth);

async function get_nano(req, res, next) {
  try {
    if (config.nano.auto_receive && !req.app.locals.receive_nano) {
      req.app.locals.receive_nano = await nano.receive_deposits(seed);
    }

    // DRY
    res.locals.faucet_name = config.name.replace('<coin>', 'Nano');
    res.locals.faucet_address = faucet_address;
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.nano.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.nano.default;
    res.locals.logo = config.logo;
    res.locals.given = false;
    res.locals.errors = false;
    res.locals.coin = 'nano';
    return res.render('nano');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

async function post_nano(req, res, next) {
  try {
    let address = req.body.address;
    let errors = false;
    let given = false;
    let balance = false;
    let amount = false;
    let tx;

    // Validate and sanitize address input
    if (!address) errors = 'Empty address field.';
    else address = address.trim();
    if (!nano.is_valid(address)) errors = 'Invalid Nano address.';

    // Check client IP address
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) errors = 'Too many claims from this IP address.';

    // Check if faucet is dry
    if (await nano.dry(faucet_address)) errors = 'Faucet dry.';

    // Check request procedence
    if (!captcha.came_from_site(req)) errors = 'Post request did not come from site.';

    // Check captcha
    const check_captcha = await captcha.get_captcha_success(req.body);
    if (!check_captcha) errors = 'Failed or expired captcha.';

    // Check database
    const too_soon_db = await faucet.claim_too_soon_db(address, 'nano');
    if (too_soon_db) errors = 'Last claim too soon.';

    // Check cookies
    const too_soon_cookies = await faucet.claim_too_soon_cookies(req.cookies, 'nano');
    if (too_soon_cookies) errors = 'Last claim too soon.';

    // Payouts
    let config_payouts = config.nano.payouts;
    let payout = faucet.calculate_payouts(config_payouts);

    // Send Nano
    if (!errors) {
      let recipient_balance = await nano.check_bal(address);
      let recipient_account_history = await nano.get_account_history(address);

      let user_score = await score.get_score({
        account_balance: recipient_balance,
        account_history: recipient_account_history,
        blacklisted_addresses: blacklisted_addresses,
      });

      // Reduce payouts for suspicious accounts
      if ((config.unopened_reduced_payouts && !recipient_account_history) || user_score > 5) {
        payout = config.nano.payouts.min_payout * 0.5;
      }

      // Actually send Nano now
      const success = await nano.send(seed, address, payout);
      tx = success;

      if (success) {
        given = true;
        amount = format.format_amount_decimals(payout);

        // Check faucet balance on success
        balance = await nano.check_bal(faucet_address);

        if (ip_cache[ip]) ip_cache[ip] = ip_cache[ip] + 1;
        else ip_cache[ip] = 1;

        await faucet.add_to_db(address, 'nano');
        faucet.add_to_cookies(res, 'nano');
      } else {
        errors = 'There was an error, try again later.';
      }
    }

    // DRY
    res.locals.faucet_name = faucet_name.replace('<coin>', 'Nano');
    res.locals.faucet_address = faucet_address;
    res.locals.current_bal = balance;
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.nano.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.nano.default;
    res.locals.logo = config.logo;
    res.locals.amount = amount;
    res.locals.given = given;
    res.locals.given_to = address;
    res.locals.tx = tx;
    res.locals.errors = errors;
    res.locals.coin = 'nano';
    return res.render('nano');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

module.exports = {
  get_nano: get_nano,
  post_nano: post_nano,
};
