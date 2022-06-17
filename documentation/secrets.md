# Secrets
There are currently two supported ways to store secrets. In the config file (**strongly not recommended**) or the `.env` file.

## .env file
Look at `.env.example` for an example.

## config
In the `config.json` file, add a key `secrets` that has an object/dictionary full of the values.

## Values
**bn_seed**: Mandatory for banano and/or nano faucets. This is the seed used to access faucet account funds (to send payouts). In hex format. Recommended to generate a new one, do not use your personal one. Consider generating a vanity address seed.

**eth_privkey**: Mandatory for xDai faucets. This is the private key used to access faucet accont funds (to send payouts). Starts with 0x. Recommended to generate a new one, do not use your personal one.

**captcha_secret**: Mandatory when using hCaptcha. Not to be confused with the site key. It can be found on your hCaptcha [profile page](https://dashboard.hcaptcha.com/settings).

**mongo_connection_string**: Mongo url to connect to mongodb database. Should start with "mongo+srv://". This is the whole url, including the url query strings (the stuff after `?`), and db user password.

**vite_privkey**: Mandatory for vite faucets. Private key. Recommended to generate a new one, do not use your personal one.