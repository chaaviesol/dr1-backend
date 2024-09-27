const express = require('express')
const { newtest,chatbot,updatednewchat, newtestdb ,updatedchat} = require('./chatbot.controller')
const ChatbotRouter = express.Router()
const auth = require("../../middleware/Auth/auth");

ChatbotRouter.post('/chatbot',auth, updatednewchat)////////working
ChatbotRouter.post('/withdb', newtestdb)
ChatbotRouter.post('/updatedchat',updatedchat)

module.exports = ChatbotRouter