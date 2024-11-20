const { prisma } = require("../../utils");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

const newtestdb = async (request, response) => {
  async function main() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);

      const doctors = await prisma.doctor_details.findMany({
        select: {
          name: true,
          specialization: true,
        },
      });

      const doctorList = doctors
        .map((doctor) => `${doctor.name} (${doctor.specialization})`)
        .join("\n- ");
      const systemInstruction = `
  Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to medical, then you will send a funny reply. These are the doctors available. If users ask which doctor they want to see, suggest one of the following:
  - ${doctorList}
  `;

      // Placeholder for conversation history (if context-aware generation is supported)
      let conversationHistory = [];

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        // Potentially add conversationHistory here if applicable
      });

      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };

      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        // history: conversationHistory, // Update with actual conversation history if applicable
      });
      // console.log("history",conversationHistory)
      const userInput = request.body.message;

      if (userInput.toLowerCase() !== "quit") {
        const result = await chatSession.sendMessage(userInput);
        console.log(result.response);

        const messageContent =
          result.response.candidates[0].content.parts[0]?.text ||
          "I couldn't generate a response.";

        // Update conversation history (if applicable)
        // conversationHistory.push({
        //   userInput,
        //   response: messageContent,
        // });

        response.status(200).json({
          message: messageContent,
        });
      } else {
        await chatSession.endChat();
        response.status(200).json({
          message: "Chat session ended.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      response.status(500).json({
        message: "Internal server error",
      });
    }
  }
  main();
};

const conversationHistories = {};
const updatednewchat = async (request, response) => {
  try {
    const userId = request.user.userId;
    const userInput = request.body.message;

    // Initialize conversation history for the user if not already present
    if (!conversationHistories[userId]) {
      conversationHistories[userId] = [];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const allData = await prisma.categoryManager.findMany();

    let types = [];
    for (const data of allData) {
      if (data.type) {
        types.push(data.type);
      }
    }
    types.sort();

    const getSpecs = (Type) => {
      const filteredSpecs = allData.find(
        (ele) => ele.main_type === "Doctor" && ele.type === Type
      );
      return filteredSpecs?.department || "General Practitioner";
    };

    const allopathySpecs = getSpecs("Allopathy");

    const ayurvedicSpecs = getSpecs("Ayurvedic");
    const homeopathySpecs = getSpecs("Homeopathy");
    const otherSpecs = getSpecs("Others");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, you will send a funny reply. First, you ask for the user's name, gender, and age group. Then, you ask about their symptoms and the type of treatment they prefer: allopathy, Ayurveda, homeopathy, or others. Users will also tell their symptoms so you can suggest the appropriate probable cause. You will then only specify which specialty doctor to consider. If users ask which doctor they should see, suggest the doctor's specialization. The answers should be simple to understand and short. Do not suggest the name of the doctor. For the type of treatments, suggest one of the following:
Allopathy
Ayurveda
Homeopathy
Others
Specialties of Allopathy:${allopathySpecs}
Specialties of Ayurveda:${ayurvedicSpecs}
Specialties of Homeopathy:${homeopathySpecs}
Specialties of Others:${otherSpecs}
     `,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const chatSession = model.startChat({
      generationConfig,
      history: conversationHistories[userId], // Use user's conversation history
    });

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);
      let botResponse = result.response.candidates[0].content.parts[0]?.text;

      botResponse = botResponse.replace(/\n+/g, " ").trim();
      response.status(200).json({
        message: botResponse,
      });

      // Update user's conversation history
      conversationHistories[userId].push({
        role: "user",
        parts: [{ text: userInput }],
      });
      conversationHistories[userId].push({
        role: "model",
        parts: [{ text: botResponse }],
      });
    } else {
      await chatSession.endChat();
      response.status(200).json({ message: "Chat session ended." });

      // Clear the user's conversation history
      delete conversationHistories[userId];
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in chatbot-updatednewchat API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const updatedchat = async (request, response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const doctors = await prisma.doctor_details.findMany({
      select: {
        name: true,
        specialization: true,
      },
    });

    // Construct doctor list
    const doctorList = doctors
      .map((doctor) => `${doctor.name} (${doctor.specialization})`)
      .join("\n- ");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, then you will send a funny reply. First, you want to ask for the user's name, gender, and age group. Users will also tell their symptoms so you can suggest the appropriate doctor and specialty. If the doctors are not listed, then just specify which specialty doctor to consider. If users ask which doctor they should see, suggest one of the following:\n\n${doctorList}`,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const chatSession = model.startChat({
      generationConfig,
      history: conversationHistory, // Pass conversation history to startChat
    });

    const userInput = request.body.message;

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);
      console.log(result.response.text());
      response.status(200).json({
        message: result.response.candidates[0].content.parts[0]?.text,
      });

      // Update conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: userInput }],
      });
      conversationHistory.push({
        role: "model",
        parts: [{ text: result.response.candidates[0].content.parts[0]?.text }],
      });
    } else {
      await chatSession.endChat(); // Gracefully end the chat session if the input is "quit"
      response.status(200).json({ message: "Chat session ended." });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ error: "An error occurred" });
  }
};

module.exports = { newtestdb, updatedchat, updatednewchat };
