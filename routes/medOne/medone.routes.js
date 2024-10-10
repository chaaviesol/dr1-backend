const express = require ("express")
const {addUserData,
    userLogin,
    addRoutine,
    getUserRoutine
} = require('./medone.controller')
const medoneRouter = express.Router();
const auth = require("../../middleware/Auth/auth");




medoneRouter.post('/addUserData',addUserData)
medoneRouter.post('/userLogin',userLogin)
medoneRouter.post('/addRoutine',addRoutine)
medoneRouter.post('/getUserRoutine',getUserRoutine)


















module.exports = medoneRouter