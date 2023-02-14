<a name="readme-top"></a>



[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<br />
<h1 align="center">Faucet v2</h1>
  <p align="center">
    An easily configurable and powerful cryptocurrency faucet for xDai, Banano, Nano, Vite, and likely more later.
    <br />
    <a href="https://github.com/jetstream0/faucet-v2/documentation"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://faucet.prussia.dev">View Demo</a>
    ·
    <a href="https://github.com/jetstream0/faucet-v2/issues">Report Bug</a>
    ·
    <a href="https://github.com/jetstream0/faucet-v2/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About the Faucet v2</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#captcha-and-security">Captcha and security</a></li>
        <li><a href="#why-run-a-faucet">Why run a faucet</a></li>
        <li><a href="#running-evm-faucets-polygon-arbitrum-etc">Running EVM faucets (Polygon, Arbitrum, etc)</a></li>
        <li><a href="#advanced">Advanced</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li>
      <a href="#contributing">Contributing</a>
      <ul>
        <li><a href="#contributors">Contributors</a></li>
      </ul>
    </li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



## About the Faucet v2

This cryptocurrency faucet is made to be easily configurable, letting non-developers easily fork the project and run their faucet within an hour. On the other hand, experienced developers should be able to easily make tweaks, extend the faucet, and implement their own features.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

Proudly open-source and built with:

* [![Node][Node.js]][Node-url]
* [![Express][Express.js]][Express-url]
* [![Nunjucks][Nunjucks]][Nunjucks-url]
* [![Bootstrap][Bootstrap.com]][Bootstrap-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Getting Started

This project is fairly light and can be run easily on free services like Repl.it. It is written in Node.js, so most other services like Heroku, cPanel, and any VPS can also be used to host this faucet. You can even run it on your own computer, although it is not recommended to do so for uptime reasons.

It is also recommended to buy a domain name. Registrars like Porkbun or Namecheap are good options, although anything that is reputable and widely used is fine (tip: don't use GoDaddy). Also, if you are using Repl.it, a free pinger service like UptimeRobot is recommended.

### Prerequisites

If you are using Repl.it installing/updating npm is optional.

* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Get a [MongoDB](https://www.mongodb.com) and [hCaptcha](https://www.hcaptcha.com/) accounts, both are free
2. Get a seed/secret key for the faucets you want to use (Only Nano, Banano, xDai and Vite are available). _see [documentation/secrets.md](documentation/secrets.md)_
3. Clone the repo
   ```sh
   git clone https://github.com/jetstream0/faucet-v2.git
   ```
4. Edit `config.json` with your preferences. _see [documentation/config.md](documentation/config.md)_
5. Generate a custom `package.json` file with the package generator
   ```sh
   node config.js packagesetup
   ```
6. Install NPM packages. This step is optional if you are using Repl.it, packages are installed when you run the instance
   ```sh
   npm install
   ```
7. Enter your secrets in the `.env` file. If you are using Repl.it this can be done using the project manager. _see [documentation/secrets.md](documentation/secrets.md)_
8. That's everything! You can now run the faucet with
   ```sh
   npm run main
   ```
9. Advanced: To run the faucet locally in debug mode use
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Usage

### Captcha and security

A captcha is essential for keeping out automated botting of the faucet, which will deplete funds and prevent real users from using it.

_For more information, please refer to  [documentation/captcha.md](documentation/captcha.md)_

### Why run a faucet

Running a faucet is unlikely to be profitable, but it may help promote your project, serve as a bit of charity, or be a hobby project.

Getting a sponsor may help offset the costs of running a faucet.

### Running EVM faucets (Polygon, Arbitrum, etc)

This faucet already supports xDai, so it is simple to change the xDai faucet into using any other EVM chain.

- Change the `rpc` for xDai (in `config.js`) to the rpc for the EVM chain
- Don't want the `/xdai` URL? Make the xDai faucet the default in `config.js`.
- Finally, change instances of "xDai" into whatever EVM chain is being used in `/templates/xdai.html`, and change the logo.



### Advanced

For more customized faucets, it is recommended that you know JavaScript, HTML, and CSS. Likely, your customization needs can be fulfilled by editing the relevant HTML files in `/templates`, and the CSS files and PNG images in `/files/css` and `/files/img` respectively.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Roadmap

- [x] Add security packages
- [x] Add Front-end verification
- [x] Update templates
- [x] Implement Prussia Captcha Splash Middleware. _see [documentation/captcha.md](documentation/captcha.md#about-the-prussia-captcha-splash-middleware)_
- [x] Add address checks for every coin
- [x] Add invisible captcha
- [x] Documentation
- [ ] Support token sends for xDai and Vite
- [ ] Add Algorand faucet
- [ ] Show block explorer tx links after claim
- [ ] Add GoBanMe
- [ ] Implement blacklist

See the [open issues](https://github.com/jetstream0/faucet-v2/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this faucet project better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Contributors 

- [Prussia/jetstream0](https://github.com/jetstream0) - Creator and mantainer
- [Walton Jones/salty-walty](https://github.com/salty-walty) - Banano Front-end template
- [KaffinPX](https://github.com/KaffinPX) - Overhaul of `cryptos/vite.js`
- [Ash Bauer/HalfBakedBread](https://github.com/halfbakedbread) - Refactor and update to v2.1.9. Prussia Captcha Splash Middleware. Documentation. New templates

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contact

Prussia - [Website](https://prussia.dev/#info) - [Discord Server](https://prussia.dev/to/discord)

Project Link: [https://github.com/jetstream0/faucet-v2](https://github.com/jetstream0/faucet-v2)

This faucet is very easy to set up, however, if you don't want to expend the effort, or are having issues, you can [hire me](https://prussia.dev/sample).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Acknowledgments

Here is a list of packages and resources that made this project possible

* [bananojs](https://github.com/BananoCoin/bananojs)
* [ethers.js](https://github.com/ethers-io/ethers.js)
* [vite.js](https://github.com/vitelabs/vite.js)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



[contributors-shield]: https://img.shields.io/github/contributors/jetstream0/faucet-v2.svg?style=for-the-badge
[contributors-url]: https://github.com/jetstream0/faucet-v2/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/jetstream0/faucet-v2.svg?style=for-the-badge
[forks-url]: https://github.com/jetstream0/faucet-v2/network/members
[stars-shield]: https://img.shields.io/github/stars/jetstream0/faucet-v2.svg?style=for-the-badge
[stars-url]: https://github.com/jetstream0/faucet-v2/stargazers
[issues-shield]: https://img.shields.io/github/issues/jetstream0/faucet-v2.svg?style=for-the-badge
[issues-url]: https://github.com/jetstream0/faucet-v2/issues
[license-shield]: https://img.shields.io/github/license/jetstream0/faucet-v2.svg?style=for-the-badge
[license-url]: https://github.com/jetstream0/faucet-v2/blob/master/LICENSE.txt
[Node.js]: https://img.shields.io/badge/Node-339933?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Express.js]: https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[Nunjucks]: https://img.shields.io/badge/Nunjucks-1C4919?style=for-the-badge&logo=nunjucks&logoColor=white
[Nunjucks-url]: https://mozilla.github.io/nunjucks
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
