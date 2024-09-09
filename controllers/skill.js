const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors/not-found");
const Skill = require("../models/skill");
const getSkills = async (req, res) => {
  const skills = await Skill.find({});
  res.status(StatusCodes.OK).json(skills);
};
const addSkills = async (req,res) => {
  const data = req.body 
  const skills = await Skill.insertMany(data)
  res.status(StatusCodes.CREATED).json(skills)
}
module.exports = { getSkills,addSkills };
