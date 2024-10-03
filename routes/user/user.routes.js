const express = require("express");
const {
  addUsers,
  userLogin,
  getusers,
  edituser,
  deleteuser,
  login,
  forgotPwd,
  resetpassword,
  consultcount,
  viewcount,
  allcount,
  completeRegistration,
  userdisable,
  monthlyCount,
  emailencryption,
  Doctorafterconsult,
  hospitalafterconsult,
  labafterconsult,
  afterconsultupdate,
  getunapproveuser,
  approveuser,
  getprofile,
  decryptEmails,
  auserinteract,
  profilecompleted,
  profilecount,
  UserforgotPwd,
  userresetpassword,
  userotpLogin,
} = require("./user.controller");

const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");
const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.route("/userlogin").post(userLogin);
UserRouter.route("/getusers").get(getusers);
UserRouter.post("/edituser", auth, upload.single("image"), edituser);
UserRouter.route("/deleteuser").post(deleteuser);
UserRouter.route("/login").post(login); //login api for lab,hospital& doctor
UserRouter.post("/forgotpwd", forgotPwd); //forgot password api for lab,hospital& doctor
UserRouter.post("/userforgotpwd", UserforgotPwd);
UserRouter.route("/resetpassword").post(resetpassword);
UserRouter.post("/userresetpassword", userresetpassword);
UserRouter.post("/userotpLogin", userotpLogin);

UserRouter.post("/consultcount", auth, consultcount);
UserRouter.post("/viewcount", auth, viewcount);
UserRouter.route("/allcount").post(allcount);
UserRouter.post(
  "/completeRegistration",
  auth,
  upload.single("image"),
  completeRegistration
);
UserRouter.route("/userdisable").post(userdisable);
UserRouter.route("/monthlyCount").post(monthlyCount);

///sending consulted details
UserRouter.post("/doctorafterconsult", auth, Doctorafterconsult);//asking whether they consulted or not /like to give feedback
UserRouter.post("/hospitalafterconsult", auth, hospitalafterconsult);
UserRouter.post("/labafterconsult", auth, labafterconsult);
UserRouter.post("/afterconsultupdate", auth, afterconsultupdate); //to update status(asking if they consulted the doctor or like to share a feedback)
UserRouter.get("/getunapproveuser", getunapproveuser);
UserRouter.post("/approveuser", approveuser);
UserRouter.post("/getprofile", auth, getprofile);
UserRouter.post("/auserinteract", auserinteract);
UserRouter.post("/profilecompleted", auth, profilecompleted); //to check if the user has completed their profile or not
UserRouter.get("/profilecount", profilecount);

///testing/////////////
// UserRouter.post("/decrypt", decryptEmails);
// UserRouter.route("/emailencryption").post(emailencryption);
// UserRouter.post("/csvupload", csvupload);

module.exports = UserRouter;
