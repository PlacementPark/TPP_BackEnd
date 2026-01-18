const { StatusCodes } = require("http-status-codes");
const Employee = require("../models/employee");
const bcrypt = require("bcryptjs");
const {
   BadRequestError,
   UnauthenticatedError,
   NotFoundError,
} = require("../errors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const addEmployee = async (req, res) => {
   const { DOJ: DOJ, DOB: DOB, ...rest } = req.body;
   const employee = await Employee.create({
      ...rest,
      DOJ: Date(DOJ),
      DOB: Date(DOB),
   });
   res.status(StatusCodes.CREATED).json({ success: true, employee: employee });
};

const getAllEmployees = async (req, res) => {
   const employees = await Employee.find({});
   res.status(StatusCodes.OK).json({ employees });
};

const getEmployee = async (req, res) => {
   const { id: employeeId } = req.params;
   const employee = await Employee.findById({ _id: employeeId });
   if (!employee) {
      throw new NotFoundError("Employee with given ID not found");
   }
   res.status(StatusCodes.OK).json({ employee });
};

const deleteEmployee = async (req, res) => {
   const { id: employeeId } = req.params;
   const employee = await Employee.findByIdAndDelete({ _id: employeeId });
   if (!employee) {
      throw new NotFoundError("Employee with given ID not found");
   }
   res.status(StatusCodes.OK).json({ employee });
};

const updateEmployee = async (req, res) => {
   const { id: employeeId } = req.params;

   if (req.body.password == "TPP@Pass") {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
   }
   const employee = await Employee.findByIdAndUpdate(
      { _id: employeeId },
      { ...req.body },
      {
         new: true,
         runValidators: true,
      }
   );
   if (!employee) {
      throw new NotFoundError("Employee with given ID not found");
   }
   res.status(StatusCodes.OK).json({ employee });
};
const bulkInsert = async (req, res) => {
   const data = req.body;

   const employees = await Employee.insertMany(data, {
      ordered: false,
      rawResult: true,
   });
   res.status(StatusCodes.CREATED).json({ success: true, employees });
};
const getEmployeeCounts = async (req, res) => {
   const values = await Employee.aggregate().sortByCount("employeeType");
   res.status(StatusCodes.OK).json(values);
};
const getEmployeesByType = async (req, res) => {
   const { type: employeeType } = req.params;
   const employees = await Employee.find({ employeeType: employeeType });
   res.status(StatusCodes.OK).json(employees);
};

const updatePassword = async (req, res) => {
   const { id: employeeId } = req.params;
   const user = await Employee.findById({ _id: employeeId });
   const pMatch = await user.checkPassword(req.body.current);
   if (!user) {
      throw new NotFoundError("Employee with given ID not found");
   }
   if (!pMatch)
      throw new BadRequestError(
         "Current Password Does not Match with existing password"
      );

   const salt = await bcrypt.genSalt(10);
   const newPassword = await bcrypt.hash(req.body.new, salt);

   const employee = await Employee.findByIdAndUpdate(
      { _id: employeeId },
      { ...user._doc, password: newPassword },
      {
         new: true,
         runValidators: true,
      }
   );

   res.status(StatusCodes.OK).json({ employee, new: req.body.new });
};

const checkId = async (req, res) => {
   const { id: employeeId } = req.params;

   const employee = await Employee.find({
      employeeId: employeeId,
   });
   var status = true;

   if (employee.length == 0) {
      status = false;
   }

   res.status(StatusCodes.OK).json({ status });
};
const searchEmployee = async (req, res) => {
   const {
      name: name,
      mobile: mobile,
      email: email,
      employeeType: empType,
   } = req.body;

   query = [];
   if (name)
      query.push({ name: { $regex: ".*" + name + ".*", $options: "i" } });
   if (mobile)
      query.push({ mobile: { $regex: ".*" + mobile + ".*", $options: "i" } });
   if (email)
      query.push({ email: { $regex: ".*" + email + ".*", $options: "i" } });
   if (empType.length > 0) {
      query.push({ employeeType: { $in: empType } });
   }
 

   const candidates = await Employee.find({ $or: query }).select(
      "_id name employeeId email employeeType status mobile"
   );

   res.status(StatusCodes.OK).json(candidates);
};
const checkNumber = async (req, res) => {
   const { number: number } = req.params;

   const candidate = await Employee.find({
      mobile: String(number),
   });
   var status = true;

   if (candidate.length == 0) {
      status = false;
   }

   res.status(StatusCodes.OK).json({ status });
};
const checkMail = async (req, res) => {
   const { email: email } = req.params;

   const candidate = await Employee.find({
      email: email,
   });
   var status = true;

   if (candidate.length == 0) {
      status = false;
   }

   res.status(StatusCodes.OK).json({ status });
};
module.exports = {
   getAllEmployees,
   getEmployee,
   addEmployee,
   updateEmployee,
   deleteEmployee,
   bulkInsert,
   getEmployeeCounts,
   getEmployeesByType,
   updatePassword,
   checkId,
   checkNumber,
   checkMail,
   searchEmployee,
};
