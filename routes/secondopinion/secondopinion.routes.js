const express = require("express");
const {
  addreport,
  getallreport,
  getareport,
  statusupdate,
  getqueries,
  addquery,
  getaquery,
  queryupdate,
  adddocremarks,
  getallqueries,
  editremarks,
  getcusquery,
  querycomplete,
} = require("./secondopinion.controller");

const { upload } = require("../../middleware/Uploadimage");
const OpinionRouter = express.Router();
const auth = require("../../middleware/Auth/auth");

OpinionRouter.post("/addreport", upload.array("images"), auth, addreport);
OpinionRouter.get("/getallreport", getallreport);
OpinionRouter.post("/getareport", getareport);
OpinionRouter.post("/statusupdate", statusupdate);
OpinionRouter.post("/addquery", auth, addquery);
OpinionRouter.get("/getcusquery", auth, getcusquery);
/////////////for superadmin///////////
OpinionRouter.get("/getallqueries", getallqueries);
OpinionRouter.post("/getaquery", getaquery);
OpinionRouter.post("/queryupdate", queryupdate); //for admin to choose best remarks
OpinionRouter.get("/querycomplete", querycomplete);
///////////for doc-admin////////
OpinionRouter.post("/adddocremarks", auth, adddocremarks);
OpinionRouter.get("/getqueries", auth, getqueries);
OpinionRouter.post("/editremarks", auth, editremarks); //for doc edit their answered remark
module.exports = OpinionRouter;
