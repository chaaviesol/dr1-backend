const express = require("express");
const {
  addadmin,
  adminLogin,
  getadmins,
  editadmin,
  admprofile,
  deleteadmin,
  addcategory,
  get_category,
  forgotPwd,
  resetpassword,
  editcategory,
  getAllTypesAndCategories,
  alltypefeedback,
  feedbackapproval,
  totalCount,
  messagesave,
  getchatdata,
  getalldatas,
  chatstatusupdate
} = require("./admin.controller");

const adminRouter = express.Router();
adminRouter.post("/addadmin", addadmin);
adminRouter.post("/admprofile", admprofile);
adminRouter.post("/adminlogin", adminLogin);
adminRouter.post("/editadmin", editadmin);
adminRouter.get("/getadmin", getadmins);
adminRouter.post("/deleteadmin", deleteadmin);

adminRouter.route("/forgotpwd").post(forgotPwd);
adminRouter.route("/resetpassword").post(resetpassword);
///////////////////doc,lab & hospital category/////////////
adminRouter.post("/addcategory", addcategory);
adminRouter.get("/getcategory", get_category);
adminRouter.post("/editcategory", editcategory);
adminRouter.get("/getallcategories", getAllTypesAndCategories);





//////for all type//////////////
adminRouter.get("/alltypefeedback", alltypefeedback); ///get all feedbacks of all type
adminRouter.post("/feedbackapproval", feedbackapproval); ///approval api for all type of feedbackk

adminRouter.post("/total_count", totalCount); //count of total doctors,disabled doctors,pending doctors and active doctors for drs,lab & hospital && all of themm

adminRouter.post("/messagesave", messagesave); //first chatbot for partners signup
adminRouter.get("/getchatdata", getchatdata);
adminRouter.post("/updatechatstatus",chatstatusupdate)//update the status of registered health partners thru chat bot
adminRouter.post("/getalldatas", getalldatas); ///alldatas

module.exports = adminRouter;
