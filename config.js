//read config, export variables
const fs = require('fs');

let config = JSON.parse(fs.readFileSync('config.json'));

let coins = ['xdai', 'banano', 'nano', 'vite'];

//throw error if required is missing
let required = ['name', 'db', 'captcha', 'secrets']
for (let r_num = 0; r_num < required.length; r_num++) {
  let key = config[required[r_num]];
  if (key == undefined) {
    throw new Error('Required key in config `'+key+'` is missing');
  }
}

//this is just to make sure user uploaded their logo
if (!config.logo) {
	throw new Error("Make sure to upload LOGO.png to files/ and add a json value 'logo' as true to the config.json");
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

if (config.faucet_name == undefined) {
  config.faucet_name = config.owner+" Faucet"
}

let enabled_coins = [];
for (let c_num = 0; c_num < coins.length; c_num++) {
  let coin = coins[c_num];
  if (config[coin] == undefined) {
    config[coin] = {enabled: false};
  }
  let default_rpcs = ['https://rpc.xdaichain.com', 'https://kaliumapi.appditto.com/api', 'https://mynano.ninja/api/node', 'https://node-vite.thomiz.dev'];
  if (config[coin].enabled) {
    enabled_coins.push(coin);

    if (config[coin].claim_frequency == undefined || isNaN(config[coin].claim_frequency)) {
      throw new Error('Missing '+coin+' claim frequency, or claim frequency not a number')
    }

    if (config[coin].claim_frequency < 1000*60*10) {
      throw new Error('A claim frequency is less than 10 minutes. This... is a bad idea. Remember, the value is in milliseconds.')
    }

    if (!config[coin].address) {
      throw new Error('Faucet address for coin "'+coin+'" required, but missing')
    }
    
    if (config[coin].rpc == undefined) {
      config[coin].rpc = default_rpcs[coin];
    }
    if (config[coin].default == undefined) {
      config[coin].default = false;
    }
    //if `percentage` is false, will be random in between max and min. if `percentage` is not false, `percentage` will be the percent (decimal) of the faucet bal it should be, still adhering to max and min
    if (config[coin].payouts.percentage == undefined) {
      config[coin].payouts.percentage = false;
    }
		if (config[coin].payouts.min_payout > config[coin].payouts.max_payout) {
			throw new Error("Min payout cannot be more than max payout");
		}
  }
}

config.enabled_coins = enabled_coins;

//add blacklist to config
config.blacklist = JSON.parse(fs.readFileSync('blacklist.json'));

if (process.argv[2] == "packagesetup") {
  /* create a package.json file based on settings, including command to run index.js (with parameters ofc) */

  //description, dependencies, keywords
  //add node fetch to deps? or maybe axios
  let dependencies = {'nunjucks': '^3.2.3', 'express': '^4.17.1', 'body-parser': '^1.19.0', 'cookie-parser': '^1.4.5', 'mongodb': '^3.6.6', 'node-fetch': '2.6.7'};
  let coin_deps = {
    'xdai': ['ethers', '^5.5.1'],
    'banano': ['bananojs', 'npm:@bananocoin/bananojs@^2.4.24'],
    'nano': ['nanojs', 'npm:@bananocoin/bananojs@^2.4.24'],
    'vite': ['@vite/vitejs', '^2.3.18', '@vite/vitejs-http', '^2.3.18']
  };

  //add dependencies
  let activated_coin_num = 0;
  for (let c_num2 = 0; c_num2 < coins.length; c_num2++) {
    let coin = coins[c_num2];
    if (config[coin].enabled) {
      activated_coin_num++;
      for (let c_dep=0; c_dep < Math.floor(coin_deps[coin].length/2); c_dep++) {
        dependencies[coin_deps[coin][c_dep*2]] = coin_deps[coin][c_dep*2+1];
      }
    }
  }

  if (activated_coin_num == 0) {
    throw new Error('Faucet has no coins');
  }

  //generate description, keywords
  let keywords = ['"crypto"','"faucet"'];
  let description = 'A ';
  for (let c_num2 = 0; c_num2 < coins.length; c_num2++) {
    let coin = coins[c_num2];
    if (config[coin].enabled) {
      keywords.push('"'+coin+'"');
      if (c_num2 == coins.length) {
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
    dependencies_string += '\n      "'+Object.keys(dependencies)[dep_num]+'": '+'"'+dependencies[Object.keys(dependencies)[dep_num]]+'"';
    if (dep_num != Object.keys(dependencies).length-1) {
      dependencies_string += ',';
    }
  }

  let package_js_npm_str = `{
    "name": "Prussia-Faucet",
    "version": "2.0.0",
    "description": "`+description+`",
    "main": "index.js",
    "scripts": {
      "main": "node index.js",
      "packagesetup": "node config.js packagesetup"
    },
    "keywords": [`+keywords.join(', ')+`],
    "author": "Jetstream0 <@prussia.dev>",
    "license": "MIT",
    "dependencies": {`+dependencies_string+`
    }
}`;

  //write to package.json
  fs.writeFileSync('package.json', package_js_npm_str);
}

module.exports = config;