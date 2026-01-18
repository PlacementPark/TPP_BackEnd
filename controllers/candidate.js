const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors/not-found");
const Candidate = require("../models/candidate");
const Role = require("../models/role");
const Company = require("../models/company");
const { buildQuery } = require("../utils/candidateHelper");
const ExcelJS = require("exceljs");
const { z } = require("zod");

const addCandidate = async (req, res) => {
   const candidate = await Candidate.create({ ...req.body });
   res.status(StatusCodes.CREATED).json({
      success: true,
      candidate: candidate,
   });
};

const getCandidate = async (req, res) => {
   const { id: candidateId } = req.params;

   const candidate = await Candidate.findById({
      _id: candidateId,
   })
      .populate("companyId")
      .populate("roleId")
      .populate("assignedEmployee", "_id name")
      .populate("createdByEmployee","_id name")
      .exec();
   if (!candidate) throw new NotFoundError("Candidate with given ID Not Found");
   res.status(StatusCodes.OK).json(candidate);
};

const updateCandidate = async (req, res) => {
   const { id: candidateId } = req.params;
   const candidate = await Candidate.findByIdAndUpdate(
      {
         _id: candidateId,
      },
      {
         ...req.body,
      },
      {
         new: true,
         runValidators: true,
         context: "query",
      }
   )
      .select(
         "_id createdByEmployee assignedEmployee fullName candidateId mobile email l1Assessment l2Assessment companyId roleId interviewDate interviewStatus onboardingDate nextTrackingDate billingDate invoiceDate invoiceNumber remarks select rate"
      )
      .populate("companyId", "_id companyName ")
      .populate("roleId", "_id role")
      .populate("assignedEmployee", "_id name")
      .populate("createdByEmployee", "_id name");
   if (!candidate) throw new NotFoundError("Candidate with given ID Not Found");
   res.status(StatusCodes.OK).json(candidate);
};

const deleteCandidate = async (req, res) => {
   const { id: candidateId } = req.params;
   const candidate = await Candidate.findByIdAndDelete({
      _id: candidateId,
   });
   if (!candidate) throw new NotFoundError("Candidate with given ID Not Found");
   res.status(StatusCodes.OK).json(candidate);
};
// Helper to build query per type

const getAssessmentCounts = async (req, res) => {
   const titles = [
      "newCandidates",
      "L1L2WrongNumbers",
      "Blacklist",
      "NonLeads",
      "L1WD",
      "L2WD",
      "NSWI",
      "NSIC",
      "Awaiting",
      "L2DND",
      "InterviewScheduled",
      "Rejects",
      "VirtualInterview",
      "OfferDrop",
      "AwaitingJoining",
      "Hold",
      "TrackingTenure",
      "NonTenure",
      "Billed",
      "N2B",
      "ProcessRampdown",
      "ClientRampdown",
      "InvoiceProcessed",
      "BusinessTracking",
      "all",
   ];

   const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
   const userId = req.user.userid;

   // Build all count promises
   const countPromises = titles.map(async (type) => {
      let query = buildQuery(type);
      if (access) {
         query = { ...query, assignedEmployee: userId };
      }
      const count = await Candidate.countDocuments(query);
      return [type, count];
   });

   const countsArr = await Promise.all(countPromises);
   const final = Object.fromEntries(countsArr);

   const allCompany = await Company.countDocuments({});

   res.status(StatusCodes.OK).json({
      ...final,
      allCompany,
   });
};
const bulkInsert = async (req, res) => {
   const data = req.body;
  
   
   const employees = await Candidate.insertMany(data.candidates, {
      ordered: false,
      rawResult: true,
   }); 
   res.status(StatusCodes.CREATED).json({ success: true, employees });
};

const searchCandidate = async (req, res) => {
   const { name: name, mobile: mobile, email: email } = req.body;
   query = [];
   if (name)
      query.push({ fullName: { $regex: ".*" + name + ".*", $options: "i" } });
   if (mobile)
      query.push({ mobile: { $regex: ".*" + mobile + ".*", $options: "i" } });
   if (email)
      query.push({ email: { $regex: ".*" + email + ".*", $options: "i" } });
   const candidates = await Candidate.find({ $or: query })
      .select(
         "_id createdByEmployee assignedEmployee fullName candidateId mobile l1Assessment l2Assessment interviewStatus "
      )
      .populate("assignedEmployee", "_id name")
      .populate("createdByEmployee", "_id name");

   res.status(StatusCodes.OK).json(candidates);
};
const getPotentialLeads = async (req, res) => {
   const { query: query, roleId: roleId, companyId: companyId } = req.body;
   const role = await Role.findById({ _id: roleId });
   var searchquery = {
      "qualifications.qualification": { $in: role.qualification },

      $or: [
         { currentCity: { $in: role.location } },
         { homeTown: { $in: role.location } },
      ],
   };
   if (role.mandatorySkills.length > 0 && role.optionalSkills.length > 0) {
      searchquery["skills"] = {
         $all: [...role.mandatorySkills],
         $in: [...role.optionalSkills],
      };
   } else if (role.mandatorySkills.length > 0)
      searchquery["skills"] = {
         $all: [...role.mandatorySkills],
      };
   else if (role.optionalSkills.length > 0)
      searchquery["skills"] = {
         $in: [...role.optionalSkills],
      };
   if (query.length > 0) searchquery["$nor"] = query;

   const candidates = await Candidate.find(searchquery)
      .populate("assignedEmployee")
      .populate("createdByEmployee")
      .exec();
   res.status(StatusCodes.OK).json(candidates);
};

const assignRecruiter = async (req, res) => {
   const { list: list } = req.body;
   var candidates = [];
   for (let { emp, part } of list) {
      for (let id of part) {
         try {
            const candidate = await Candidate.findByIdAndUpdate(
               { _id: id },
               { assignedEmployee: emp, assignedOn: new Date() }
            );
            candidates.push(candidate);
         } catch (error) {
            console.log(id);
         }
      }
   }
   res.status(StatusCodes.OK).json(candidates);
};
const assignSearch = async (req, res) => {
   
   const candidates = await Candidate.find({ ...req.body.query })
      .populate("assignedEmployee")
      .populate("createdByEmployee")
      .populate("companyId")
      .populate("roleId")
      .exec();
   res.status(StatusCodes.OK).json({ candidates });
};
const checkNumber = async (req, res) => {
   const { number: number } = req.params;

   const candidate = await Candidate.find({
      mobile: String(number),
   });
   var status = true;

   if (candidate.length == 0) {
      status = false;
   }

   res.status(StatusCodes.OK).json({ status });
};

const getAllByClass = async (req, res) => {
   const {
      companyId: companyId,
      roleId: roleId,
      page = 1,
      limit = 20,
   } = req.query;
   const { type: type } = req.params;
   var query = buildQuery(type);

   const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
   if (access) query.assignedEmployee = req.user.userid;

   // Pagination
   const skip = (parseInt(page) - 1) * parseInt(limit);

   // Get total count for pagination
   const total = await Candidate.countDocuments(query);

   const candidates = await Candidate.find(query)
      .select(
         "_id createdByEmployee assignedEmployee fullName candidateId mobile email l1Assessment l2Assessment companyId roleId interviewDate interviewStatus onboardingDate nextTrackingDate billingDate invoiceDate invoiceNumber remarks select rate"
      )
      .populate("companyId", "_id companyName ")
      .populate("roleId", "_id role")
      .populate("assignedEmployee", "_id name")
      .populate("createdByEmployee", "_id name")
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

   res.status(StatusCodes.OK).json({
      candidates,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
   });
};
const getAllByClassOnlyIDs = async (req, res) => {
   const { companyId: companyId, roleId: roleId } = req.query;
   const { type: type } = req.params;
   var query = buildQuery(type);

   const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
   if (access) query.assignedEmployee = req.user.userid;

   // Pagination
   const skip = (parseInt(page) - 1) * parseInt(limit);

   // Get total count for pagination
   const total = await Candidate.countDocuments(query);

   const candidates = await Candidate.find(query).select("_id ");

   res.status(StatusCodes.OK).json(candidates);
};

// API to export selected candidates to Excel
const exportSelectedCandidatesExcel = async (req, res) => {
   try {
      // Validate input
      const schema = z.object({
         ids: z
            .array(z.string().min(1))
            .min(1, "At least one candidate ID is required"),
         name: z.string().optional(),
      });
      const { ids, name } = schema.parse(req.body);

      // Fetch candidates by IDs
      const candidates = await Candidate.find({ _id: { $in: ids } })
         .populate("companyId", "_id companyName")
         .populate("roleId", "_id role")
         .populate("assignedEmployee", "_id name")
         .populate("createdByEmployee", "_id name")
         .lean();
      res.setHeader(
         "Content-Type",
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
         "Content-Disposition",
         `attachment; filename="${name || "candidates"}.xlsx"`
      );
      // Create workbook and worksheet
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
      const worksheet = workbook.addWorksheet("Candidates");

      // Define columns (do not leave any out)
      worksheet.columns = [
         { header: "Candidate ID", key: "candidateId", width: 15 },
         { header: "Full Name", key: "fullName", width: 20 },
         { header: "Mobile", key: "mobile", width: 20 },
         { header: "Email", key: "email", width: 25 },
         { header: "Home Town", key: "homeTown", width: 15 },
         { header: "Rate", key: "rate", width: 10 },
         { header: "Current City", key: "currentCity", width: 15 },
         { header: "Qualifications", key: "qualifications", width: 25 },
         { header: "Languages", key: "languages", width: 25 },
         { header: "Skills", key: "skills", width: 25 },
         { header: "Experience", key: "experience", width: 30 },
         { header: "Company", key: "companyName", width: 20 },
         { header: "Role", key: "roleName", width: 20 },
         { header: "Interview Date", key: "interviewDate", width: 15 },
         { header: "Remarks", key: "remarks", width: 20 },
         { header: "Interview Status", key: "interviewStatus", width: 20 },
         { header: "Select", key: "select", width: 10 },
         { header: "EMP_ID", key: "EMP_ID", width: 15 },
         { header: "Onboarding Date", key: "onboardingDate", width: 15 },
         { header: "Next Tracking Date", key: "nextTrackingDate", width: 15 },
         { header: "Billing Date", key: "billingDate", width: 15 },
         { header: "Invoice Number", key: "invoiceNumber", width: 15 },
         { header: "Invoice Date", key: "invoiceDate", width: 15 },
         { header: "L1 Assessment", key: "l1Assessment", width: 15 },
         { header: "L2 Assessment", key: "l2Assessment", width: 15 },
         {
            header: "Assigned Employee",
            key: "assignedEmployeeName",
            width: 20,
         },
         { header: "Created By", key: "createdByEmployeeName", width: 20 },
      ];

      // Add rows
      candidates.forEach((c) => {
         worksheet
            .addRow({
               candidateId: c.candidateId || "",
               fullName: c.fullName || "",
               mobile: Array.isArray(c.mobile) ? c.mobile.join(", ") : "",
               email: Array.isArray(c.email) ? c.email.join(", ") : "",
               homeTown: c.homeTown || "",
               rate: c.rate ?? "",
               currentCity: c.currentCity || "",
               qualifications: Array.isArray(c.qualifications)
                  ? c.qualifications
                       .map((q) => `${q.qualification || ""} (${q.YOP || ""})`)
                       .join("; ")
                  : "",
               languages: Array.isArray(c.languages)
                  ? c.languages
                       .map((l) => `${l.language || ""} (${l.level || ""})`)
                       .join("; ")
                  : "",
               skills: Array.isArray(c.skills) ? c.skills.join(", ") : "",
               experience: Array.isArray(c.experience)
                  ? c.experience
                       .map((e) => `${e.companyName || ""} (${e.role || ""})`)
                       .join("; ")
                  : "",
               companyName: c.companyId?.companyName || "",
               roleName: c.roleId?.role || "",
               interviewDate: c.interviewDate
                  ? new Date(c.interviewDate).toLocaleDateString()
                  : "",
               remarks: c.remarks || "",
               interviewStatus: c.interviewStatus || "",
               select: c.select || "",
               EMP_ID: c.EMP_ID || "",
               onboardingDate: c.onboardingDate
                  ? new Date(c.onboardingDate).toLocaleDateString()
                  : "",
               nextTrackingDate: c.nextTrackingDate
                  ? new Date(c.nextTrackingDate).toLocaleDateString()
                  : "",
               billingDate: c.billingDate
                  ? new Date(c.billingDate).toLocaleDateString()
                  : "",
               invoiceNumber: c.invoiceNumber || "",
               invoiceDate: c.invoiceDate
                  ? new Date(c.invoiceDate).toLocaleDateString()
                  : "",
               l1Assessment: c.l1Assessment || "",
               l2Assessment: c.l2Assessment || "",
               assignedEmployeeName: c.assignedEmployee?.name || "",
               createdByEmployeeName: c.createdByEmployee?.name || "",
            })
            .commit();
      });
      // Set response headers for file download
      worksheet.commit();
      await workbook.commit();
   } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: error.message,
      });
   }
};
const bulkDeleteCandidates = async (req, res) => {
   try {
      const { ids } = req.body;

      // Validation: Check if ids is provided and is an array
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
         return res.status(400).json({
            success: false,
            message: "Invalid request. Please provide an array of IDs.",
         });
      }

      // Optional: Add authorization check (only admin can bulk delete)
      // const user = req.user; // Assuming you have user from auth middleware
      // if (user.employeeType !== "Admin") {
      //    return res.status(403).json({
      //       success: false,
      //       message: "Only admins can perform bulk delete operations",
      //    });
      // }

      // Perform bulk delete
      const result = await Candidate.deleteMany({
         _id: { $in: ids },
      });

      // Check if any documents were deleted
      if (result.deletedCount === 0) {
         return res.status(404).json({
            success: false,
            message: "No candidates found with the provided IDs.",
            deletedCount: 0,
         });
      }

      res.status(200).json({
         success: true,
         message: `Successfully deleted ${result.deletedCount} candidate(s)`,
         deletedCount: result.deletedCount,
      });
   } catch (error) {
      console.error("Error in bulkDeleteCandidates:", error);
      res.status(500).json({
         success: false,
         message: "Failed to delete candidates",
         error: error.message,
      });
   }
};

module.exports = {
   getCandidate,
   addCandidate,
   updateCandidate,
   deleteCandidate,
   getAssessmentCounts,
   bulkInsert,
   searchCandidate,
   getPotentialLeads,
   assignRecruiter,
   assignSearch,
   checkNumber,
   getAllByClass,
   getAllByClassOnlyIDs,
   exportSelectedCandidatesExcel,
   bulkDeleteCandidates
};
