# Configuration
The faucet configuration is very easy to do, but it is known that JSON can be quite unforgiving to unexperienced eyes. Carefully setting up the `config.json` file will make the deployment a very straightforward process.

Even though the `config.json` file can look intimidating, there are only a handful of properties you need to set up to run the faucet.

## Properties description

### Global `config.json` properties
- `self`: The url of your faucet, might cause problems if set incorrectly
- `name`: The name of your faucet. Do not remove `<coin>` as it will be replaced with the name of the coins enabled
- `db`: Database. MongoDB is hardcoded, so this should not be changed
- `port`: The port of the faucet's server
- `owner`: The faucet owners name
- `logo`: Your logo. To use a custom logo, set to `true` and place your own `logo.png` inside `files/img/`. If false or left undefined, it will display a generic logo
- `unopened_reduced_payouts`: Set to `true` to reduce payouts to unopened accounts

### `secrets` properties
***Warning:*** *Do NOT declare seeds or private keys inside this property as it is a very unsafe practice, instead use a `.env` file.* _See [secrets.md](secrets.md)_
- `use_env`: Defaults to `true`. Do not change

### `notice` properties
Set to `false` if you do not want to display any notice.
- `title`: The title of the notice 
- `content`: The content of the notice 
- `link`: The link inside of the notice. Set to `false` if you do not want to display a link.

### `sponsor` properties
Set to `false` if you do not want to display any sponsor. *Only works for Banano*

- `name`: The name of the sponsor 
- `link`: The link of the sponsor.

### `captcha` properties

- `hcaptcha_sitekey`: Your public hCaptcha Site Key.
- `use_splash`: Set to `false` to disable the Prussia Captcha Splash Middleware 
- `prussia_captcha`: The main server url for Prussia Captcha; do not change unless you can run your own.

### `coin` properties

- `claim_frequency`: Claim frequency time in milliseconds.
- `enabled`: Set to `false` to disable the coin; you do not need to remove all of the coin properties to disable it.
- `auto_receive`: Set to `false` to prevent the server from automatically receiving deposits to the faucet account. Not recommended to use with Nano as the proof of work is expensive. *Only works for Nano and Banano*
- `address`: The address of the faucet. Make sure it's the same as the seed you declare in the secrets, and that is the first account of that seed
- `rpc`: RPC url of the node that the faucet will use to communicate with the coin's network

### `payout` properties of `coin` property
- `min_payout`: Minimum amount to give in the coin's designation.
- `max_payout`: Maximum amount to give in the coin's designation.
- `percentage`: Set a percentage amount of the entire available balance to give.

### `token` properties of `coin` if key name is `vite`
Set to `false` if you do not want to use a Vite token
- `id`: Id of the Vite token to use
- `amount`: Maximum amount to give in the token's designation
- `decimals`: Number of decimals in the token's desination

## Production ready `config.json` reference file
Please do not copy the settings used below, instead use them as reference to create your own file.

This `config.json` example will deploy a Banano and a Vite faucets with default logos, a notice, a sponsor, an index page and Prussia Captcha Splash Middleware activated.

```json
{
  "self": "https://faucet.prussia.dev",
  "name": "Prussia's <coin> Faucet",
  "db": "mongodb",
  "port": 8080,
  "owner": "Prussia",
  "logo": false,
  "unopened_reduced_payouts": false,
  "secrets": {
    "use_env": true
  },
  "notice" : {
    "title": "More front-end potassium",
    "content": "All the faucets have a new look, go check them out!",
    "link": "https://faucet.prussia.dev"
  },
  "sponsor" : {
    "name": "Prussia",
    "link": "https://prussia.dev"
  },
  "captcha": {
    "hcaptcha_sitekey": "10000000-ffff-ffff-ffff-000000000001",
    "use_splash": true,
    "prussia_captcha": "https://captcha.prussia.dev"
  },
  "banano": {
    "claim_frequency": 86400000,
    "enabled": true,
    "auto_receive": true,
    "address": "ban_1...",
    "rpc": "https://kaliumapi.appditto.com/api",
    "payouts": {
      "min_payout": 0.02,
      "max_payout": 0.07,
      "percentage": false
    }
  },
  "vite": {
    "claim_frequency": 86400000,
    "enabled": true,
    "address": "vite_d...",
    "rpc": "https://node-vite.thomiz.dev",
    "payouts": {
      "min_payout": 0.01,
      "max_payout": 0.05,
      "percentage": false
    },
    "token": {
      "id": "",
      "amount": 1,
      "decimals": 0,
      "alias": "Token Name"
    }
  }
}
```
