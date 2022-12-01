const html = function (head, body) {
  return `
  <!doctype html>
  <html lang="en" class="h-100">
  ${head}
  ${body}
  </html>
  `;
};

const head = function (props) {
  const { page_title, page_description, logo_url, favicon_url } = this;
  return `
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${page_description ?? 'Anti-Bot Splash Captcha'}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${page_title ?? 'Anti-Bot Splash System'}">
    <meta property="og:description" content="${page_description ?? 'Anti-Bot Splash Captcha'}">
    ${logo_url ? `<meta property="og:image" content="${logo_url}">` : ''}
    <title>${page_title ?? 'Anti-Bot Splash System'}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
    ${favicon_url ? `<link href="${favicon_url}" type="image/x-icon" rel="icon">` : ''}
    ${props.style ?? ''}
  </head>
  `;
};

const css = function () {
  return `
  <style>
  body {
    background-color: #141416;
    text-shadow: 0 .05rem .1rem rgba(0, 0, 0, .5);
  }

  .captcha-container {
    max-width: 24em;
  }
  </style>
  `;
};

const body = function (header, main, footer) {
  return `
  <body class="d-flex h-100 text-center text-light">
    <div class="captcha-container d-flex flex-column w-100 h-100 p-3 mx-auto">
    ${header}
    ${main}
    ${footer}
    </div>
  </body>
  `;
};

const header = function () {
  const { captcha_title } = this;
  return `
  <header class="mt-5 mb-auto">
    <div>
      <h1 class="float-center mb-4">${captcha_title} Anti-Bot System</h1>
    </div>
  </header>
  `;
};

const main = function (content) {
  return `
  <main class="px-4">
    <p class="lead mb-4">Please confirm you are not a robot</p>
    <div class="bg-dark border border-light border-opacity-10 rounded-4 p-2 p-md-3">
      ${content}
    </div>
  </main>
  `;
};

const error_alert_component = function (props) {
  return `
  <div class="alert alert-danger bg-danger border-danger text-light rounded-3 py-1" role="alert">
    <p class="small text-start mb-0">Error: ${props.error}</p>
  </div>
  `;
};

const form = function () {
  const { error, return_to, captcha } = this;
  return `
  <svg class="img-fluid rounded-3 mx-auto mb-2" width="420" height="140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: 210x70" preserveAspectRatio="xMidYMid slice" focusable="false">
    <title>Captcha</title>
    <rect width="100%" height="100%" fill="#000"/>
    <text x="50%" y="50%" dx="-2em" dy="0.5em" fill="#eee">Loading...</text>
    <image href="${captcha.url}" height="100%" width="100%" />
  </svg>
  <form class="row g-3" method="POST" action="${return_to}" autocomplete="off">
    <div class="col-md-12 text-start">
      <label for="prussiaCaptchaInput" class="form-label">Type the characters above:</label>
      <input type="text" class="form-control form-control-lg border-light" name="answer" id="prussiaCaptchaInput" required>
    </div>
    <div class="col-12">
      ${error ? `${error_alert_component({ error: error })}` : ''}
      <input type="hidden" value="${captcha.nonce}" name="nonce">
      <input type="hidden" value="${captcha.code}" name="code">
      <button class="w-100 btn btn-dark bg-light bg-opacity-10 border-light border-opacity-10 fw-bold btn-lg" type="submit">I'm not a robot!</button>
    </div>
  </form>
  <hr class="mt-4 mb-3">
  <small class="text-muted">Powered by <a href="https://github.com/jetstream0/Captcha" class="link-secondary" target="_blank" rel="noopener noreferrer">Prussia Captcha</a></small>
  `;
};

const footer = function () {
  return `
  <footer class="pt-4 mt-auto">
    <p class="small"><a href="https://halfbakedbread.github.io" class="link-secondary" target="_blank" rel="noopener noreferrer">Half Baked Bread</a></p>
  </footer>
  `;
};

module.exports = { html, head, css, body, header, main, form, footer };
