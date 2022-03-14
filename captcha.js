const fetch = require('node-fetch');
const config = require("./config.js");

//captcha functions should take in the request body, then return a bool to see if captcha was successful

async function prussia_captcha(req_body) {
  let code = req_body['code'];
  let nonce = req_body['nonce'];
  let guess = req_body['guess'];
  let params = new URLSearchParams();
  params.append('code', code);
  params.append('nonce', nonce);
  params.append('guess', guess);
  let resp = await fetch(config.captcha.prussia_captcha+'/captcha', {method: 'POST', body: params});
  resp = await resp.json();
  return resp['success'];
}

async function hcaptcha(req_body) {
  let captcha_secret;
  if (config.secrets.use_env) {
    captcha_secret = process.env.captcha_secret;
  } else {
    captcha_secret = config.secrets.captcha_secret;
  }
  let params = new URLSearchParams();
  params.append('response', req_body['h-captcha-response']);
  params.append('secret', captcha_secret);
  let resp = await fetch('https://hcaptcha.com/siteverify', {method: 'POST', body: params});
  resp = await resp.json();
  return resp.data['success'];
}

if (config.captcha.use == "prussia_captcha") {
  module.exports.get_captcha_success = prussia_captcha;
} else if (config.captcha.use == "hcaptcha") {
  module.exports.get_captcha_success = hcaptcha;
}