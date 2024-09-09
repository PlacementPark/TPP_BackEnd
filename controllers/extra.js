const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors/not-found");
const Extra = require("../models/extra");
const getLocations = async (req, res) => {
  const locations = await Extra.findById({ _id: "Locations" });
  res.status(StatusCodes.OK).json(locations);
};
const addLocations = async (req, res) => {
  const data = req.body;

  const locations = await Extra.findByIdAndUpdate({ _id: "Locations" }, data,{new:true});
  res.status(StatusCodes.CREATED).json(locations);
};
const getSkills = async (req, res) => {
  const skills = await Extra.findById({ _id: "Skills" });
  res.status(StatusCodes.OK).json(skills);
};
const addSkills = async (req, res) => {
  const data = req.body;

  const skills = await Extra.findByIdAndUpdate({ _id: "Skills" }, data);
  res.status(StatusCodes.CREATED).json(skills);
};
const getLanguages = async (req, res) => {
  const skills = await Extra.findById({ _id: "Languages" });
  res.status(StatusCodes.OK).json(skills);
};
const addLanguages = async (req, res) => {
  const data = req.body;

  const skills = await Extra.findByIdAndUpdate({ _id: "Languages" }, data, {
    new: true,
  });
  res.status(StatusCodes.CREATED).json(skills);
};
const getQualifications = async (req, res) => {
  const qualifications = await Extra.findById({ _id: "Qualifications" });
  res.status(StatusCodes.OK).json(qualifications);
};
const addQualifications = async (req, res) => {
  const data = req.body;
  const qualifications = await Extra.findByIdAndUpdate(
    { _id: "Qualifications" },
    data,
    { new: true }
  );
  res.status(StatusCodes.CREATED).json(qualifications);
};
const getAll = async (req, res) => {
  const all = await Extra.find({});
  res.status(StatusCodes.OK).json(all);
};
const bulkUpdate = async (req, res) => {
  const query = req.body;
  const all = await Extra.bulkWrite(query);
  res.status(StatusCodes.OK).json(all);
};
module.exports = {
  getLocations,
  getSkills,
  addSkills,
  addLocations,
  getAll,
  bulkUpdate,
  getQualifications,
  addQualifications,
  getLanguages,
  addLanguages
};
