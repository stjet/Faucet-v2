const fetch = require('node-fetch');
const config = require("./config.js");

//captcha functions should take in the request body, then return a bool to see if captcha was successful

async function prussia_captcha_request() {
  //get
  let resp = await fetch(config.captcha.prussia_captcha+'/captcha', {method: 'GET'});
	resp = await resp.json();
  challenge_url = config.captcha.prussia_captcha+'/challenge/'+resp.image+"?nonce="+resp.nonce;
  challenge_code = resp.code;
  challenge_nonce = resp.nonce;
  return [challenge_url, challenge_code, challenge_nonce];
}

async function prussia_captcha(req_body) {
  let code = req_body['code'];
  let nonce = req_body['nonce'];
  let guess = req_body['answer'];
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

/*
Additional security for prussia captcha probably needed.
*/
//to disallow external post requests
function came_from_site(req) {
  if (config.self) {
    let host = req.get('host');
    if (host == config.self) {
      return true;
    } else {
      return false;
    }
  }
  return true;
}

if (config.captcha.use == "prussia_captcha") {
  module.exports.get_captcha_success = prussia_captcha;
  module.exports.get_captcha = prussia_captcha_request;
} else if (config.captcha.use == "hcaptcha") {
  module.exports.get_captcha_success = hcaptcha;
}

module.exports.came_from_site = came_from_site;