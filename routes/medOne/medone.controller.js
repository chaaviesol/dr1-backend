const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { encrypt, decrypt } = require("../../utils");
const winston = require("winston");
const { request, response } = require("express");
const logDirectory = "./logs";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const res = require("express/lib/response");
// const { use } = require("bcrypt/promises");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: `${logDirectory}/error.log`,
        level: "error",
      }),
      new winston.transports.File({ filename: `${logDirectory}/combined.log` }),
    ],
  });



// Helper function to convert "12:00 PM" format into a Date object
function convertTimeTo24Hour(timeStr) {
  const [time, modifier] = timeStr.split(' '); // Split time and AM/PM
  let [hours, minutes] = time.split(':');

  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  }
  if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }

  // Create a new Date object and set hours/minutes
  const currentDate = new Date();
  currentDate.setHours(parseInt(hours, 10));
  currentDate.setMinutes(parseInt(minutes, 10));
  currentDate.setSeconds(0); // Set seconds to 0

  return currentDate;
}

  function scheduleNotification(time, message) {
    const delay = time - new Date(); // Calculate delay in milliseconds
    if (delay > 0) {
      setTimeout(() => {
        console.log(`Notification: ${message}`);
        // Here you can send the notification (push notification, SMS, etc.)
      }, delay);
    }
  }

const addUserData = async(request,response)=>{
    const secretKey = process.env.ENCRYPTION_KEY;
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    try{
        const{
            userid,
            name,
            gender,
            dob,
            health_condition,
            height,
            weight
        } = request.body
    
    const findUser = await prisma.user_details.findMany({
        where:{
           id:userid
        }
    })
    console.log({findUser})
    if(!findUser){
        return response.status(400).json({
            error:true,
            success:false,
            message:"User not found"
        })
    }else{
        const encryptname   = encrypt(name, secretKey)
        const encryptgender = encrypt(gender, secretKey)
        const encryptdob    = encrypt(dob, secretKey)
       
        
        const addingUserDetails = await prisma.user_details.update({
            where:{
                id:userid
            },
            data:{
                name:encryptname,
                gender:encryptgender,
                ageGroup:encryptdob,
                health_condition:health_condition,
                height:height,
                weight:weight

            }
        })
        console.log({addingUserDetails})

        const decryptName = safeDecrypt(addingUserDetails.name, secretKey)
        const decryptgender = safeDecrypt(addingUserDetails?.gender, secretKey)
        const decryptageGroup = safeDecrypt(addingUserDetails?.ageGroup, secretKey)
        
        addingUserDetails.name =decryptName;
        addingUserDetails.gender = decryptgender;
        addingUserDetails.ageGroup = decryptageGroup

        return response.status(200).json({
          error:"false",
          success:"true",
          message:"SuccessFully added user details",
          // addingUserDetails,
          data:addingUserDetails
        })

    }
  }catch (error) {
        console.log({error})
        response.status(500).json({
            error:true,
            success:false,
        });
        logger.error(`Internal server error: ${error.message} in medone-addUserData api`);
      } finally {
        await prisma.$disconnect();
      }
}




const userLogin = async (request, response) => {
  console.log("userloginnnn");
  const { email, password } = request.body;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  const secretKey = process.env.ENCRYPTION_KEY;
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    const emaillower = email.toLowerCase();
    const email_id = emaillower;
    if (validateEmail(email_id)) {
      console.log("Valid email address");
    } else {
      console.log("Invalid email address");
      const resptext = "Invalid email address";
      return response.status(401).json({
        error: true,
        success: false,
        message: resptext,
      });
    }
    function validateEmail(email_id) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email_id);
    }

    // Fetch all users (or use findUnique)
    const users = await prisma.user_details.findMany();
    let user = null;

    for (const dbUser of users) {
      let decryptedEmail;
      try {
        decryptedEmail = safeDecrypt(dbUser.email, secretKey);
      } catch (error) {
        console.warn(
          `Skipping user ID ${dbUser.id} due to decryption error`,
          error
        );
        continue;
      }

      if (decryptedEmail === emaillower) {
        user = dbUser;
        break;
      }
    }

    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "User does not exist",
      });
    }

    const logged_id = user.id;
    const hashedDbPassword = user.password;

    // Compare the provided password with the hashed password from the database
    bcrypt.compare(password, hashedDbPassword, async (error, result) => {
      if (error) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your password!",
        });
      }
      // console.log({logged_id})
      // Fetch user data after password verification
      const userDataArray = await prisma.user_details.findMany({
        where: { id: logged_id }
      });

      if (!userDataArray || userDataArray.length === 0) {
        return response.status(404).json({
          error: true,
          success: false,
          message: "User data not found",
        });
      }

      const userData = userDataArray[0]; // Access the first user data

      // Decrypt the user data fields
      const decryptName = safeDecrypt(userData.name, secretKey);
      const decryptGender = safeDecrypt(userData.gender, secretKey);
      const decryptAgeGroup = safeDecrypt(userData.ageGroup, secretKey);

      // Update userData object with decrypted values
      userData.name = decryptName;
      userData.gender = decryptGender;
      userData.ageGroup = decryptAgeGroup;

      // Generate tokens
      const refreshTokenPayload = {
        userId: logged_id,
      };

      const accessTokenPayload = {
        userId: logged_id,
      };

      const refreshTokenOptions = {
        expiresIn: "900m",
      };

      const accessTokenOptions = {
        expiresIn: "100m",
      };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        process.env.REFRESH_TOKEN_SECRET,
        refreshTokenOptions
      );

      const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET,
        accessTokenOptions
      );

      // Update last active time
      await prisma.user_details.update({
        where: { id: logged_id },
        data: { last_active: istDate },
      });
      console.log({logged_id})
      //check whether there is data in dailyRoutine table
      const findRoutine = await prisma.dailyRoutine.findMany({
        where:{
          userId:logged_id
        }
      })
      console.log({findRoutine})
      if(findRoutine.length === 0){
        return response.status(200).json({
          success: true,
          error: false,
          message: "Login successful",
          refreshToken,
          accessToken,
          userId: logged_id,
          userData, // Decrypted user data
          routine:"false"
        })
      }
      // Return response with decrypted user data and tokens
      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        refreshToken,
        accessToken,
        userId: logged_id,
        userData, // Decrypted user data
        routine:"true"
      });
    });
  } catch (error) {
    console.log({ error });
    logger.error(`Internal server error: ${error.message} in userLogin API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};



const addRoutine = async(request,response)=>{
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try{
    const {
      userId,
      routine 
    } = request.body

    const addRoutine = await prisma.dailyRoutine.create({
     data:{
        userId:userId,
        routine:routine,
        created_date:istDate
     }
    })  
    console.log({addRoutine})

    response.status(200).json({
      error:"false",
      success:"true",
      message:"Successfully added the routine",
      data:addRoutine
    })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addRoutine api`);
  } finally {
    await prisma.$disconnect();
  }

}


const getUserRoutine = async(request,response)=>{
  try{
    const{userId} = request.body

    const getRoutine = await prisma.dailyRoutine.findMany({
      where:{
        userId:userId
      }
    })
  console.log({getRoutine})
  response.status(200).json({
    error:false,
    success:true,
    message:"Successfull",
    data:getRoutine
  })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-getUserRoutine api`);
  } finally {
    await prisma.$disconnect();
  }
}


const getMedicine = async(request,response)=>{
  try{
    const getmedicine = await prisma.generic_product.findMany({
      where:{
        is_active:"Y",
        category:{
          array_contains:["MEDICINES"]
        }
      },
      select:{
        id:true,
        name:true,
        images:true,
        category:true
      }
    })
    console.log({getmedicine})
    response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:getmedicine
    })
}catch (error) {
  console.log({error})
  response.status(500).json(error.message);
  logger.error(`Internal server error: ${error.message} in medone-getmedicine api`);
} finally {
  await prisma.$disconnect();
}
}


const addNewMedicine = async(request,response)=>{
  try{
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
      const {
        name,
        category,
        userId
      } = request.body
      
      const addMedicine = await prisma.medicines.create({
        data:{
          name:name,
          status:"Pending",
          created_date:istDate,
          created_by:userId,
          category:category
        }
      })
      console.log({addMedicine})
      response.status(200).json({
        error:false,
        success:true,
        message:"Successfully added the medicine",
        data:addMedicine
      })

  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addnewmedicine api`);
  } finally {
    await prisma.$disconnect();
  }
}

const addMedicineSchedule = async(request,response)=>{
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try{
    const{
        userId,
        medicine,
        medicine_type,
        image,
        startDate,
        no_of_days,
        afterFd_beforeFd,
        totalQuantity,
        timing,
        timeInterval,
        daysInterval,
        takingQuantity
    }=request.body

    const addSchedule = await prisma.medicine_timetable.create({
      data:{
        userId:userId,
        medicine:medicine,
        medicine_type:medicine_type,
        image:image,
        startDate:startDate,
        no_of_days:no_of_days,
        afterFd_beforeFd:afterFd_beforeFd,
        totalQuantity:totalQuantity,
        timing:timing,
        timeInterval:timeInterval,
        takingQuantity:takingQuantity,
        daysInterval:daysInterval,
        created_date:istDate //change to dateTime
      }
    })
   console.log({addSchedule})
   response.status(200).json({
    error:false,
    success:true,
    message:"Successfully added the schedule",
    data:addSchedule
   })
  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-addMedicineSchedule api`);
  } finally {
    await prisma.$disconnect();
  }
}

//api in home page 
const homePageCard = async(request,response)=>{
  try{
    const{userId} = request.body

    const getMedicineSchedule = await prisma.medicine_timetable.findMany({
      where:{
        userId:userId 
      }
    })
    console.log({getMedicineSchedule})

    for(let i=0; i<getMedicineSchedule.length; i++){
      const tableData = getMedicineSchedule[i]
      console.log({tableData})
      const medicineName = tableData.medicine
      console.log({medicineName})
      const medicineType = tableData.medicine_type
      console.log({medicineType})
      const totalDays = tableData.no_of_days
      console.log({totalDays})
      const timing = tableData.timing
      console.log({timing})
      
      const findRoutine = await prisma.dailyRoutine.findMany({
        where:{
          userId:tableData.userId
        }
      })
     
      const routine = findRoutine[0].routine
      console.log({routine})
    

    }
    

    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:getMedicineSchedule
    })

  }catch (error) {
    console.log({error})
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-homePageCard api`);
  } finally {
    await prisma.$disconnect();
  }
}

// const notifyMedicineSchedule = async(request,response)=>{
//   try{
//     const {userid} = request.body
//     const findRoutine = await prisma.dailyRoutine.findMany({
//       where:{
//         userId:userid
//       }
//     })
//     console.log({findRoutine})
//     return response.status(200).json({
//       error:false,
//       success:true,
//       message:"Successfull",
//       data:findRoutine
//     })

//   }catch (error) {
//     console.log({error})
//     response.status(500).json(error.message);
//     logger.error(`Internal server error: ${error.message} in medone-notifymedicineschedule api`);
//   } finally {
//     await prisma.$disconnect();
//   }
// }



const notifyMedicineSchedule = async (request, response) => {
  try {
    const { userid } = request.body;

    // Fetch user's daily routine
    const findRoutine = await prisma.dailyRoutine.findFirst({
      where: { userId: userid }
    });

    if (!findRoutine) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User routine not found"
      });
    }

    // Fetch user's medicine schedule
    const medicineSchedule = await prisma.medicine_timetable.findMany({
      where: { userId: userid }
    });

    if (!medicineSchedule || medicineSchedule.length === 0) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "No medicine schedule found for this user"
      });
    }

    // Define notification times array
    let notifications = [];

    // Iterate through each medicine entry to determine notification time
    medicineSchedule.forEach((medicine) => {
      const { timing, beforeFood, name } = medicine;
      let notificationTime;

      if (!timing || !name) {
        console.log(`Missing timing or medicine name for medicine ID: ${medicine.id}`);
        return;
      }

      // Morning medicine
      if (timing === "Morning") {
        const breakfastTime = new Date(`1970-01-01T${convertTime(findRoutine.breakfast)}:00`);
        if (beforeFood) {
          notificationTime = new Date(breakfastTime.getTime() - 45 * 60000); // 45 minutes before breakfast
        } else {
          notificationTime = new Date(breakfastTime.getTime() + 45 * 60000); // 45 minutes after breakfast
        }
      }

      // Night medicine
      if (timing === "Night") {
        const sleepTime = new Date(`1970-01-01T${convertTime(findRoutine.sleep)}:00`);
        if (beforeFood) {
          notificationTime = new Date(sleepTime.getTime() - 45 * 60000); // 45 minutes before sleep
        } else {
          notificationTime = new Date(sleepTime.getTime() + 45 * 60000); // 45 minutes after sleep
        }
      }

      if (notificationTime) {
        notifications.push({
          medicine: name,
          notificationTime: notificationTime.toLocaleTimeString(),
        });
      } else {
        console.log(`Failed to calculate notification time for medicine: ${name}`);
      }
    });

    // Send notifications and response
    return response.status(200).json({
      error: false,
      success: true,
      message: "Notifications scheduled",
      notifications: notifications,
    });

  } catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-notifymedicineschedule api`);
  } finally {
    await prisma.$disconnect();
  }
};

// Helper function to convert time in 'HH:MM AM/PM' to 'HH:MM' (24-hour format)
const convertTime = (timeStr) => {
  if (!timeStr) return null; // Handle missing or undefined times
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
};


const userProfile = async(request,response)=>{
  try{
    const secretKey = process.env.ENCRYPTION_KEY;
    
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

    const {userId} = request.body
    if(!userId){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id is null..."
      })
    }
    const userData = await prisma.user_details.findUnique({
      where:{
         id:userId
      }
    })
    if(!userData){
      return response.status(404)({
        error:true, 
        success:false,
        message:"User not found"
      })
    }

    const decryptedname = safeDecrypt(userData.name, secretKey);
    const decryptedageGroup = safeDecrypt(userData?.ageGroup, secretKey);
    const decryptgender = safeDecrypt(userData?.gender, secretKey);

    userData.name = decryptedname;
    userData.ageGroup = decryptedageGroup;
    userData.gender = decryptgender;

    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfull",
      data:userData
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-userprofile api`);
  } finally {
    await prisma.$disconnect();
  }
}

const editRoutine = async(request,response)=>{
  try{
    const {
         userId,
         routine
    } = request.body
   
    if(!userId && !routine){
      return response.status(404).json({
        error:true,
        success:false,
        message:"User id and routine data are needed"
      })
    }
    const editdata = await prisma.dailyRoutine.updateMany({
      where:{
        userId:userId
      },
      data:{
        routine:routine
      }
    })
    console.log({editdata})
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfully edited",
      data:editdata
    })
  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-editroutine api`);
  } finally {
    await prisma.$disconnect();
  }
}

const editMedicineSchedule = async(request,response)=>{
  try{
    const{
      scheduleId,
      medicine,
      medicine_type,
      startDate,
      no_of_days,
      afterFd_beforeFd,
      totalQuantity,
      timing,
      timeInterval,
      takingQuantity,
      daysInterval
    } = request.body
    const editSchedule = await prisma.medicine_timetable.updateMany({
      where:{
        id:scheduleId
      },
      data:{
          medicine:medicine,
          medicine_type:medicine_type,
          startDate:startDate,
          no_of_days:no_of_days,
          afterFd_beforeFd:afterFd_beforeFd,
          totalQuantity:totalQuantity,
          timing:timing,
          timeInterval:timeInterval,
          takingQuantity:takingQuantity,
          daysInterval:daysInterval
      }
    })
    console.log({editSchedule})
    const getEditedData= await prisma.medicine_timetable.findMany({
      where:{
        id:scheduleId
      }
    })
    console.log(getEditedData)
    return response.status(200).json({
      error:false,
      success:true,
      message:"Successfully edited the schedule",
      data:getEditedData
    })

  }catch (error) {
    console.log({ error });
    response.status(500).json(error.message);
    logger.error(`Internal server error: ${error.message} in medone-editschedule api`);
  } finally {
    await prisma.$disconnect();
  }
}














module.exports = {addUserData,
  userLogin,
  addRoutine,
  getUserRoutine,
  getMedicine,
  addNewMedicine,
  addMedicineSchedule,
  homePageCard,
  notifyMedicineSchedule,
  userProfile,
  editRoutine,
  editMedicineSchedule
}