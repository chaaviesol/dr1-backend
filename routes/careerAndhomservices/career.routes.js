const express = require("express");
const {
  careerupload,
  getcareerrequest,
  homeserviceupload,
  homeservicerequests,
  addcategory,
  getcategory,
} = require("./career.controller");
const CareerRouter = express.Router();
const auth = require("../../middleware/Auth/auth");

CareerRouter.post("/careerupload", careerupload);
CareerRouter.get("/getcareers", getcareerrequest);
CareerRouter.post("/homeserviceupload", homeserviceupload);
CareerRouter.get("/homeservicerequests", homeservicerequests);
CareerRouter.post("/addcategory", addcategory);
CareerRouter.get("/getcategory", getcategory);

module.exports = CareerRouter;
