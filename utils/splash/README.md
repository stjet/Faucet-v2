# Prussia Captcha Splash Middleware
The Prussia Captcha Splash Middleware is a middleware implementation of the Prussia Captcha for Express.js made by [HalfBakedBread](https://www.github.com/HalfBakedBread).

## About the middleware
This very light middleware works by intercepting every request made to a predefined array of paths and asks the client to fill in a captcha. On success, it stores a temporary secure session cookie inside the browser that will be expected by the middleware on every request. The user will be granted access to the requested protected path if the middleware finds and validates the session cookie.

One key feature of this middleware is that it does not require any dependencies like a rendering engine or anything else and instead relies entirely on tempalte literals and wrapper functions to render pages.

## Usage
The middleware is enabled by default as it is used as a security feature for the faucets. If you don't wan't to use it, only change the `use_splash` value inside the `captcha` property from `false` to `true` in the `config.json` file.

## Installation
To install this middleware inside another Express app, you need to place the Splash Captcha folder `/utils/splash` inside your Express app folder. 

Then in your Express app:

```js
const express = require('express');
const splash = require('./middleware');

const captcha_options = {
  debug: false,
  captcha_title: 'Captcha',
  protected_paths: ['/', '/restricted'],
  expiration_time: 1000*60*60*24*7,
}

app.use(splash(captcha_options));
```

## Properties description
### `options` object properties
- `proted_paths`: Array of path strings the middleware will protect with a captcha. Required
- `debug`: Set to `true` to log middleware errors to the console. Deafults to `false`
- `captcha_title`: Name and title of your website. Deafults to `Catpcha`
- `expiration_time`: Expiration time of the secure cookie in milliseconds. Deafults to one week
- `captcha_provider_url`: URL of the captcha provider server. Only use this property if you run your own Prussia Captcha server. Defaults to `https://captcha.prussia.dev`
