class HttpError extends Error {}
class HttpMethodNotAllowed extends HttpError {
  constructor(message = 'Method Not Allowed', stack = null) {
    super();
    this.status = 405;
    this.message = message;
    this.stack = stack;
  }
}

module.exports = {
  HttpError: HttpError,
  HttpMethodNotAllowed: HttpMethodNotAllowed,
};
