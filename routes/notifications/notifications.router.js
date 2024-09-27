const express = require("express");
const {
  adm_read_notification,
  getadm_notification,
  add_notification,
  addtypenotification,
  gettype_notification,
  typeread_notification,
} = require("./notifications.controller");
const auth = require('../../middleware/Auth/auth')
const notificationRouter = express.Router();
//for admin
notificationRouter.route("/getadm", getadm_notification);
notificationRouter.route("/readadm", adm_read_notification);
notificationRouter.route("/addnotification", add_notification);

//for categoriess==> Hospital,Doc ,Lab and User
notificationRouter.route("/addtype", addtypenotification);
notificationRouter.route("/gettype", gettype_notification);
notificationRouter.route("/typeread", typeread_notification);

module.exports = notificationRouter;
