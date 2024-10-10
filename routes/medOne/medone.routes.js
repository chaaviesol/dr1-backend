const express = require ("express")
const {addUserData,
    userLogin,
    addRoutine,
    getUserRoutine,
    getMedicine,
    addNewMedicine,
    addMedicineSchedule
} = require('./medone.controller')
const medoneRouter = express.Router();
const auth = require("../../middleware/Auth/auth");




medoneRouter.post('/addUserData',addUserData)
medoneRouter.post('/userLogin',userLogin)
medoneRouter.post('/addRoutine',addRoutine)
medoneRouter.post('/getUserRoutine',getUserRoutine)
medoneRouter.get('/getmedicine',getMedicine)
medoneRouter.post('/addnewmedicine',addNewMedicine)
medoneRouter.post('/addMedicineSchedule',addMedicineSchedule)

















module.exports = medoneRouter