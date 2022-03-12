//read config, export variables
const fs = require('fs');

let config = JSON.parse(fs.readFileSync('config.json'));

let coins = ['xdai', 'banano', 'nano'];

//throw error if required is missing

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
if (config.favicon == undefined) {
  config.favicon = false;
}
if (config.unopened_reduced_payouts == undefined) {
  config.unopened_reduced_payouts = false;
}

for (let c_num = 0; c_num < coins.length; c_num++) {
  let coin = coins[c_num];
  let default_rpcs = ['https://rpc.xdaichain.com', 'https://kaliumapi.appditto.com/api', 'https://mynano.ninja/api/node'];
  if (config[coin].enabled) {
    if (config[coin].rpc == undefined) {
      config[coin].rpc = default_rpcs[coin];
    }
    //if `percentage` is false, will be random in between max and min. if `percentage` is not false, `percentage` will be the percent of the faucet bal it should be, still adhering to max and min
    if (config[coin].payouts.percentage == undefined) {
      config[coin].payouts.percentage = false;
    }
  }
}

//create a package.json file based on settings, including command to run index.js (with parameters ofc)

//description, dependencies, keywords
let dependencies = {'nunjucks': '^3.2.3', 'express': '^4.17.1', 'body-parser': '^1.19.0', 'cookie-parser': '^1.4.5', 'mongodb': '^3.6.6'};

//add dependencies


/*
{
  "name": "Prussia-Faucet",
  "version": "2.0.0",
  "description": {{ description }},
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [{{ keywords }}],
  "author": "Jetstream0 <@prussia.dev>",
  "license": "MIT",
  "dependencies": {
    {% for dependency in dependencies %}
      {{ dependency }},
    {% endfor %}
  }
}
*/

module.exports = config;