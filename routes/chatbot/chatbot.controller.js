const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();
const currentDate = new Date();
const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);

const newtestdb = async (request, response) => {
  console.log("withhddbbbb");
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
      console.log({ doctors });

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

const newtest = async (request, response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const doctors = await prisma.doctor_details.findMany({
      select: {
        name: true,
        specialization: true,
        pincode: true,
      },
    });

    // Construct doctor list
    const doctorList = doctors
      .map(
        (doctor) =>
          `${doctor.name} (${doctor.specialization})(${doctor.pincode})`
      )
      .join("\n- ");
    console.log({ doctorList });
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

// const conversationHistory = []; // Initialize conversation history array
// const chatbot = async (request, response) => {
//   try {
//     const apiKey = process.env.GEMINI_API_KEY;
//     const genAI = new GoogleGenerativeAI(apiKey);
//     const userPincode = parseInt(request.body.pincode, 10); // Ensure the pincode is treated as an integer
//     const userInput = request.body.message;

//     // Fetch all doctor details with their pincodes
//     const doctors = await prisma.doctor_details.findMany({
//       select: {
//         name: true,
//         specialization: true,
//         pincode: true,
//         phone_office: true,
//       },
//     });

//     console.log({ doctors });

//     // Use AI model to detect specialization from user input
//     const specializationModel = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: "Detect the medical specialization required based on the user's input.",
//     });

//     const detectionConfig = {
//       temperature: 0.7,
//       topP: 0.9,
//       topK: 40,
//       maxOutputTokens: 50,
//       responseMimeType: "text/plain",
//     };

//     const detectionSession = await specializationModel.startChat({
//       generationConfig: detectionConfig,
//       history: [{ role: "user", parts: [{ text: userInput }] }],
//     });

//     const detectionResult = await detectionSession.sendMessage(userInput);
//     let detectedSpecialization = detectionResult.response.candidates[0]?.content?.parts[0]?.text?.trim();

//     console.log({ detectedSpecialization });

//     // Check if detectedSpecialization is defined and non-empty
//     if (detectedSpecialization && typeof detectedSpecialization === 'string') {
//       // Extract specialization from the detected text
//       detectedSpecialization = detectedSpecialization.match(/(?:The medical specialization required is \*\*)(.*?)(?:\*\*|\.)/i)?.[1]?.trim();
//     } else {
//       console.log("No valid specialization detected. Using default.");
//       detectedSpecialization = "general medicine"; // Default specialization
//     }

//     // Find doctors in the user's pincode with the detected specialization
//     let nearbyDoctors = doctors.filter(
//       doctor => doctor.pincode === userPincode && doctor.specialization && doctor.specialization.toLowerCase() === detectedSpecialization?.toLowerCase()
//     );

//     console.log({ nearbyDoctors });

//     // If no doctors are found in the user's pincode with the detected specialization, find nearby doctors
//     if (nearbyDoctors.length === 0) {
//       const nearestPincodes = getNearestPincodes(userPincode, 10);
//       nearbyDoctors = findDoctorsInPincodes(nearestPincodes, detectedSpecialization, doctors);
//     }

//     console.log({ nearbyDoctors });

//     // Construct doctor list
//     const doctorList = nearbyDoctors.length > 0
//       ? nearbyDoctors.map((doctor) => `${doctor.name} (${doctor.specialization})`).join("\n- ")
//       : `No doctors found for ${detectedSpecialization} in your area. Please consider expanding your search.`;

//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: `Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, you will send a funny reply. If the question is about nearby doctors, you want to suggest doctors from the provided list only. Only if the user asks about symptoms do you ask for the user's name, gender, and age group. If they ask for the doctor, you just provide the doctor's information. Users will tell their symptoms so you can suggest the appropriate doctor and specialty. If the doctors are not listed, then just specify which specialty doctor to consider. If users ask which doctor they should see, suggest one of the following:\n\n${doctorList}`
//     });

//     const generationConfig = {
//       temperature: 1,
//       topP: 0.95,
//       topK: 64,
//       maxOutputTokens: 8192,
//       responseMimeType: "text/plain",
//     };

//     // Initialize conversation history if not already initialized
//     const chatSession = await model.startChat({
//       generationConfig,
//       history: request.body.conversationHistory || [], // Use conversation history from request or initialize an empty array
//     });

//     if (userInput.toLowerCase() !== "quit") {
//       const result = await chatSession.sendMessage(userInput, {
//         pincode: userPincode, // Pass the pincode to ensure the model is aware
//       });
//       const responseMessage = result.response.candidates[0]?.content?.parts[0]?.text;

//       // Update conversation history
//       const conversationHistory = request.body.conversationHistory || [];
//       conversationHistory.push({
//         role: "user",
//         parts: [{ text: userInput }],
//       });
//       conversationHistory.push({
//         role: "model",
//         parts: [{ text: responseMessage }],
//       });

//       response.status(200).json({
//         message: responseMessage,
//         conversationHistory, // Return updated conversation history
//       });
//     } else {
//       await chatSession.endChat(); // Gracefully end the chat session if the input is "quit"
//       response.status(200).json({ message: "Chat session ended." });
//     }
//   } catch (error) {
//     console.log(error);
//     response.status(500).json({ error: "An error occurred" });
//   }
// };

// // Helper function to find the nearest pincodes
// const getNearestPincodes = (basePincode, count) => {
//   const base = parseInt(basePincode, 10);
//   const pincodes = [];
//   for (let i = 1; i <= count / 2; i++) {
//     pincodes.push(base - i);
//     pincodes.push(base + i);
//   }
//   console.log({pincodes})
//   return pincodes;
// };

// // Helper function to find doctors within a list of pincodes
// const findDoctorsInPincodes = (pincodes, specialization, doctors) => {
//   return doctors.filter(
//     doctor => pincodes.includes(parseInt(doctor.pincode, 10)) && doctor.specialization && doctor.specialization?.toLowerCase() === specialization?.toLowerCase()
//   );
// };

// let conversationHistory = []; // Define this outside to maintain state across requests

const chatbotnew = async (request, response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const userPincode = parseInt(request.body.pincode, 10); // Ensure the pincode is treated as an integer
    const userInput = request.body.message;

    // Fetch all doctor details with their pincodes
    const doctors = await prisma.doctor_details.findMany({
      select: {
        name: true,
        specialization: true,
        pincode: true,
      },
    });

    // Find doctors in the user's pincode
    let nearbyDoctors = doctors.filter(
      (doctor) => doctor.pincode === userPincode
    );

    console.log({ nearbyDoctors });

    // If no doctors are found in the user's pincode, find nearby doctors
    if (nearbyDoctors.length === 0) {
      let nearestPincodes = getNearestPincodes(userPincode, 10);
      nearbyDoctors = findDoctorsInPincodes(nearestPincodes, doctors);

      if (nearbyDoctors.length === 0) {
        nearestPincodes = getNearestPincodes(userPincode, 20); // Expand search to next 10 nearest pincodes
        nearbyDoctors = findDoctorsInPincodes(nearestPincodes, doctors);
      }
    }

    console.log({ nearbyDoctors });

    // Construct doctor list
    const doctorList =
      nearbyDoctors.length > 0
        ? nearbyDoctors
            .map((doctor) => `${doctor.name} (${doctor.specialization})`)
            .join("\n- ")
        : `No doctors found in your area. Please consider expanding your search.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, you will send a funny reply. If the question is about nearby doctors, you want to suggest doctors without taking personal information or addresses, and if there are no doctors, then give the message "No doctor available" without showing any random doctors. Only if the user asks about symptoms do you ask for the user's name, gender, and age group. If they ask for a doctor, you just provide the doctor's information. Users will tell their symptoms so you can suggest the appropriate doctor and specialty. If the doctors are not listed, then just specify which specialty doctor to consider. If users ask which doctor they should see, suggest one of the following:\n\n${doctorList}`,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const chatSession = await model.startChat({
      generationConfig,
      history: conversationHistory, // Use the persistent conversation history
    });

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);
      const responseMessage =
        result.response.candidates[0]?.content?.parts[0]?.text;

      // Update conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: userInput }],
      });
      conversationHistory.push({
        role: "model",
        parts: [{ text: responseMessage }],
      });

      response.status(200).json({
        message: responseMessage,
        conversationHistory, // Return updated conversation history
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

// Helper function to find the nearest pincodes
const getNearestPincodes = (basePincode, count) => {
  const base = parseInt(basePincode, 10);
  const pincodes = [];
  for (let i = 1; i <= count / 2; i++) {
    pincodes.push(base - i);
    pincodes.push(base + i);
  }
  return pincodes;
};

// Helper function to find doctors within a list of pincodes
const findDoctorsInPincodes = (pincodes, doctors) => {
  return doctors.filter((doctor) =>
    pincodes.includes(parseInt(doctor.pincode, 10))
  );
};

// const chatbot = async (request, response) => {
//   try {
//     const apiKey = process.env.GEMINI_API_KEY;
//     const genAI = new GoogleGenerativeAI(apiKey);
//     const allData = await prisma.categoryManager.findMany();
//     console.log({ allData });

//     // Function to get specializations based on type
//     const getSpecs = (type) => {
//       return allData
//         .filter((ele) => ele.main_type === "Doctor" && ele.type === type)
//         .map((ele) => ele.department);
//     };

//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: `
//         Your name is 'Dr. One.' You only respond to questions related to the medical field.
//         If the question is not related to the medical field, you will send a funny reply.
//         Ask the user about their symptoms and the type of treatment they prefer: allopathy, Ayurveda, homeopathy, or something else.
//         After the user describes their symptoms and chooses a type of treatment, suggest a suitable specialization based on their choice and the available specializations in the database.
//       `,
//     });

//     const generationConfig = {
//       temperature: 1,
//       topP: 0.95,
//       topK: 64,
//       maxOutputTokens: 8192,
//       responseMimeType: "text/plain",
//     };

//     const chatSession = model.startChat({
//       generationConfig,
//       history: conversationHistory, // Pass conversation history to startChat
//     });

//     const userInput = request.body.message;

//     if (userInput.toLowerCase() !== "quit") {
//       const result = await chatSession.sendMessage(userInput);
//       const botResponse = result.response.candidates[0].content.parts[0]?.text;
//       console.log(botResponse);

//       // Logic to determine the specialization
//       let preferredType = "";

//       // Extract type of treatment from user input
//       if (userInput.toLowerCase().includes("allopathy")) {
//         preferredType = "Allopathy";
//       } else if (userInput.toLowerCase().includes("ayurveda")) {
//         preferredType = "Ayurvedic";
//       } else if (userInput.toLowerCase().includes("homeopathy")) {
//         preferredType = "Homeopathy";
//       } else {
//         preferredType = "Others";
//       }

//       // Get specializations based on preferred type
//       let specializations = [];
//       switch (preferredType.toLowerCase()) {
//         case "allopathy":
//           specializations = getSpecs("Allopathy");
//           break;
//         case "ayurvedic":
//           specializations = getSpecs("Ayurvedic");
//           break;
//         case "homeopathy":
//           specializations = getSpecs("Homeopathy");
//           break;
//         default:
//           specializations = [];
//           break;
//       }

//       // Select a random specialization from the filtered list
//       const recommendedSpecialization = specializations.length
//         ? specializations[Math.floor(Math.random() * specializations.length)]
//         : null;

//       let finalMessage = botResponse;

//       // Append specialization recommendation if available
//       if (!recommendedSpecialization) {
//         finalMessage += ` I'd suggest you visit a **${recommendedSpecialization}** right away. They are specialists in this field and can provide you with the best care.`;
//       }

//       console.log({ recommendedSpecialization });

//       response.status(200).json({
//         message: finalMessage,
//       });

//       // Update conversation history
//       conversationHistory.push({
//         role: "user",
//         parts: [{ text: userInput }],
//       });
//       conversationHistory.push({
//         role: "model",
//         parts: [{ text: finalMessage }],
//       });
//     } else {
//       await chatSession.endChat(); // Gracefully end the chat session if the input is "quit"
//       response.status(200).json({ message: "Chat session ended." });
//     }
//   } catch (error) {
//     console.log(error);
//     response.status(500).json({ error: "An error occurred" });
//   }
// };

const chatbot = async (request, response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const allData = await prisma.categoryManager.findMany();
    console.log({ allData });
    types = []; // All Types
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
      return filteredSpecs?.department;
    };

    const allopathySpecs = getSpecs("Allopathy");
    const ayurvedicSpecs = getSpecs("Ayurvedic");
    const homeopathySpecs = getSpecs("Homeopathy");
    const OtherSpecs = getSpecs("Others");

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


Specialties of Others:${OtherSpecs}

      `,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };
    const conversationHistory = []; // Initialize conversation history

    const chatSession = model.startChat({
      generationConfig,
      history: conversationHistory, // Pass conversation history to startChat
    });

    const userInput = request.body.message;

    if (userInput.toLowerCase() !== "quit") {
      const result = await chatSession.sendMessage(userInput);
      const botResponse = result.response.candidates[0].content.parts[0]?.text;
      console.log(botResponse);

      response.status(200).json({
        message: botResponse,
      });

      // Update conversation history
      conversationHistory.push({
        role: "user",
        parts: [{ text: userInput }],
      });
      conversationHistory.push({
        role: "model",
        parts: [{ text: botResponse }],
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

// const conversationHistory = []; // Initialize conversation history array

// const updatednewchat = async (request, response) => {
//   try {
//     const user_id=request.body.user_id
//     const apiKey = process.env.GEMINI_API_KEY;
//     const genAI = new GoogleGenerativeAI(apiKey);
//     const allData = await prisma.categoryManager.findMany();
//     console.log({ allData });
//     types = []; // All Types
//     for (const data of allData) {
//       if (data.type) {
//         types.push(data.type);
//       }
//     }
//     types.sort();

//     const getSpecs = (Type) => {
//       const filteredSpecs = allData.find(
//         (ele) => ele.main_type === "Doctor" && ele.type === Type
//       );
//       return filteredSpecs?.department || "General Practitioner";
//     };

//     const allopathySpecs = getSpecs("Allopathy");
//     const ayurvedicSpecs = getSpecs("Ayurvedic");
//     const homeopathySpecs = getSpecs("Homeopathy");
//     const OtherSpecs = getSpecs("Others");

//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: `
// Your name is 'Dr. One.' You only respond to questions related to the medical field. If the question is not related to the medical field, you will send a funny reply. First, you ask for the user's name, gender, and age group. Then, you ask about their symptoms and the type of treatment they prefer: allopathy, Ayurveda, homeopathy, or others. Users will also tell their symptoms so you can suggest the appropriate probable cause. You will then only specify which specialty doctor to consider. If users ask which doctor they should see, suggest the doctor's specialization. The answers should be simple to understand and short. Do not suggest the name of the doctor. For the type of treatments, suggest one of the following:
// Allopathy
// Ayurveda
// Homeopathy
// Others
// Specialties of Allopathy:${allopathySpecs}
// Specialties of Ayurveda:${ayurvedicSpecs}
// Specialties of Homeopathy:${homeopathySpecs}
// Specialties of Others:${OtherSpecs}
//      `,
//     });

//     const generationConfig = {
//       temperature: 1,
//       topP: 0.95,
//       topK: 64,
//       maxOutputTokens: 8192,
//       responseMimeType: "text/plain",
//     };

//     const chatSession = model.startChat({
//       generationConfig,
//       history: conversationHistory,
//     });

//     const userInput = request.body.message;

//     if (userInput.toLowerCase() !== "quit") {
//       const result = await chatSession.sendMessage(userInput);
//       console.log(result.response.text());
//       response.status(200).json({
//         message: result.response.candidates[0].content.parts[0]?.text,
//       });

//       // Update conversation history
//       conversationHistory.push({
//         role: "user",
//         parts: [{ text: userInput }],
//       });
//       conversationHistory.push({
//         role: "model",
//         parts: [{ text: result.response.candidates[0].content.parts[0]?.text }],
//       });
//     } else {
//       await chatSession.endChat();
//       response.status(200).json({ message: "Chat session ended." });
//     }
//   } catch (error) {
//     logger.error(`Internal server error: ${error.message} in updatedchat API`);
//     response.status(500).json("An error occurred");
//   } finally {
//     await prisma.$disconnect();
//   }
// };
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
    console.error(
      `Internal server error: ${error.message} in updatednewchat API`
    );
    response.status(500).json("An error occurred");
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

module.exports = { newtest, newtestdb, updatedchat, chatbot, updatednewchat };
