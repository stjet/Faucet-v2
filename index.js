const config = require("./config.js");
const captcha = require("./captcha.js");
const express = require('express');
const nunjucks = require('nunjucks');

const util = require('./util.js');

const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

//templating, web server
nunjucks.configure('templates', { autoescape: true });

const app = express();

app.use(express.static('files'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(cookieParser());

//based on config currencies, set up web servers and import currencies

const captcha_use = config.captcha.use;
const faucet_name = config.faucet_name;

let default_found = false;

let banano;
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
    if (captcha_use == "prussia_captcha") {
			//pass these to nunjucks
      let captcha_info = await captcha.get_captcha();
			challenge_url = captcha_info[0];
			challenge_code = captcha_info[1];
			challenge_nonce = captcha_info[2];
    }
    //claim_time_str, faucet_name, captcha, given, amount, faucet_address, current_bal, errors, (if prussia: challenge_url, challenge_code, challenge_nonce)
    return res.send(nunjucks.render('banano.html', {claim_time_str: claim_time_str, faucet_name: faucet_name, captcha: captcha_use, given: false, amount: false, faucet_address: faucet_address, current_bal: current_bal, errors: false, challenge_url: challenge_url, challenge_code: challenge_code, challenge_nonce: challenge_nonce, extra: extra, extensions: extensions}));
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
      errors = "Too many claims from this IP address";
    }
		//check faucet dry
		//check captcha
    if (!captcha.came_from_site(req)) {
      errors = "Post request did not come from site";
    }
		let success = await captcha.get_captcha_success(req.body);
		if (!success) {
			errors = "Failed or expired captcha";
			//return
		}
		let too_soon_db = await util.claim_too_soon_db(address, "banano");
		//check db
		if (too_soon_db) {
			errors = "Last claim too soon";
		}
		//check cookies
		let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, "banano");
		if (too_soon_cookies) {
			errors = "Last claim too soon";
		}
		//send banano
		//payouts
		let config_payouts = config.banano.payouts;
		let challenge_url, challenge_code, challenge_nonce;
		let payout = util.calculate_payouts(config_payouts);
		let score = await banano.get_score(address);
		//reduce payouts for suspicious accounts
		if (config.unopened_reduced_payouts && await banano.is_unopened(address)) {
			payout = config.banano.payouts.min_payout*0.5;
		} else if (score > 5) {
			payout = config.banano.payouts.min_payout*0.5;
		}
		if (!errors) {
		  let success = await banano.send(address, payout);
		  if (!success) {
		  	errors = "Send failed";
		  } else {
				given = true;
				amount = payout;
        if (ip_cache[ip]) {
          ip_cache[ip] = ip_cache[ip]+1;
        } else {
          ip_cache[ip] = 1;
        }
			}
		} else {
      if (captcha_use == "prussia_captcha") {
        [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
			}
		}
		return res.send(nunjucks.render('banano.html', {claim_time_str: claim_time_str, faucet_name: faucet_name, captcha: captcha_use, given: given, amount: amount, faucet_address: faucet_address, current_bal: current_bal, errors: errors, challenge_url: challenge_url, challenge_code: challenge_code, challenge_nonce: challenge_nonce, extra: extra, extensions: extensions}));
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
	//
  let ip_cache = {};
} else if (config.enabled_coins.includes('xdai')) {
	//
  let ip_cache = {};
} else if (config.enabled_coins.includes('vite')) {
  //
  let ip_cache = {};
}

if (!default_found) {
  app.get('/', async function(req, res) {
    return res.send(nunjucks.render('main.html', {faucet_name: faucet_name, enabled_coins: config.enabled_coins}))
  });
}

app.listen(8081, async () => {
  //recieve banano deposits
  if (config.enabled_coins.includes('banano')) {
    await banano.receive_deposits();
  }
  console.log(`App on`);
});