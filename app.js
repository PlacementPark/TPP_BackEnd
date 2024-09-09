require("dotenv").config();
require("express-async-errors");
const company = require("./routes/company");
const employee = require("./routes/employee");
const candidate = require("./routes/candidate");
const status = require("./routes/status")
const authMiddle = require("./middleware/authentication");
const auth = require("./routes/login");
const connectDB = require("./db/connect");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const location = require("./routes/location");
const skill = require("./routes/skill");
const extra = require("./routes/extra");
// middleware

app.use(express.json({ limit: 52428800 }));
app.use("/api/v1/auth", auth);
app.use("/api/v1/status", authMiddle, status);
app.use("/api/v1/company", authMiddle, company);
app.use("/api/v1/employee", authMiddle, employee);
app.use("/api/v1/candidate", authMiddle, candidate);
app.use("/api/v1/location", authMiddle, location);
app.use("/api/v1/skill", authMiddle, skill);
app.use("/api/v1/extra", authMiddle, extra);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
