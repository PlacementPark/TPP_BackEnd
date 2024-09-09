class CustomAPIError extends Error {
  constructor(success, message) {
    super(success, message);
  }
}

module.exports = CustomAPIError;
