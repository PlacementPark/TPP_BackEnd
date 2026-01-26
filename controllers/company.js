const { NotFoundError } = require("../errors/not-found");
const Candidate = require("../models/candidate");
const Company = require("../models/company");
const mongoose = require("mongoose");
const Role = require("../models/role");
const { StatusCodes } = require("http-status-codes");
const ExcelJS = require("exceljs");
// Move status arrays to constants for reuse
const IN_PROCESS_STATUSES = [
   "TPP Venue",
   "Client Venue",
   "Virtual Interview",
   "Pending FSR",
   "Pending Amcat",
   "Pending Versant",
   "Pending Technical",
   "Pending Typing",
   "Pending Group Discussion",
   "Pending Ops/Client",
   "Pending Vice President",
];
const REJECTED_STATUSES = [
   "Reject FSR Communication",
   "Reject FSR Stability",
   "Reject FSR Domain",
   "Reject Amcat",
   "Reject Amcat – Technical Issue",
   "Reject Amcat Cooling Period",
   "Reject Versant",
   "Reject Versant – Technical Issue",
   "Reject Versant Cooling Period",
   "Reject Technical",
   "Reject Typing",
   "Reject Group Discussion",
   "Reject Ops/Client Communication",
   "Reject Ops/Client Stability",
   "Reject Ops/Client Domain",
   "Reject Vice President",
];
const SELECT_STATUS = ["Select"];
const OFFER_DROP_STATUS = ["Offer Drop"];
const JOINED_SELECTS = ["Tracking", "Non tenure", "Need to Bill", "Billed"];

const getAllCompanies = async (req, res) => {
   try {
      const companies = await Company.find({}).lean();
      return res
         .status(StatusCodes.OK)
         .json({ success: true, data: companies });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const addCompany = async (req, res) => {
   try {
      const cRoles = req.body.roles || [];
      const roleIDs = [];
      for (let role = 0; role < cRoles.length; role++) {
         const i = new Role({ ...cRoles[role] });
         const savedRole = await i.save();
         roleIDs.push(savedRole._id);
      }
      const { roles, ...rest } = req.body;
      const company = new Company({ ...rest, roles: roleIDs });
      const savedCompany = await company.save();
      res.status(StatusCodes.CREATED).json({
         success: true,
         data: savedCompany,
      });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const addCompanyRoles = async (req, res) => {
   try {
      const { id: companyId } = req.params;
      const cRoles = req.body.roles;
      const roleIDs = [];
      for (let role = 0; role < cRoles.length; role++) {
         const i = new Role({ ...cRoles[role] });
         const savedRole = await i.save();
         roleIDs.push(savedRole._id);
      }
      const company = await Company.findByIdAndUpdate(
         { _id: companyId },
         { $push: { roles: { $each: roleIDs } } },
         { new: true, runValidators: true },
      );
      if (!company) throw new NotFoundError("Company not found with given id");
      res.status(StatusCodes.OK).json({ success: true, data: company });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getRoles = async (req, res) => {
   try {
      const { id: companyId } = req.params;
      const companyRoles = await Company.findOne({ _id: companyId })
         .populate("roles")
         .exec();
      if (!companyRoles)
         throw new NotFoundError("Company not found with given id");
      res.status(StatusCodes.OK).json({ success: true, data: companyRoles });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getCompany = async (req, res) => {
   try {
      const { id: companyId } = req.params;
      const company = await Company.findOne({ _id: companyId })
         .populate("roles")
         .exec();
      if (!company) throw new NotFoundError("Company not found with given id");
      const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
      const uproles = await Promise.all(
         company.roles.map(async (role) => {
            const baseQuery = { roleId: role._id };
            const assignedFilter = access
               ? { assignedEmployee: req.user.userid }
               : {};
            const inProcess = await Candidate.countDocuments({
               ...baseQuery,
               ...assignedFilter,
               interviewStatus: { $in: IN_PROCESS_STATUSES },
               select: { $in: ["", null] },
            });
            const rejected = await Candidate.countDocuments({
               ...baseQuery,
               ...assignedFilter,
               interviewStatus: { $in: REJECTED_STATUSES },
               select: { $in: ["", null] },
            });
            const awaiting = await Candidate.countDocuments({
               ...baseQuery,
               ...assignedFilter,
               interviewStatus: { $in: SELECT_STATUS },
               select: { $in: ["", null] },
            });
            const offerDrop = await Candidate.countDocuments({
               ...baseQuery,
               ...assignedFilter,
               interviewStatus: { $in: OFFER_DROP_STATUS },
               select: { $in: ["", null] },
            });
            const joined = await Candidate.countDocuments({
               ...baseQuery,
               ...assignedFilter,
               select: { $in: JOINED_SELECTS },
            });
            return {
               ...role._doc,
               inProcess,
               awaiting,
               offerDrop,
               joined,
               rejected,
            };
         }),
      );
      res.status(StatusCodes.OK).json({
         success: true,
         data: { ...company._doc, roles: uproles },
      });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const deleteCompany = async (req, res) => {
   try {
      const { id: companyId } = req.params;
      const company = await Company.findOne({ _id: companyId });
      if (!company) throw new NotFoundError("Company not found with given id");
      await Role.deleteMany({ _id: { $in: company.roles } });
      await Company.deleteOne({ _id: company._id });
      res.status(StatusCodes.OK).json({ success: true, data: company });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const deleteRole = async (req, res) => {
   try {
      const { companyId, roleId } = req.params;
      const company = await Company.findById({ _id: companyId });
      if (!company) throw new NotFoundError("Company not found with given id");
      const role = await Role.findByIdAndDelete({ _id: roleId });
      if (!role) throw new NotFoundError("Role not found with given id");
      const updateCompany = await Company.findByIdAndUpdate(
         { _id: companyId },
         { $pull: { roles: roleId } },
         { new: true },
      );
      res.status(StatusCodes.OK).json({ success: true, data: updateCompany });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getCompanyUseType = async (req, res) => {
   try {
      const { companyType, page = 1, limit = 20 } = req.query;
      let query = {};
      if (companyType) query.response = companyType;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Company.countDocuments(query);
      const companies = await Company.find(query)
         .select("_id companyName HR remarks empanelled")
         .skip(skip)
         .limit(parseInt(limit))
         .lean()
         .exec();
      const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
      const upcompanies = await Promise.all(
         companies.map(async (company) => {
            const assignedFilter = access
               ? { assignedEmployee: req.user.userid }
               : {};
            const inProcess = await Candidate.countDocuments({
               ...assignedFilter,
               companyId: company._id,
               interviewStatus: { $in: IN_PROCESS_STATUSES },
               select: { $in: ["", null] },
            });
            const rejected = await Candidate.countDocuments({
               ...assignedFilter,
               companyId: company._id,
               interviewStatus: { $in: REJECTED_STATUSES },
               select: { $in: ["", null] },
            });
            const awaiting = await Candidate.countDocuments({
               ...assignedFilter,
               companyId: company._id,
               interviewStatus: { $in: SELECT_STATUS },
               select: { $in: ["", null] },
            });
            const offerDrop = await Candidate.countDocuments({
               ...assignedFilter,
               companyId: company._id,
               interviewStatus: { $in: OFFER_DROP_STATUS },
               select: { $in: ["", null] },
            });
            const joined = await Candidate.countDocuments({
               ...assignedFilter,
               companyId: company._id,
               select: { $in: JOINED_SELECTS },
            });
            return {
               ...company,
               inProcess,
               awaiting,
               offerDrop,
               joined,
               rejected,
            };
         }),
      );
      res.status(StatusCodes.OK).json({
         success: true,
         companies: upcompanies,
         total,
         page: parseInt(page),
         totalPages: Math.ceil(total / parseInt(limit)),
      });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getCompanyCounts = async (req, res) => {
   try {
      const values = await Company.aggregate().sortByCount("response");
      res.status(StatusCodes.OK).json({ success: true, data: values });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const checkNumber = async (req, res) => {
   try {
      const { number } = req.params;
      const candidate = await Company.find({ "HR.HRMobile": String(number) });
      const status = candidate.length > 0;
      res.status(StatusCodes.OK).json({ success: true, status });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const bulkInsert = async (req, res) => {
   try {
      const data = req.body;
      await Company.insertMany(data, { ordered: false });
      res.status(StatusCodes.CREATED).json({ success: true });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getRole = async (req, res) => {
   try {
      const { companyId, roleId } = req.params;
      const company = await Company.find({ _id: companyId });
      if (!company) throw new NotFoundError("Company not found with given id");
      const role = await Role.find({ _id: roleId });
      if (!role) throw new NotFoundError("Role not found with given id");
      res.status(StatusCodes.OK).json({ success: true, data: role });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const updateRole = async (req, res) => {
   try {
      const { companyId, roleId } = req.params;
      const company = await Company.find({ _id: companyId });
      if (!company) throw new NotFoundError("Company not found with given id");
      const data = req.body;
      const role = await Role.findByIdAndUpdate(
         { _id: roleId },
         { ...data },
         { new: true },
      );
      if (!role) throw new NotFoundError("Role not found with given id");
      res.status(StatusCodes.OK).json({ success: true, data: role });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const editCompany = async (req, res) => {
   try {
      const { id: companyId } = req.params;
      const company = await Company.findById({ _id: companyId });
      if (!company) throw new NotFoundError("Company not found with given id");
      let delrole = [];
      if (req.body.roles.length !== company.roles.length) {
         delrole = company.roles
            .map((r) => r.toString())
            .filter((ro) => !req.body.roles.includes(ro));
         await Role.deleteMany({ _id: { $in: delrole } });
      }
      const { roles, ...rest } = req.body;
      const upcompany = await Company.findByIdAndUpdate(
         { _id: companyId },
         { ...rest, $pull: { roles: { $in: delrole } } },
         { new: true, runValidators: true },
      );
      res.status(StatusCodes.OK).json({ success: true, data: upcompany });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const getCompanyAndRoleNamesForCandidate = async (req, res) => {
   try {
      const { companyType } = req.query;
      let query = {};
      if (companyType) query.response = companyType;
      const companies = await Company.find(query)
         .select("_id companyName")
         .populate("roles", " _id role")
         .exec();
      res.status(StatusCodes.OK).json({ success: true, data: companies });
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};

const exportSelectedCompaniesExcel = async (req, res) => {
   try {
      const { ids, name } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "At least one company ID is required",
         });
      }

      // access = !["Recruiter","Teamlead","Intern"].includes(employeeType)
      const employeeType = req.user?.employeeType;
      const access = !["Recruiter", "Teamlead", "Intern"].includes(
         employeeType,
      );

      const fullColumns = [
         { header: "Company Mongo ID", key: "_id", width: 24 },
         { header: "Company ID", key: "companyId", width: 16 },
         { header: "Company Name", key: "companyName", width: 30 },
         { header: "About", key: "about", width: 30 },
         { header: "Company Type", key: "companyType", width: 18 },
         { header: "Remarks", key: "remarks", width: 25 },
         { header: "Response", key: "response", width: 15 },
         { header: "Empanelled", key: "empanelled", width: 12 },
         { header: "Roles", key: "roles", width: 40 },
         { header: "HR Name(s)", key: "HRNames", width: 25 },
         { header: "HR Mobile(s)", key: "HRMobiles", width: 25 },
         { header: "HR Email(s)", key: "HREmails", width: 25 },
      ];

      // Restricted download (Recruiter/Teamlead/Intern)
      const restrictedColumns = [
         { header: "Company ID", key: "companyId", width: 16 },
         { header: "Company Name", key: "companyName", width: 30 },
         { header: "Company Type", key: "companyType", width: 18 },
         { header: "Response", key: "response", width: 15 },
         { header: "Empanelled", key: "empanelled", width: 12 },
         { header: "Roles", key: "roles", width: 40 },
      ];

      const columnsToUse = access ? fullColumns : restrictedColumns;
      const allowedKeys = new Set(columnsToUse.map((c) => c.key));

      // Fetch companies by IDs, populate roles (only what we need)
      const selectFields = access
         ? "companyId companyName about companyType remarks response empanelled HR roles"
         : "companyId companyName companyType response empanelled roles";

      const companies = await Company.find({ _id: { $in: ids } })
         .select(selectFields)
         .populate("roles", "_id role")
         .lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Companies");
      worksheet.columns = columnsToUse;

      const pickAllowed = (row) => {
         const out = {};
         for (const k of allowedKeys) out[k] = row[k];
         return out;
      };

      companies.forEach((c) => {
         const baseRow = {
            _id: c._id?.toString() || "",
            companyId: c.companyId || "",
            companyName: c.companyName || "",
            about: c.about || "",
            companyType: c.companyType || "",
            remarks: c.remarks || "",
            response: c.response || "",
            empanelled:
               typeof c.empanelled === "boolean"
                  ? c.empanelled
                     ? "Yes"
                     : "No"
                  : "",
            roles: Array.isArray(c.roles)
               ? c.roles.map((r) => r.role).join(", ")
               : "",
            HRNames: Array.isArray(c.HR)
               ? c.HR.map((hr) => hr.HRName || "")
                    .filter(Boolean)
                    .join(", ")
               : "",
            HRMobiles: Array.isArray(c.HR)
               ? c.HR.map((hr) =>
                    Array.isArray(hr.HRMobile)
                       ? hr.HRMobile.join(", ")
                       : hr.HRMobile || "",
                 )
                    .filter(Boolean)
                    .join(" | ")
               : "",
            HREmails: Array.isArray(c.HR)
               ? c.HR.map((hr) => hr.HREmail || "")
                    .filter(Boolean)
                    .join(", ")
               : "",
         };

         worksheet.addRow(pickAllowed(baseRow));
      });

      res.setHeader(
         "Content-Type",
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
         "Content-Disposition",
         `attachment; filename="${name || "companies"}.xlsx"`,
      );

      await workbook.xlsx.write(res);
      res.end();
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};
const searchCompany = async (req, res) => {
   const { companyName: name, HRMobile: mobile, HREmail: email } = req.body;
   query = [];
   if (name)
      query.push({
         companyName: { $regex: ".*" + name + ".*", $options: "i" },
      });
   if (mobile)
      query.push({
         "HR.HRMobile": { $regex: ".*" + mobile + ".*", $options: "i" },
      });
   if (email)
      query.push({
         "HR.HREmail": { $regex: ".*" + email + ".*", $options: "i" },
      });
   const companies = await Company.find({ $or: query }).select(
      "_id companyName companyId HR remarks empanelled about remarks companyType response empanelled ",
   );

   res.status(StatusCodes.OK).json(companies);
};

module.exports = {
   getAllCompanies,
   addCompany,
   getRoles,
   addCompanyRoles,
   deleteCompany,
   getCompanyUseType,
   getCompanyCounts,
   bulkInsert,
   getCompany,
   getRole,
   updateRole,
   editCompany,
   checkNumber,
   deleteRole,
   getCompanyAndRoleNamesForCandidate,
   exportSelectedCompaniesExcel,
   searchCompany,
};
