const { UnauthenticatedError } = require("../errors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authorizationMiddleware = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthenticatedError("User Not Authorized");
  }
  const token = authorization.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.SECRET);
    
    const {userMail,employeeType,userid,status,name} =payload;
    if(!status)
      throw new UnauthenticatedError("Access Denied by Admin");
    req.user = { userMail, employeeType, userid,status,name };
    
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication Error");
  }
};

module.exports = authorizationMiddleware;
