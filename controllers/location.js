const { StatusCodes } = require("http-status-codes");
const { NotFoundError } = require("../errors/not-found");
const Location = require("../models/location");
const getLocations = async (req,res) =>{
    const locations = await Location.find({})
    res.status(StatusCodes.OK).json(locations)
}
const addLocations = async (req,res) => {
    const data = req.body 
    const locations  = Location.insertMany(data)
    res.status(StatusCodes.CREATED).json(locations)
}
module.exports = {getLocations}
