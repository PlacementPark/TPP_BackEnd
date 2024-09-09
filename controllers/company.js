const { NotFoundError } = require("../errors/not-found");
const Candidate = require("../models/candidate");
const Company = require("../models/company");
const mongoose = require("mongoose");
const Role = require("../models/role");
const { StatusCodes } = require("http-status-codes");
// const { BadRequestError, NotFoundError } = require('../errors')

const getAllCompanies = async (req, res) => {
  const companies = await Company.find({});
  return res.status(StatusCodes.OK).json(companies);
};
const addCompany = async (req, res) => {
  const cRoles = req.body.roles || [];
  const saveRoles = async () => {
    var roleIDs = [];
    for (let role = 0; role < cRoles.length; role++) {
      const i = new Role({
        ...cRoles[role],
      });

      const savedRole = await i.save();

      roleIDs.push(savedRole._id);
    }

    return roleIDs;
  };
  const { roles, ...rest } = req.body;
  const company = new Company({
    ...rest,
    roles: (await saveRoles()) || [],
  });
  const savedCompany = await company.save();
  res.status(StatusCodes.CREATED).json(savedCompany);
};

const addCompanyRoles = async (req, res) => {
  const {
    params: { id: companyId },
  } = req;
  const cRoles = req.body.roles;
  const saveRoles = async () => {
    var roleIDs = [];
    for (let role = 0; role < cRoles.length; role++) {
      const i = new Role({
        ...cRoles[role],
      });

      const savedRole = await i.save();

      roleIDs.push(savedRole._id);
    }

    return roleIDs;
  };
  req.body.roles = (await saveRoles()) || [];
  const company = await Company.findByIdAndUpdate(
    {
      _id: companyId,
    },
    {
      $push: { ...req.body },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!company) {
    throw new NotFoundError("Company not found with given id");
  }
  res.status(StatusCodes.OK).json(company);
};
const getRoles = async (req, res) => {
  const {
    params: { id: companyId },
  } = req;
  const company = await Company.findById({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found with given id");
  }
  const companyRoles = await Company.findOne({ _id: companyId })
    .populate("roles")
    .exec();
  res.status(StatusCodes.OK).json(companyRoles);
};
const getCompany = async (req, res) => {
  const {
    params: { id: companyId },
  } = req;
  const company = await Company.findOne({ _id: companyId })
    .populate("roles")
    .exec();
    const uproles = await Promise.all(
      company.roles.map(async (role) => {
        const inProcess = await Candidate.find({
          interviewStatus: {
            $in: [
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
            ],
          },
          select: { $in: ["", null] },
          roleId: role._id,
        });
        const rejected = await Candidate.find({
          interviewStatus: {
            $in: [
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
            ],
          },
          select: { $in: ["", null] },
          roleId: role._id,
        });
        const awaiting = await Candidate.find({
          interviewStatus: {
            $in: ["Select"],
          },
          select: { $in: ["", null] },
          roleId: role._id,
        });
        const offerDrop = await Candidate.find({
          interviewStatus: {
            $in: ["Offer Drop"],
          },
          select: { $in: ["", null] },
          roleId: role._id,
        });
        const joined = await Candidate.find({
          select: {
            $in: ["Tracking", "Non tenure", "Need to Bill", "Billed"],
          },
          roleId: role._id,
        });
        const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
        if (!access)
          return {
            ...role._doc,
            inProcess: inProcess.length,
            awaiting: awaiting.length,
            offerDrop: offerDrop.length,
            joined: joined.length,
            rejected: rejected.length,
          };
        else
          return {
            ...role._doc,
            inProcess: inProcess.filter(
              (candidate) =>
                String(candidate.assignedEmployee) === req.user.userid
            ).length,
            awaiting: awaiting.filter(
              (candidate) =>
                String(candidate.assignedEmployee) === req.user.userid
            ).length,
            offerDrop: offerDrop.filter(
              (candidate) =>
                String(candidate.assignedEmployee) === req.user.userid
            ).length,
            joined: joined.filter(
              (candidate) =>
                String(candidate.assignedEmployee) === req.user.userid
            ).length,
            rejected: rejected.filter(
              (candidate) =>
                String(candidate.assignedEmployee) === req.user.userid
            ).length,
          };
      })
    );
  
  res.status(StatusCodes.OK).json({...company._doc,roles:uproles});
};
const deleteCompany = async (req, res) => {
  const {
    params: { id: companyId },
  } = req;
  const company = await Company.findOne({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found with given id");
  }
  company.roles.map(async (role) => {
    await Role.deleteOne({ _id: role });
  });

  await Company.deleteOne({ _id: company._id });
  res.status(StatusCodes.OK).json(company);
};

const deleteRole = async (req, res) => {
  const {
    params: { companyId: companyId, roleId: roleId },
  } = req;
  const company = await Company.findById({ _id: companyId });
  if (!company) throw new NotFoundError("Company not found with given id");
  const updateCompany = await Company.findByIdAndUpdate(
    { _id: companyId },
    {
      ...company._doc,
      roles: company._doc.roles.filter((r) => r != roleId),
    }
  );
  const role = await Role.findByIdAndDelete({ _id: roleId });
  if (!role) throw new NotFoundError("Role not found with given id");
  res.status(StatusCodes.OK).json(company);
};

const getCompanyUseType = async (req, res) => {
  const { companyType: companyType } = req.query;
  var query = { response: companyType };
  if(!companyType)
    query = {}
  const companies = await Company.find(query)
    .populate("roles")
    .exec();
  const upcompanies = await Promise.all(companies.map(async (company) => {
    const inProcess = await Candidate.find({
      interviewStatus: {
        $in: [
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
        ],
      },
      select: { $in: ["", null] },
      companyId: company._id,
    });
    const rejected = await Candidate.find({
      interviewStatus: {
        $in: [
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
        ],
      },
      select: { $in: ["", null] },
      companyId: company._id,
    });
    const awaiting = await Candidate.find({
      interviewStatus: {
        $in: ["Select"],
      },
      select: { $in: ["", null] },
      companyId: company._id,
    });
    const offerDrop = await Candidate.find({
      interviewStatus: {
        $in: ["Offer Drop"],
      },
      select: { $in: ["", null] },
      companyId: company._id,
    });
    const joined = await Candidate.find({
      select: {
        $in: ["Tracking", "Non tenure", "Need to Bill", "Billed"],
      },
      companyId: company._id,
    });
    const access = ["Intern", "Recruiter"].includes(req.user.employeeType);
    if(!access)
      return {
        ...company._doc,
        inProcess: inProcess.length,
        awaiting: awaiting.length,
        offerDrop: offerDrop.length,
        joined: joined.length,
        rejected: rejected.length,
      };
    else
    return {
      ...company._doc,
      inProcess: inProcess.filter(
        (candidate) => String(candidate.assignedEmployee) === req.user.userid
      ).length,
      awaiting: awaiting.filter(
        (candidate) => String(candidate.assignedEmployee) === req.user.userid
      ).length,
      offerDrop: offerDrop.filter(
        (candidate) => String(candidate.assignedEmployee) === req.user.userid
      ).length,
      joined: joined.filter(
        (candidate) => String(candidate.assignedEmployee) === req.user.userid
      ).length,
      rejected: rejected.filter(
        (candidate) => String(candidate.assignedEmployee) === req.user.userid
      ) .length,
    };
  }));
  res.status(StatusCodes.OK).json(upcompanies);
};

const getCompanyCounts = async (req, res) => {
  const values = await Company.aggregate().sortByCount("response");
  res.status(StatusCodes.OK).json(values);
};

const checkNumber = async (req, res) => {
  const { number: number } = req.params;

  const candidate = await Company.find({
    HRMobile: String(number),
  });
  var status = true;

  if (candidate.length == 0) {
    status = false;
  }

  res.status(StatusCodes.OK).json({ status });
};
const bulkInsert = async (req, res) => {
  const data = req.body;
  const companies = await Company.insertMany(data, {
    ordered: false,
    rawResult: true,
  });
  res.status(StatusCodes.CREATED).json({ success: true });
};
const getRole = async (req, res) => {
  const {
    params: { companyId: companyId, roleId: roleId },
  } = req;
  const company = await Company.find({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found with given id");
  }
  const role = await Role.find({ _id: roleId });
  if (!role) {
    throw new NotFoundError("Role not found with given id");
  }
  res.status(StatusCodes.OK).json(role);
};
const updateRole = async (req, res) => {
  const {
    params: { companyId: companyId, roleId: roleId },
  } = req;
  const company = await Company.find({ _id: companyId });
  if (!company) {
    throw new NotFoundError("Company not found with given id");
  }
  const data = req.body;
  const role = await Role.findByIdAndUpdate({ _id: roleId }, { ...data });
  if (!role) {
    throw new NotFoundError("Role not found with given id");
  }
  res.status(StatusCodes.OK).json(role);
};
const editCompany = async (req, res) => {
  const {
    params: { id: companyId },
  } = req;
  const company = await Company.findById({ _id: companyId });
  var delrole = [];
  if (req.body.roles.length != company.roles.length) {
    delrole = company.roles
      .map((r) => r.toString())
      .filter((ro) => !req.body.roles.includes(ro));
    delrole.forEach(async (r) => {
      const role = await Role.findByIdAndDelete(r);
    });
  }
  const { roles, ...rest } = req.body;

  const upcompany = await Company.findByIdAndUpdate(
    { _id: companyId },
    { ...rest, $pull: { roles: { $in: delrole } } },
    { new: true, runValidators: true }
  );
  res.status(StatusCodes.OK).json(upcompany);
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
};
