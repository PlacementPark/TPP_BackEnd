const { StatusCodes } = require("http-status-codes");
const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    success: err.success || false,
    message: err.message || "Something went wrong try again later",
  };

  // if (err instanceof CustomAPIError) {
  //   return res.status(err.statusCode).json({ message: err.message })
  // }

  if (err.name === "ValidationError") {
    customError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    customError.statusCode = 400;
    customError.success = false;
  }
  if (err.code && err.code === 11000) {

    customError.message = err
    customError.statusCode = 400;
    customError.success = false;
  }
  if (err.name === "CastError") {
    customError.message = `No item found with id : ${err.value._id}`;
    customError.statusCode = 404;
    customError.success = false;
  }

  return res
    .status(customError.statusCode)
    .json({ success: customError.success, message: customError.message });
};
module.exports = errorHandlerMiddleware;
