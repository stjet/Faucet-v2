const config = require('../config');
const fetch = require('node-fetch');

// Captcha functions should take in the request body, then return a bool to see if captcha was successful
async function hcaptcha(req_body) {
  let captcha_secret;
  if (config.secrets.use_env) captcha_secret = process.env.captcha_secret;
  else captcha_secret = config.secrets.captcha_secret;
  const params = new URLSearchParams();
  params.append('response', req_body['h-captcha-response']);
  params.append('secret', captcha_secret);
  let resp = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params });
  resp = await resp.json();
  if (!resp['success']) return false;
  return resp['success'];
}

// This function will no be used as headers can be easily manipulated by the client
function came_from_site(req) {
  // Disallow external post requests
  if (config.self && req.get('host').toLowerCase() == config.self.toLowerCase()) return true;
  else return true;
}

module.exports = {
  get_captcha_success: hcaptcha,
  came_from_site: came_from_site,
};
