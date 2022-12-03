# Secrets

This is likely the most important configuration file of them all, as seeds and private keys hold and keep our assets safe. It is recommended to generate a new one, do not use your personal seed or private key.

## About the `.env` file

The `.env` file contains the individual user environment variables that allow faucet to connect to the database and send payments securely.

## `.env` file values

*Note: It is not necessary that you declare seeds/private keys for the faucets you don't have enabled in `config.json`*
- `bn_seed`: Mandatory for Banano and/or Nano faucets. In hex format. Consider generating a vanity address seed
- `eth_privkey`: Mandatory for xDai faucets. Starts with 0x
- `vite_privkey`: Mandatory for Vite faucets. Private key
- `captcha_secret`: Mandatory for hCaptcha. Not to be confused with the site key. It can be found on your hCaptcha [settings page](https://dashboard.hcaptcha.com/settings)
- `mongo_connection_string`: MongoDB URL to connect to MongoDB database. Should start with "mongo+srv://". This is the whole url, database user and password, including the url query strings (the text after `?`)

## Production ready `.env` reference file

Please do not copy the variables used below, instead use them as reference to create your own file.

```
bn_seed=0957...0000
eth_privkey=15fd...0000
vite_privkey=f522...0000
captcha_secret=0x73...0000
mongo_connection_string=mongodb+srv://...rity
```