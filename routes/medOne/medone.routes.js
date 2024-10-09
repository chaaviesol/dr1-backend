const express = require ("express")
const {addUserData,
    userLogin
} = require('./medone.controller')
const medoneRouter = express.Router();
const auth = require("../../middleware/Auth/auth");




medoneRouter.post('/addUserData',auth,addUserData)
medoneRouter.post('/userLogin',userLogin)


















module.exports = medoneRouter