const config = require("./config.js");
const captcha = require("./captcha.js");
const express = require('express');
const nunjucks = require('nunjucks');

const {milliseconds_to_readable, insert, replace, find, count} = require('./util.js');

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

let banano;
if (config.enabled_coins.includes('banano')) {
  banano = require('./cryptos/banano.js');
  //turn this into claim time string
  let claim_time_str = milliseconds_to_readable(config.banano.claim_frequency);
  let faucet_address = config.banano.address;
  async function banano_get_handler(req, res) {
    let current_bal = await banano.check_bal(faucet_address);
    let challenge_url, challenge_code, challenge_nonce;
    if (captcha_use == "prussia_captcha") {
      let [challenge_url, challenge_code, challenge_nonce] = await captcha.get_captcha();
      //pass these to nunjucks
    }
    //claim_time_str, faucet_name, captcha, given, amount, faucet_address, current_bal, errors, (if prussia: challenge_url, challenge_code, challenge_nonce)
    return res.send(nunjucks.render('index.html', {claim_time_str: claim_time_str, faucet_name: faucet_name, captcha: captcha_use, given: false, amount: false, faucet_address: faucet_address, current_bal: current_bal, errors: false, challenge_url: challenge_url, challenge_code: challenge_code, challenge_nonce: challenge_nonce}));
  }
  async function banano_post_handler(req, res) {
		//claim_time_str, faucet_name, captcha, given, amount, faucet_address, current_bal, errors, (if prussia: challenge_url, challenge_code, challenge_nonce)
    let address = req.body.address;
		let errors = false;
		let given = false;
		//check captcha
		let success = await captcha.get_captcha_success(req.body);
		if (!success) {
			//
		}
		let too_soon_db = await util.claim_too_soon_db(address, "banano");
		//check db
		if (too_soon_db) {
			//
		}
		//check cookies
		let too_soon_cookies = await util.claim_too_soon_cookies(req.cookies, "banano");
		if (too_soon_cookies) {
			//
		}
		//send banano
		//
  }
  //I am aware we can set a variable to the url path, but I think this is more readable
  if (config.banano.default) {
    app.get('/', banano_get_handler);
    app.post('/', banano_post_handler);
  } else {
    app.get('/banano', banano_get_handler);
    app.post('/banano', banano_post_handler);
  }
}

app.listen(8081, async () => {
  //recieve banano deposits
  if (config.enabled_coins.includes('banano')) {
    await banano.receive_deposits();
  }
  console.log(`App on`);
});