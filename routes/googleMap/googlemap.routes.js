const express = require("express");
const { getCurrentLocation } = require("./googlemap.controller");


const googleMapRouter = express.Router();


googleMapRouter.post("/getcurrentlocation",getCurrentLocation)

module.exports=googleMapRouter