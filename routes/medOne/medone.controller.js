const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { encrypt, decrypt } = require("../../utils");
const winston = require("winston");
const { request, response } = require("express");
const logDirectory = "./logs";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
        is_active:"Y"
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
        // created_date:istDate //change to dateTime
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




module.exports = {addUserData,
  userLogin,
  addRoutine,
  getUserRoutine,
  getMedicine,
  addNewMedicine,
  addMedicineSchedule
}