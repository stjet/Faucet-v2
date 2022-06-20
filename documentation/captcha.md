# Captcha (and Security)
A captcha is essential for keeping out automated botting of the faucet, which will deplete funds and prevent real users from using the faucet.

This faucet already has several security measures out of the box, like preventing `POST` requests not originating from the site, not allowing many payout requests from the same IP address, cookies, and obviously, preventing the same address from being submitted multiple times before the next claim time.

The captcha however, is still a very important component. Currently supported are hCaptcha !(add a link)! and the Prussia captcha.

hCaptcha is similar to reCaptcha. It is an image based captcha. For example, it may present 9 different images, and ask which ones are images of a motorbus. Overall, it is a pretty solid captcha service, although the accessibility features compromise on security, and the earnings it promise to site operators are in reality pretty negligible.

Prussia Captcha is a text based captcha. Think of the captchas from 2000s. An image, with various letters distorted in some way, with lines and dots everywhere. It is much more easily cracked so it is not recommended. However, it is a lot more customizable, unlike hCaptcha.