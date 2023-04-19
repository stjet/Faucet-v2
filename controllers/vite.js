const config = require('../config');
const vite = require('../cryptos/vite');

const faucet = require('../utils/faucet');
const format = require('../utils/format');
const captcha = require('../utils/captcha');

const faucet_name = config.name;
const faucet_address = config.vite.address;

// TODO: If true, faucet will work with token only if there is no supply of VITE
const token_only = config.vite.optional;

let ip_cache = {};
let private_key;

// Reset IP cache every 24 hours
setInterval(() => {
  ip_cache = {};
}, 24*60*60*1000);

config.secrets.use_env ? (private_key = process.env.vite_privkey) : (private_key = config.secrets.vite_privkey);

vite.set_rpc(config.vite.rpc);
vite.receive(faucet_address, private_key);

async function get_vite(req, res, next) {
  try {
    // DRY
    res.locals.faucet_name = faucet_name.replace('<coin>', 'Vite');
    res.locals.faucet_address = faucet_address;
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.vite.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.vite.default;
    res.locals.logo = config.logo;
    res.locals.given = false;
    res.locals.errors = false;
    res.locals.coin = 'vite';
    return res.render('vite');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

async function post_vite(req, res, next) {
  try {
    let address = req.body.address;
    let errors = false;
    let given = false;
    let balance = false;
    let amount = false;

    // Validate and sanitize address input
    if (!address) errors = 'Empty address field.';
    else address = address.trim();
    if (!vite.is_valid(address)) errors = 'Invalid Vite address.';

    // Check client IP address
    let ip = req.header('x-forwarded-for');
    if (ip_cache[ip] > 4) errors = 'Too many claims from this IP address.';

    let send_token = true;
    let send_vite = config.vite?.token ?? true;

    // Check if faucet is dry
    let dry_info = await vite.dry(faucet_address, send_vite, config.vite?.token?.id, config.vite?.token?.amount ?? 0);

    // Sending the token is optional
    if (dry_info.coin || (config.vite.token && dry_info.token && !config.vite.optional)) errors = 'Faucet dry.';
    else if (config.vite.token && dry_info.token && config.vite.optional) send_token = false;

    // Check request procedence
    if (!captcha.came_from_site(req)) errors = 'Post request did not come from site.';

    // Check captcha
    const check_captcha = await captcha.get_captcha_success(req.body);
    if (!check_captcha) errors = 'Failed or expired captcha.';

    // Check database
    const too_soon_db = await faucet.claim_too_soon_db(address, 'vite');
    if (too_soon_db) errors = 'Last claim too soon.';

    // Check cookies
    const too_soon_cookies = await faucet.claim_too_soon_cookies(req.cookies, 'vite');
    if (too_soon_cookies) errors = 'Last claim too soon.';

    // Payouts
    let config_payouts = config.vite.payouts;
    let payout = faucet.calculate_payouts(config_payouts);
    if (payout === 0) send_vite = false;

    // Reduce payouts for suspicious accounts
    if (config.unopened_reduced_payouts && (await vite.is_unopened(address))) {
      payout = config.vite.payouts.min_payout * 0.5;
    }

    // Send Vite
    if (!errors) {
      // With vite, we may want to send tokens also.
      const success = await vite.send(private_key, faucet_address, address, payout, {
        send_vite: send_vite,
        send_token: send_token,
        token_id: config.vite?.token?.id,
        token_amount: config.vite?.token?.amount,
        token_decimals: config.vite?.token?.decimals,
      });

      if (success) {
        given = true;
        amount = format.format_amount_decimals(payout);

        // Check faucet balance on success
        balance = await vite.check_bal(faucet_address);

        if (ip_cache[ip]) ip_cache[ip] = ip_cache[ip] + 1;
        else ip_cache[ip] = 1;

        await faucet.add_to_db(address, 'vite');
        faucet.add_to_cookies(res, 'vite');
      } else {
        errors = 'There was an error, try again later.';
      }
    }

    // DRY
    res.locals.faucet_name = faucet_name.replace('<coin>', 'Vite');
    res.locals.faucet_address = faucet_address;
    res.locals.current_bal = balance;
    res.locals.notice = config.notice;
    res.locals.sponsor = config.sponsor;
    res.locals.claim_time_str = format.milliseconds_to_readable(config.vite.claim_frequency);
    res.locals.sitekey = config.captcha.hcaptcha_sitekey;
    res.locals.is_default = config.vite.default;
    res.locals.logo = config.logo;
    res.locals.amount = amount;
    res.locals.given = given;
    res.locals.given_to = address;
    res.locals.errors = errors;
    res.locals.token = false;
    if (config.vite.token) {
      res.locals.token = config.vite.token.alias;
      res.locals.amount_token = format.format_amount_decimals(config.vite.token.amount);
    }
    res.locals.coin = 'vite';
    return res.render('vite');
  } catch (error) {
    if (config.debug) console.log(error);
    return next(error);
  }
}

module.exports = {
  get_vite: get_vite,
  post_vite: post_vite,
};
