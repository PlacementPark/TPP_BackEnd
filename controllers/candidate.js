const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors/not-found");
const Candidate = require("../models/candidate");
const Role = require("../models/role");
const Count = require("../models/count");
const Company = require("../models/company");

const addCandidate = async (req, res) => {
  const candidate = await Candidate.create({ ...req.body });
  res.status(StatusCodes.CREATED).json({ success: true, candidate: candidate });
};

const getAllCandidates = async (req, res) => {
  const {
    l1Assessment: l1Assessment,
    l2Assessment: l2Assessment,
    select: select,
    interviewStatus: interviewStatus,
    awaiting: awaiting,
    companyId: companyId,
    roleId: roleId,
  } = req.query;
  var query = [];
  if (l1Assessment)
    query.push({ l1Assessment: { $in: l1Assessment.split(",") } });
  if (l2Assessment)
    query.push({ l2Assessment: { $in: l2Assessment.split(",") } });
  if (select) query.push({ select: { $in: select.split(",") } });
  if (interviewStatus)
    query.push({ interviewStatus: { $in: interviewStatus.split(",") } });

  if (query.length == 0) {
    query = {};
  } else {
    query = { $or: query };
  }
  if (awaiting) {
    query = { l1Assessment: ["GOOD", "TAC"], l2Assessment: null };
  }

  var candidates = await Candidate.find(query)
    .populate("companyId")
    .populate("roleId")
    .populate("assignedEmployee")
    .populate("createdByEmployee")
    .exec();

  const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
  if (companyId) {
    candidates = candidates.filter(
      (c) => String(c.companyId?._id) == companyId
    );
  }
  if (roleId) {
    candidates = candidates.filter((c) => String(c.roleId?._id) == roleId);
  }
  if (access) {
    candidates = candidates.filter(
      (c) => c.assignedEmployee == req.user.userid
    );
  }

  res.status(StatusCodes.OK).json(candidates);
};

const getCandidate = async (req, res) => {
  const { id: candidateId } = req.params;

  const candidate = await Candidate.findById({
    _id: candidateId,
  })
    .populate("companyId")
    .populate("roleId")
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
  );
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

const getAssessmentCounts = async (req, res) => {
  const titles = [
    "newCandidates",
    "L1L2WrongNumbers",
    "L1L2Blacklist",
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
  var final = {};
  const counts = await Promise.all(
    titles.map(async (type) => {
      var query;
      if (type === "newCandidates") {
        query = {
          l1Assessment: { $in: "DND,Number Not Reachable".split(",") },
          l2Assessment: { $in: ["", null] },
        };
      } else if (type === "L1L2WrongNumbers") {
        query = {
          $or: [
            { l1Assessment: "Wrong Number" },
            { l2Assessment: "Wrong Number" },
          ],
        };
      } else if (type === "L1L2Blacklist") {
        query = {
          $or: [{ l1Assessment: "Blacklist" }, { l2Assessment: "Blacklist" }],
        };
      } else if (type === "NonLeads") {
        query = {
          $or: [
            {
              l1Assessment: {
                $in: "NE-Fresher,NI-In-Job,NE-Experienced,NI-Convincing".split(
                  ","
                ),
              },
            },
            {
              l2Assessment: {
                $in: "NE-Fresher,NI-In-Job,NE-Experienced,NI-Convincing".split(
                  ","
                ),
              },
            },
          ],
        };
      } else if (type === "L1WD") {
        query = {
          l1Assessment: "WD",
          l2Assessment: { $in: ["", null] },
        };
      } else if (type === "L2WD") {
        query = {
          l2Assessment: "WD",
          interviewStatus: { $in: ["", null] },
        };
      } else if (type === "NSWI") {
        query = {
          interviewStatus: "No Show Walk-in",
          select: { $in: ["", null] },
        };
      } else if (type === "NSIC") {
        query = {
          interviewStatus: "No Show IC",
          select: { $in: ["", null] },
        };
      } else if (type === "Awaiting") {
        query = {
          l1Assessment: { $in: ["GOOD", "TAC"] },
          l2Assessment: { $in: ["", null] },
        };
      } else if (type === "L2DND") {
        query = {
          l2Assessment: "DND",
          interviewStatus: { $in: ["", null] },
        };
      } else if (type === "InterviewScheduled") {
        query = {
          interviewStatus: {
            $in: "Pending FSR,Pending Amcat,Pending Versant,Pending Technical,Pending Typing,Pending Group Discussion,Pending Ops/Client,Pending Vice President".split(
              ","
            ),
          },
          select: { $in: ["", null] },
        };
      } else if (type === "Rejects") {
        query = {
          interviewStatus: {
            $in: "Reject FSR Communication,Reject FSR Stability,Reject FSR Domain,Reject Amcat,Reject Amcat – Technical Issue,Reject Amcat Cooling Period,Reject Versant,Reject Versant – Technical Issue,Reject Versant Cooling Period,Reject Technical,Reject Typing,Reject Group Discussion,Reject Ops/Client Communication,Reject Ops/Client Stability,Reject Ops/Client Domain,Reject Vice President".split(
              ","
            ),
          },
          select: { $in: ["", null] },
        };
      } else if (type === "VirtualInterview") {
        query = {
          interviewStatus: {$in:"TPP Venue,Client Venue,Virtual Interview".split(",")},
          select: { $in: ["", null] },
        };
      } else if (type === "OfferDrop") {
        query = {
          interviewStatus: "Offer Drop",
          select: { $in: ["", null] },
        };
      } else if (type === "AwaitingJoining") {
        query = {
          interviewStatus: "Select",
          select: { $in: ["", null] },
        };
      } else if (type === "Hold") {
        query = {
          interviewStatus: "Hold",
          select: { $in: ["", null] },
        };
      } else if (type === "TrackingTenure") {
        query = {
          select: "Tracking",
        };
      } else if (type === "InvoiceProcessed") {
        query = {
          select: "Invoice Processed",
        };
      } else if (type === "Billed") {
        query = {
          select: "Billed",
        };
      } else if (type === "N2B") {
        query = {
          select: "Need to Bill",
        };
      } else if (type === "NonTenure") {
        query = {
          select: "Non Tenure",
        };
      } else if (type === "BusinessTracking") {
        query = {
          select: {
            $in: ["Tracking", "Need to Bill", "Billed", "Invoice Processed"],
          },
        };
      } else if (type === "ProcessRampdown") {
        query = {
          select: "Process Rampdown",
        };
      } else if (type === "ClientRampdown") {
        query = {
          select: "Client Rampdown",
        };
      } else if (type === "joined") {
        query = {
          select: { $in: "Tracking,Non tenure,Need to Bill,Billed".split(",") },
        };
      } else if (type === "all") {
        query = {};
      }
      var candidates = await Candidate.find(query);
      const access = ["Intern", "Recruiter"].includes(req.user.employeeType);

      if (!access) final[type] = candidates.length;
      else
        final[type] = candidates.filter(
          (candidate) => String(candidate.assignedEmployee) === req.user.userid
        ).length;

      return { type: candidates.length };
    })
  );

  const allCompany = await Company.find({});

  res.status(StatusCodes.OK).json({
    ...final,
    allCompany: allCompany.length,
  });
};

const bulkInsert = async (req, res) => {
  const data = req.body;
  const employees = await Candidate.insertMany(data, {
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
  const candidates = await Candidate.find({ $or: query });

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
  for(let {emp,part} of list){
    for( let id of part){
        try {
          const candidate = await Candidate.findByIdAndUpdate(
            { _id: id },
            { assignedEmployee: emp }
          );
          candidates.push(candidate);
          
        } catch (error) {
          console.log(id);
          
        }
    }
    
  };
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
const getCompanyRoleCounts = async (req, res) => {
  const {
    interviewStatus: interviewStatus,
    companyId: companyId,
    roleId: roleID,
  } = req.body;
};
const getAllByClass = async (req, res) => {
  const { companyId: companyId, roleId: roleId } = req.query;
  const { type: type } = req.params;
  var query;
  if (type === "newCandidates") {
    query = {
      l1Assessment: { $in: "DND,Number Not Reachable".split(",") },
      l2Assessment: { $in: ["", null] },
    };
  } else if (type === "L1L2WrongNumbers") {
    query = {
      $or: [{ l1Assessment: "Wrong Number" }, { l2Assessment: "Wrong Number" }],
    };
  } else if (type === "L1L2Blacklist") {
    query = {
      $or: [{ l1Assessment: "Blacklist" }, { l2Assessment: "Blacklist" }],
    };
  } else if (type === "NonLeads") {
    query = {
      $or: [
        {
          l1Assessment: {
            $in: "NE-Fresher,NI-In-Job,NE-Experienced,NI-Convincing".split(","),
          },
        },
        {
          l2Assessment: {
            $in: "NE-Fresher,NI-In-Job,NE-Experienced,NI-Convincing".split(","),
          },
        },
      ],
    };
  } else if (type === "L1WD") {
    query = {
      l1Assessment: "WD",
      l2Assessment: { $in: ["", null] },
    };
  } else if (type === "L2WD") {
    query = {
      l2Assessment: "WD",
      interviewStatus: { $in: ["", null] },
    };
  } else if (type === "NSWI") {
    query = {
      interviewStatus: "No Show Walk-in",
      select: { $in: ["", null] },
    };
  } else if (type === "NSIC") {
    query = {
      interviewStatus: "No Show IC",
      select: { $in: ["", null] },
    };
  } else if (type === "Awaiting") {
    query = {
      l1Assessment: { $in: ["GOOD", "TAC"] },
      l2Assessment: { $in: ["", null] },
    };
  } else if (type === "L2DND") {
    query = {
      l2Assessment: "DND",
      interviewStatus: { $in: ["", null] },
    };
  } else if (type === "InterviewScheduled") {
    query = {
      interviewStatus: {
        $in: "Pending FSR,Pending Amcat,Pending Versant,Pending Technical,Pending Typing,Pending Group Discussion,Pending Ops/Client,Pending Vice President".split(
          ","
        ),
      },
      select: { $in: ["", null] },
    };
  } else if (type === "CompanyInterviewScheduled") {
    query = {
      interviewStatus: {
        $in: "TPP Venue,Client Venue,Virtual Interview,Pending FSR,Pending Amcat,Pending Versant,Pending Technical,Pending Typing,Pending Group Discussion,Pending Ops/Client,Pending Vice President".split(
          ","
        ),
      },
      select: { $in: ["", null] },
    };
  } else if (type === "Rejects") {
    query = {
      interviewStatus: {
        $in: "Reject FSR Communication,Reject FSR Stability,Reject FSR Domain,Reject Amcat,Reject Amcat – Technical Issue,Reject Amcat Cooling Period,Reject Versant,Reject Versant – Technical Issue,Reject Versant Cooling Period,Reject Technical,Reject Typing,Reject Group Discussion,Reject Ops/Client Communication,Reject Ops/Client Stability,Reject Ops/Client Domain,Reject Vice President".split(
          ","
        ),
      },
      select: { $in: ["", null] },
    };
  } else if (type === "VirtualInterview") {
    query = {
      interviewStatus: {$in:"TPP Venue,Client Venue,Virtual Interview".split(",")},
      select: { $in: ["", null] },
    };
  } else if (type === "OfferDrop") {
    query = {
      interviewStatus: "Offer Drop",
      select: { $in: ["", null] },
    };
  } else if (type === "AwaitingJoining") {
    query = {
      interviewStatus: "Select",
      select: { $in: ["", null] },
    };
  } else if (type === "Hold") {
    query = {
      interviewStatus: "Hold",
      select: { $in: ["", null] },
    };
  } else if (type === "TrackingTenure") {
    query = {
      select: "Tracking",
    };
  } else if (type === "InvoiceProcessed") {
    query = {
      select: "Invoice Processed",
    };
  } else if (type === "Billed") {
    query = {
      select: "Billed",
    };
  } else if (type === "N2B") {
    query = {
      select: "Need to Bill",
    };
  } else if (type === "BusinessTracking") {
    query = {
      select: {
        $in: ["Tracking", "Need to Bill", "Billed", "Invoice Processed"],
      },
    };
  } else if (type === "NonTenure") {
    query = {
      select: "Non Tenure",
    };
  } else if (type === "ProcessRampdown") {
    query = {
      select: "Process Rampdown",
    };
  } else if (type === "ClientRampdown") {
    query = {
      select: "Client Rampdown",
    };
  } else if (type === "joined") {
    query = {
      select: {
        $in: ["Tracking", "Non tenure", "Need to Bill", "Billed"],
      },
    };
  } else if (type === "all") {
    query = {};
  }
  var candidates = await Candidate.find(query)
    .populate("companyId")
    .populate("roleId")
    .populate("assignedEmployee")
    .populate("createdByEmployee")
    .exec();
  const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
  if (companyId) {
    candidates = candidates.filter(
      (c) => String(c.companyId?._id) == companyId
    );
  }
  if (roleId) {
    candidates = candidates.filter((c) => String(c.roleId?._id) === roleId);
  }
  if (access) {
    candidates = candidates.filter(
      (c) => c.assignedEmployee?._id == req.user.userid
    );
  }

  res.status(StatusCodes.OK).json(candidates);
};

module.exports = {
  getAllCandidates,
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
};
