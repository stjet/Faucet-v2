//read config, export variables
const fs = require('fs');

let config = JSON.parse(fs.readFileSync('config.json'));

let coins = ['xdai', 'banano', 'nano'];

//throw error if required is missing
let required = ['name', 'db', 'claim_frequency', 'captcha', 'logo', 'secrets']
for (let r_num = 0; r_num < required.length; r_num++) {
  let key = config[r_num];
  if (key == undefined) {
    throw new Error('Required key in config `'+key+'` is missing');
  }
}

//cannot be empty or undefined
if (!config.db.collection || !config.db.db_connection_string) {
  throw new Error('Missing mongodb info in config');
}

if (!config.captcha.use || !['hcaptcha', 'prussia_captcha'].includes(config.captcha.use)) {
  throw new Error('Missing or invalid captcha use in config');
}
//secrets stuff

//see if optional keys exist, if not put them with default values
if (config.api == undefined) {
  config.api = false;
}
if (config.debug == undefined) {
  config.api = false;
}
if (config.port == undefined) {
  config.port = 8080;
}
if (config.owner == undefined) {
  config.owner = 'Unknown';
}
if (config.favicon == undefined) {
  config.favicon = false;
}
if (config.unopened_reduced_payouts == undefined) {
  config.unopened_reduced_payouts = false;
}

for (let c_num = 0; c_num < coins.length; c_num++) {
  let coin = coins[c_num];
  if (config[coin] == undefined) {
    config[coin] = {enabled: false};
  }
  let default_rpcs = ['https://rpc.xdaichain.com', 'https://kaliumapi.appditto.com/api', 'https://mynano.ninja/api/node'];
  if (config[coin].enabled) {
    if (config[coin].rpc == undefined) {
      config[coin].rpc = default_rpcs[coin];
    }
    if (config[coin].default == undefined) {
      config[coin].default = false;
    }
    //if `percentage` is false, will be random in between max and min. if `percentage` is not false, `percentage` will be the percent of the faucet bal it should be, still adhering to max and min
    if (config[coin].payouts.percentage == undefined) {
      config[coin].payouts.percentage = false;
    }
  }
}

/* create a package.json file based on settings, including command to run index.js (with parameters ofc) */

//description, dependencies, keywords
//add node fetch to deps? or maybe axios
let dependencies = {'nunjucks': '^3.2.3', 'express': '^4.17.1', 'body-parser': '^1.19.0', 'cookie-parser': '^1.4.5', 'mongodb': '^3.6.6', 'node-fetch': '^3.2.3'};
let coin_deps = {
  'xdai': ['ethers', '^5.5.1'],
  'banano': ['bananojs', 'npm:@bananocoin/bananojs@^2.4.24'],
  'nano': ['nanojs', 'npm:@bananocoin/bananojs@^2.4.24']
};

//add dependencies
let activated_coin_num = 0;
for (let c_num2 = 0; c_num2 < coins.length; c_num2++) {
  let coin = coins[c_num2];
  if (config[coin].enabled) {
    activated_coin_num++;
    dependencies[coin_deps[coin][0]] = coin_deps[coin][1];
  }
}

if (activated_coin_num == 0) {
  throw new Error('Faucet has no coins');
}

//generate description, keywords
let keywords = ['"crypto"','"faucet"'];
let description = 'A ';
let activated_coins = [];
for (let c_num2 = 0; c_num2 < coins.length; c_num2++) {
  let coin = coins[c_num2];
  if (config[coin].enabled) {
    keywords.push('"'+coin+'"');
    if (activated_coin_num == coins.length) {
      description += coin+' ';
    } else if (activated_coin_num != 1) {
      description += coin+', ';
    } else {
      description += coin+' ';
    }
  }
}
description += 'cryptocurrency faucet made by Prussia. And run by ';
description += config.owner;

//change dependencies into readable form
let dependencies_string = "";
for (let dep_num=0; dep_num < Object.keys(dependencies).length; dep_num++) {
  dependencies_string += "\n    "Object.keys(dependencies)[dep_num]+": "+'"'+[dependenciesObject].keys(dependencies)[dep_num]]+'",';
}

let package_js_npm_str = `{
  "name": "Prussia-Faucet",
  "version": "2.0.0",
  "description": `+description+`,
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [`+keywords.join(', ')+`],
  "author": "Jetstream0 <@prussia.dev>",
  "license": "MIT",
  "dependencies": {`+dependencies_string+`
  }
}`;

//write to package.json
fs.writeFileSync('package.json', package_js_npm_str);

module.exports = config;