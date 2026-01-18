const { StatusCodes } = require("http-status-codes");
const Remark = require("../models/remarks");

const addRemarks = async (req, res) => {
   const newRemark = await Remark.create({ ...req.body })
   const addedRemarks = await Remark.findById(newRemark._id)
      .populate("employeeId", "_id name")
      .sort("-createdAt");
   res.status(StatusCodes.OK).json(addedRemarks);
};
const getCandidateRemarks = async (req, res) => {
   const { candidateId } = req.params;
   const candidateRemarks = await Remark.find({
      candidateId: candidateId,
   })
      .populate("employeeId", "_id name")
      .sort("-createdAt");
   res.status(StatusCodes.OK).json(candidateRemarks);
};

const getCompanyRemarks = async (req, res) => {
   const { companyId } = req.params;
   const companyRemarks = await Remark.find({
      companyId: companyId,
   })
      .select("_id remarks employeeId createdAt")
      .populate("employeeId", "_id name")
      .sort("-createdAt");
   res.status(StatusCodes.OK).json(companyRemarks);
};
module.exports={
   addRemarks,getCandidateRemarks,getCompanyRemarks
}