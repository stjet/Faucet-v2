(() => {
  'use strict';

  /*
   * Constants
   */

  const TWENTY_FOUR_HOURS = 86400000;
  const MAGIC_TIMEOUT = 19;

  const ALERT_ELEMENT = { id: 'alertError', class: ['alert', 'alert-danger', 'py-1', 'mb-2'], role: 'alert' };
  const MODAL_ELEMENT = { id: 'submitModal', class: ['modal-submit'] };
  const MODAL_ELEMENT_BG = { id: 'submitModalBackground', class: ['modal-submit-bg'] };

  /*
   * Utils
   */

  function setStorage(key, value) {
    return localStorage.setItem(key, JSON.stringify(value));
  }

  function getStorage(key) {
    return JSON.parse(localStorage.getItem(key));
  }

  function copyToClipboard(elementId) {
    return navigator.clipboard.writeText(document.getElementById(elementId).innerHTML);
  }

  function renderQr(elementId, text) {
    new QRCode(document.getElementById(elementId), {
      text: text,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.L,
    });
  }

  function checkTimeDifference(milliseconds) {
    let diffDays = Math.floor(milliseconds / 86400000);
    let diffHrs = Math.floor((milliseconds % 86400000) / 3600000);
    let diffMins = Math.round(((milliseconds % 86400000) % 3600000) / 60000);
    const formatResult = (days, hours, minutes) => {
      if (diffMins >= 60) {
        diffMins--;
      }
      if (minutes == 0) {
        minutes = false;
      } else if (diffMins == 1) {
        minutes = `${diffMins} minute`;
      } else {
        minutes = `${diffMins} minutes`;
      }
      if (hours == 0) {
        hours = false;
      } else if (hours == 1) {
        hours = `${diffHrs} hour`;
      } else {
        hours = `${diffHrs} hours`;
      }
      if (days == 0) {
        days = false;
      } else if (days == 1) {
        days = `${diffDays} day`;
      } else {
        days = `${diffDays} days`;
      }
      if (days && hours && minutes) {
        return `${days}, ${hours} and ${minutes}`;
      }
      if (days && hours) {
        return `${days} and ${hours}`;
      }
      if (days && minutes) {
        return `${days} and ${minutes}`;
      }
      if (hours && minutes) {
        return `${hours} and ${minutes}`;
      }
      if (days) {
        return `${days}`;
      }
      if (hours) {
        return `${hours}`;
      }
      if (minutes) {
        return `${minutes}`;
      }
      if (!minutes && !hours && !days && diffMins < 1) {
        return 'Less than one minute';
      }
    };
    return formatResult(diffDays, diffHrs, diffMins);
  }

  function checkCurrencyToValidate(address) {
    if (serverIdentifier === 'banano') {
      return window.bananocoinBananojs.getBananoAccountValidationInfo(address);
    } else if (serverIdentifier === 'nano') {
      return window.bananocoinBananojs.getNanoAccountValidationInfo(address);
    } else if (serverIdentifier === 'xdai') {
      const xdaiRegex = /^0x([A-Fa-f0-9]{40})$/;
      return {
        message: 'Invalid xDai Address. Try again.',
        valid: xdaiRegex.test(address),
      };
    } else if (serverIdentifier === 'vite') {
      // Vite addresses have a checksum at the end. If function below fails, use server side validation
      const viteRegex = /^vite_[\dabcdef]{50}$/;
      return {
        message: 'Invalid Vite Address. Try again.',
        valid: viteRegex.test(address),
      };
    }
  }

  function messageFiddle(message) {
    // Change the modal message based on the 'serverIdentifier' string
    if (serverIdentifier === 'banano') {
      return (message = 'A monkey is scrambling a captcha for you. Please wait...');
    } else if (serverIdentifier === 'nano' || 'xdai' || 'vite') {
      return (message = 'Generating a captcha for you. Please wait...');
    }
  }

  /*
   * Helpers
   */

  function checkClientErrors() {
    const sessionObject = getStorage(serverIdentifier);
    if (sessionObject?.timestamp && sessionObject?.timestamp + TWENTY_FOUR_HOURS > Date.now()) {
      const timeLeft = checkTimeDifference(sessionObject?.timestamp + TWENTY_FOUR_HOURS - Date.now());
      return `You have recently claimed, come back in ${timeLeft}.`;
    } else {
      return false;
    }
  }

  function checkServerErrors() {
    if (serverErrors && serverErrors !== 'false') return serverErrors;
    else return false;
  }

  /*
   * DOM Utils
   */

  function addDivWithParagraph(elementId, elementClassArray, appendTo) {
    if (elementExistsInDom(elementId)) return;
    else {
      let div = document.createElement('div');
      let p = document.createElement('p');
      div.id = elementId;
      div.appendChild(p);
      elementClassArray.forEach((element) => {
        div.classList.add(element);
      });
      appendTo.appendChild(div);
    }
  }

  function editElementFirstParagraph(elementId, elementClass, elementText) {
    let element = document.getElementById(elementId);
    let elementParagraph = element.getElementsByTagName('p')[0];
    if (elementClass) {
      elementClass.forEach((element) => {
        elementParagraph.classList.add(element);
      });
    }
    elementParagraph.textContent = elementText;
  }

  function addElementClass(elementId, elementClass) {
    // Timeout prevents glitching and frame drops if the browser adds classes too fast
    setTimeout(() => {
      document.getElementById(elementId).classList.add(elementClass);
    }, MAGIC_TIMEOUT);
  }

  function removeElementClass(elementId, elementClass) {
    document.getElementById(elementId).classList.remove(elementClass);
  }

  function elementExistsInDom(elementId) {
    return !!document.getElementById(elementId);
  }

  function removeElementFromDom(elementId) {
    document.getElementById(elementId).remove();
  }

  /*
   * DOM Events
   */

  function displayFormError(elementId, elementText) {
    editElementFirstParagraph(elementId, ['my-0', 'small'], elementText);
    addElementClass(elementId, 'display');
  }

  function displayModalAndClose(elementId, elementIdBg, elementText) {
    editElementFirstParagraph(elementId, ['my-0'], elementText);
    addElementClass(elementIdBg, 'display');
    addElementClass(elementId, 'display');
    setTimeout(() => {
      removeElementClass(elementIdBg, 'display');
      removeElementClass(elementId, 'display');
    }, 4200);
  }

  function displayPreventHeadlessBrowsers(elementId, elementIdBg, elementText) {
    document.getElementsByTagName('header')[0].style.filter = 'blur(4px)';
    document.getElementsByTagName('main')[0].style.filter = 'blur(4px)';
    document.getElementsByTagName('footer')[0].style.filter = 'blur(4px)';
    editElementFirstParagraph(elementId, ['my-0', 'small'], elementText);
    addElementClass(elementIdBg, 'display');
    addElementClass(elementId, 'display');
  }

  /*
   * Handlers
   */

  function formValidation(event) {
    const formAddress = document.getElementById('address')?.value;
    const verifyAddress = checkCurrencyToValidate(formAddress);
    event.preventDefault();
    if (verifyAddress.valid && !checkClientErrors()) {
      addDivWithParagraph(MODAL_ELEMENT_BG.id, MODAL_ELEMENT_BG.class, document.body);
      addDivWithParagraph(MODAL_ELEMENT.id, MODAL_ELEMENT.class, document.body);
      captchaExecute();
    } else if (!checkClientErrors()) {
      addDivWithParagraph(ALERT_ELEMENT.id, ALERT_ELEMENT.class, clientErrorsElement);
      displayFormError(ALERT_ELEMENT.id, verifyAddress.message);
    }
  }

  function captchaExecute() {
    editElementFirstParagraph(MODAL_ELEMENT.id, ['my-0', 'small'], messageFiddle());
    addElementClass(MODAL_ELEMENT_BG.id, 'display');
    addElementClass(MODAL_ELEMENT.id, 'display');
    hcaptcha.execute();
  }

  function captchaOpen() {
    removeElementClass(MODAL_ELEMENT.id, 'display');
  }

  function captchaSubmit(token) {
    editElementFirstParagraph(MODAL_ELEMENT.id, ['my-0', 'small'], 'Success. Please wait...');
    addElementClass(MODAL_ELEMENT.id, 'display');
    document.getElementById('form').submit();
  }

  function captchaExpired() {
    displayModalAndClose(MODAL_ELEMENT.id, MODAL_ELEMENT_BG.id, 'Captcha expired. Please try again.');
  }

  function captchaClose() {
    displayModalAndClose(MODAL_ELEMENT.id, MODAL_ELEMENT_BG.id, 'Captcha closed. Please try again.');
  }

  function captchaError() {
    displayModalAndClose(MODAL_ELEMENT.id, MODAL_ELEMENT_BG.id, 'Hmmm... Captcha error. Please try again.');
  }

  /*
   * Main
   */

  const clientErrorsElement = document.getElementById('clientErrors');

  const inputElement = document.getElementById('address');
  const buttonElement = document.getElementById('buttonElement');

  // Access is prevented if automation is used
  if (navigator.webdriver) {
    addDivWithParagraph(MODAL_ELEMENT_BG.id, MODAL_ELEMENT_BG.class, document.body);
    addDivWithParagraph(MODAL_ELEMENT.id, MODAL_ELEMENT.class, document.body);
    displayPreventHeadlessBrowsers(MODAL_ELEMENT.id, MODAL_ELEMENT_BG.id, 'Please do not use headless browsers and try again.');
  }

  // If the currency is given, set a key with the faucet identifier, the claimimg address, and a timestamp
  if (claimingAddress && serverGiven) {
    setStorage(serverIdentifier, { address: claimingAddress, timestamp: new Date().getTime() });
  }

  // Checks for server and client side errors
  if (checkClientErrors() && !checkServerErrors() && !serverGiven) {
    addDivWithParagraph(ALERT_ELEMENT.id, ALERT_ELEMENT.class, clientErrorsElement);
    displayFormError(ALERT_ELEMENT.id, checkClientErrors());
    // Sets the address input element to the last used address
    inputElement.value = getStorage(serverIdentifier).address;
    inputElement?.setAttribute('disabled', '');
    buttonElement?.setAttribute('disabled', '');
  } else if (checkServerErrors() && !serverGiven) {
    // Without an error code we can't disable inputs with a server error on page load
    addDivWithParagraph(ALERT_ELEMENT.id, ALERT_ELEMENT.class, clientErrorsElement);
    displayFormError(ALERT_ELEMENT.id, checkServerErrors());
  }

  if (document.getElementById('qrCode')) {
    renderQr('qrCode', qrAddress);
  }

  /*
   * Events
   */

  buttonElement?.addEventListener('click', formValidation);

  /*
   * Exports
   */

  window.copyToClipboard = copyToClipboard;
  window.captchaOpen = captchaOpen;
  window.captchaSubmit = captchaSubmit;
  window.captchaExpired = captchaExpired;
  window.captchaClose = captchaClose;
  window.captchaError = captchaError;
})();
