const express = require('express')
const {careerupload,getcareerrequest,homeserviceupload,homeservicerequests} = require('./career.controller')
const CareerRouter = express.Router()
const auth = require("../../middleware/Auth/auth");

CareerRouter.post('/careerupload', careerupload)
CareerRouter.get('/getcareers', getcareerrequest)
CareerRouter.post('/homeserviceupload', homeserviceupload)
CareerRouter.get('/homeservicerequests', homeservicerequests)

module.exports = CareerRouter