const express = require("express");

const {
  doctor_registration,
  doctor_login,
  get_doctors,
  get_doctorDetails,
  edit_doctor,
  delete_doctor,
  consultation_data,
  edit_consultationDetails,
  filter_specialization,
  doctor_filter,
  doctor_nameFilter,
  suggest_postname_district,
  get_pincode,
  forgot_password,
  reset_password,
  doctor_searchdata,
  doctor_feedback,
  get_feedback,
  get_searchdata,
  getadoctorfeedback,
  doctor_disable,
  getunapprovedrs,
  approvedr,
  completeedit,
  addhospital
} = require("./doctor.controller");
const auth = require("../../middleware/Auth/auth");
const { upload } = require("../../middleware/Uploadimage");
const DoctorRouter = express.Router();

DoctorRouter.post(
  "/dr_registration",
  upload.single("image"),
  doctor_registration
);
DoctorRouter.post("/dr_login", doctor_login);
DoctorRouter.get("/complete_data", get_doctors);
DoctorRouter.post("/edit", upload.single("image"), edit_doctor);
DoctorRouter.post("/delete", delete_doctor);
DoctorRouter.post("/consultation_data", consultation_data);
DoctorRouter.post("/edit_consultation", edit_consultationDetails);
// DoctorRouter.post('/filter',filter_data)
DoctorRouter.post("/filter_spec", filter_specialization);
DoctorRouter.post("/filter_dr", doctor_filter);
DoctorRouter.post("/byname", doctor_nameFilter);
DoctorRouter.post("/suggest", suggest_postname_district);
DoctorRouter.post("/get_pincode", get_pincode);
// DoctorRouter.post('/example',example_function)
DoctorRouter.post("/forgotpassword", forgot_password);
DoctorRouter.post("/resetpassword", reset_password);
DoctorRouter.post("/doctordetails", get_doctorDetails);
DoctorRouter.post("/doctor_searchdata", doctor_searchdata);
DoctorRouter.post("/doctor_feedback", doctor_feedback);
DoctorRouter.get("/get_feedback", get_feedback); //all feedbacks
DoctorRouter.get("/get_searchdata", get_searchdata); //all searchdata
DoctorRouter.post("/getadoctorfeedback", getadoctorfeedback); //feedback of a single doctor

DoctorRouter.post("/doctor_disable", doctor_disable);
DoctorRouter.get("/getunapprovedrs", getunapprovedrs);
DoctorRouter.post("/approvedr", approvedr);
DoctorRouter.post("/completeedit", completeedit);

DoctorRouter.post("/addhospital",addhospital)

module.exports = DoctorRouter;
