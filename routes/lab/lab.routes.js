const express = require("express");
const {
  labLogin,
  addlab,
  getlab,
  editlab,
  deletelab,
  filterlab,
  services,
  get_labBypin,
  getlabdetails,
  labpriceadd,
  lab_feedback,
  lab_searchdata,
  getalabfeedback,
  feedbackapproval,
  get_feedback,
  get_searchdata,
  lab_disable,
  getunapprovelab,
  approvelab,
  completeedit,
  nearestlab
} = require("./lab.controller");
const { upload } = require("../../middleware/Uploadimage");
const LabRouter = express.Router();
const auth = require("../../middleware/Auth/auth");
LabRouter.route("/lablogin").post(labLogin);
// LabRouter.route('/addlab',upload.array('image')).post(addlab)
LabRouter.post("/addlab", upload.array("image"), addlab);
LabRouter.route("/getlab").get(getlab);
LabRouter.post("/editlab",auth,editlab);
LabRouter.post("/deletelab",auth,deletelab);
LabRouter.route("/filterlab").post(filterlab);
LabRouter.route("/services").post(services);
LabRouter.route("/pincode_result").post(get_labBypin);
LabRouter.route("/labdetails").post(getlabdetails);
LabRouter.post("/labpriceadd",auth,labpriceadd);
LabRouter.post("/lab_feedback",auth,lab_feedback);
LabRouter.route("/lab_searchdata").post(lab_searchdata);
LabRouter.post("/getalabfeedback", getalabfeedback); //feedback of a single lab
LabRouter.post("/feedbackapproval",auth, feedbackapproval);
LabRouter.get("/get_feedback", get_feedback); //all feedbacks
LabRouter.get("/get_searchdata", get_searchdata); //all searchdata
LabRouter.post("/labdisable", auth,lab_disable);
LabRouter.get("/getunapprovelab", auth,getunapprovelab);
LabRouter.post("/approvelab",auth, approvelab);
LabRouter.post("/editbyadmin",auth, completeedit);
LabRouter.post("/nearestlab", nearestlab);

module.exports = LabRouter;