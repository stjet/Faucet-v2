const fetch = require('node-fetch');

async function request_captcha(captcha_url) {
  let response = await fetch(`${captcha_url}/captcha`, { method: 'GET' });
  response = await response.json();
  return {
    url: `${captcha_url}/challenge/${response.image}?nonce=${response.nonce}`,
    code: response.code,
    nonce: response.nonce,
  };
}

async function validate_captcha(req_body, captcha_url) {
  // Captcha should take in the request body, then return a bool if captcha was successful
  const params = new URLSearchParams({ code: req_body.code, nonce: req_body.nonce, guess: req_body.answer });
  let response = await fetch(`${captcha_url}/captcha`, { method: 'POST', body: params });
  response = await response.json();
  return response.success;
}

module.exports = {
  request_captcha: request_captcha,
  validate_captcha: validate_captcha,
};
