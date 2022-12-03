# Captcha and Security

This faucet already has several security measures out of the box, like preventing `POST` requests not originating from the site, not allowing many payout requests from the same IP address, cookies, localStorage, and obviously, preventing the same address from being submitted multiple times before the next claim time.

The captcha, however, is still an important component. Currently supported are [hCaptcha](https://www.hcaptcha.com/) and the middleware splash implementation of Prussia Captcha.

## About hCaptcha

hCaptcha is an image-based captcha similar to reCaptcha. It is an image based captcha. For example, it may present nine different images and ask which ones are images of a motorbus. Overall, it is a pretty solid captcha service, although the accessibility features compromise in security, and the earnings it promises to site operators are in reality pretty negligible.

### Developer Test Keys

hCaptcha provides developers with a set of test keys to make development and automation tests an easier process.

***Warning:*** *these test keys provide no anti-bot protection; please make sure you only use them on a development environment.*

```
Site Key: 10000000-ffff-ffff-ffff-000000000001
Secret Key: 0x0000000000000000000000000000000000000000
```

## About Prussia Captcha

Prussia Captcha is a text based captcha. Think of the captchas from the 2000s. An image with various letters distorted in some way, with lines and dots everywhere. It is much more easily cracked, so it is not recommended. However, it is a lot more customizable, unlike hCaptcha.

## About the Prussia Captcha Splash Middleware

The Prussia Captcha Splash Middleware is an Express middleware implementation of the Prussia Captcha made by [HalfBakedBread](https://www.github.com/HalfBakedBread).

 _To learn more about the Prussia Captcha Splash Middleware, see [readme.md](../utils/splash/README.md)_