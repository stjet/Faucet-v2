const fs = require('fs');

// Constants
const DEFAULT_COINS = ['xdai', 'banano', 'nano', 'vite'];
const DEFAULT_COIN_SETTINGS = [
  {
    name: 'xdai',
    rpc: 'https://rpc.gnosischain.com',
    deps: [{ ethers: '^5.7.2' }],
  },
  {
    name: 'banano',
    rpc: 'https://kaliumapi.appditto.com/api',
    deps: [{ bananojs: 'npm:@bananocoin/bananojs@^2.7.10' }],
  },
  {
    name: 'nano',
    rpc: 'https://proxy.nanos.cc/proxy',
    deps: [{ nanojs: 'npm:@bananocoin/bananojs@^2.7.10' }],
  },
  {
    name: 'vite',
    rpc: 'https://node-vite.thomiz.dev',
    deps: [{ '@vite/vitejs': '^2.3.19' }, { '@vite/vitejs-http': '^2.3.19' }],
  },
];

// Parse config.json
let config = JSON.parse(fs.readFileSync('config.json'));

// Throw error if required is missing
const required = ['name', 'db', 'captcha', 'secrets'];
for (let i in required) {
  if (!Object.keys(config).includes(required[i])) {
    throw new Error(`Required key in config ${required[i]} is missing`);
  }
}

// This is just to make sure user uploaded their logo
if (config.logo === undefined) {
  throw new Error('Make sure to upload logo.png to files/img/ and add a json value "logo" as true to the config.json');
}

if ((process.env.NODE_ENV || '').trim() === 'development') {
  config.debug = true;
}

// See if optional keys exist, if not put them with default values
if (config.port === undefined) config.port = 8080;
if (config.api === undefined) config.api = false;
if (config.owner === undefined) config.owner = 'Unknown';
if (config.notice === undefined) config.notice = false;
if (config.sponsor === undefined) config.sponsor = false;
if (config.captcha.use_splash === undefined) config.captcha.use_splash = false;
if (config.faucet_name === undefined) config.faucet_name = config.owner + ' Faucet';
if (config.unopened_reduced_payouts === undefined) config.unopened_reduced_payouts = false;
if (config.trusted_proxy_count === undefined) config.trusted_proxy_count = false;

let enabled_coins = [];

for (let c_num = 0; c_num < DEFAULT_COIN_SETTINGS.length; c_num++) {
  let coin = DEFAULT_COIN_SETTINGS[c_num];

  if (DEFAULT_COINS.includes(coin.name) && config[coin.name] === coin.name) {
    if (config[coin.name] === undefined) config[coin.name] = { enabled: false };
  }
  if (config[coin.name].enabled === true) {
    enabled_coins.push(coin);

    // TODO: Check if secrets are defined

    if (config[coin.name].claim_frequency === undefined || isNaN(config[coin.name].claim_frequency)) {
      throw new Error(`Missing ${coin} claim frequency, or claim frequency not a number`);
    }

    if (config[coin.name].claim_frequency < 1000 * 60 * 10) {
      throw new Error('Claim frequency is less than 10 minutes. This... is a bad idea. Remember, the value is in milliseconds!');
    }

    if (config[coin.name].address === undefined) {
      throw new Error(`Faucet address for coin ${coin} required, but missing`);
    }

    if (!config[coin.name].rpc && coin.name === DEFAULT_COIN_SETTINGS[c_num].name) {
      config[coin.name].rpc = DEFAULT_COIN_SETTINGS[c_num].rpc;
    }

    if (config[coin.name].default === undefined) {
      config[coin.name].default = false;
    }

    // If 'percentage' is false, it will be set to a random amount in between max and min.
    // If 'percentage' is not false, 'percentage' will be the percent (decimal) of the faucet
    // balance and it should be still adhering to max and min.
    if (config[coin.name].payouts.percentage === undefined) {
      config[coin.name].payouts.percentage = false;
    }

    if (config[coin.name].payouts.min_payout > config[coin.name].payouts.max_payout) {
      throw new Error('Minimum payout cannot be higher than maximum payout');
    }
  }
}

config.blacklist = JSON.parse(fs.readFileSync('blacklist.json'));
config.enabled_coins = enabled_coins.map((enabled_coin) => enabled_coin.name);
config.enabled_coins_paths = enabled_coins.map((enabled_coin) => '/' + enabled_coin.name);

// Create a package.json file based on settings, including command to run index.js (with parameters ofc)
if (process.argv[2] === 'packagesetup') {
  if (config.enabled_coins.length === 0) throw new Error('Faucet has no coins enabled');

  // Description, dependencies, keywords
  let keywords = ['crypto', 'faucet'];
  let description = [];
  let dependencies = {
    'big.js': '6.2.1',
    compression: '^1.7.4',
    'cookie-parser': '^1.4.6',
    express: '^4.18.2',
    mongodb: '^4.12.0',
    'node-fetch': '^2.6.7',
    nunjucks: '^3.2.3',
  };

  // I think this implementation is quite more mantainable
  for (let c_num = 0; c_num < enabled_coins.length; c_num++) {
    let coin = enabled_coins[c_num];
    if (DEFAULT_COINS.includes(coin.name) && c_num !== enabled_coins.length) {
      for (let c_deps in coin.deps) Object.assign(dependencies, coin.deps[c_deps]);
      description.push(coin.name);
      keywords.push(coin.name);
    }
  }

  // Build package
  const package_dependencies = dependencies;
  const package_keywords = keywords;
  const package_description = `A ${description.join(', ')} cryptocurrency faucet made by Prussia and run by ${config.owner}`;

  // JSON stands for JavaScript Object Notation so we don't really need string manipulation
  const package = {
    name: 'faucet-v2',
    version: '2.1.9',
    description: package_description,
    main: 'index.js',
    scripts: {
      main: 'set NODE_ENV=production & node index.js',
      dev: 'set NODE_ENV=development & nodemon -r dotenv/config ./index.js',
    },
    keywords: package_keywords,
    author: 'Jetstream0 <@prussia.dev>',
    license: 'MIT',
    dependencies: package_dependencies,
    devDependencies: {
      dotenv: '^16.0.3',
      nodemon: '^2.0.20',
    },
  };

  fs.writeFileSync('package.json', JSON.stringify(package, null, 2));
}

module.exports = config;
