const { PrismaClient } = require("@prisma/client");
const { encrypt, decrypt } = require("../../utils");
require("dotenv").config();
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const currentDate = new Date();
const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const winston = require("winston");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const multer = require("multer");
const logDirectory = "./logs";

const secretKey = process.env.ENCRYPTION_KEY;
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

//Configure the Winston logger
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
///////////csv-file/////////////////////
// const csvupload = async (req, res) => {
//   try {
//     const fileRows = [];
//     const fileRows2 = [];

//     // Open uploaded file
//     fs.createReadStream("../../Desktop/DOC1/hospitalfullcsv.csv")
//       .pipe(csv())
//       .on("data", (row, index) => {
//         if (!row.firstname) {
//           return;
//         }

//         fileRows.push(row);
//       })
//       .on("end", async () => {
//         // Remove temporary file
//         // fs.unlinkSync("./malappuramData.csv")
//         for (i = 0; i <= fileRows.length; i++) {
//           if (i <= 5) {
//             fileRows2.push(fileRows[i]);
//           }
//         }
//         console.log(fileRows);

//         try {
//           await insertData(fileRows2);
//           res.send("File successfully processed and data inserted.");
//         } catch (error) {
//           res.status(500).send("Error inserting data: " + error.message);
//         }
//       });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       error: true,
//       message: "Internal Server Error",
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// };
/////////hospital case//////
// async function insertData(data) {
//   try {
//     const doctorDetailsData = data.map(row => ({
//       name: row.firstname,
//       second_name:row.lastname,
//       phone_no:row.phone_number,
//       email:row.Email_Id,
//       password,
//       education_qualification:row.sp1,
//       additional_qualification:row.specialty,
//       specialization: row.specialty,
//       type:row.Type,
//       gender:row.gender,
//       address:row.address,
//       experience:row.experience,
//       registration_no:row.Registrationnumber,
//       pincode:row.PINCODE,
//       sector:row.SECTOR
//       // Map other columns from your CSV file to your database fields
//     }));
//     await prisma.doctor_details.createMany({
//       data: doctorDetailsData,
//     });
//   } catch (e) {
//     throw e;
//   }
// }

//////////to manually encrypt existing data in db

const csvupload = async (req, res) => {
  try {
    const fileRows = [];
    const fileRows2 = [];

    const filePath = "C:\\Users\\dell\\Desktop\\DOC1\\LabCompletecsv.csv";
    // const filePath = "C:\\Users\\dell\\Desktop\\DOC1\\hospitalfullcsv.csv";

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found: " + filePath);
    }

    console.log("Starting file read...");

    fs.createReadStream(filePath)
      .on("error", (error) => {
        console.error("Error reading file:", error);
        return res.status(500).send("Error reading file: " + error.message);
      })
      .pipe(csv())
      .on("data", (row) => {
        console.log("Reading row:", row);
        if (row.name) {
          fileRows.push(row);
        }
      })
      .on("end", async () => {
        console.log("Finished reading file. Total rows:", fileRows.length);

        // for (let i = 0; i < fileRows.length && i < 5; i++) {
        //   fileRows2.push(fileRows[i]);
        // }

        // console.log("First 5 rows:", fileRows2);

        try {
          await insertData(fileRows);
          res.send("File successfully processed and data inserted.");
        } catch (error) {
          res.status(500).send("Error inserting data: " + error.message);
        }
      });
  } catch (error) {
    console.error("Caught error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

async function insertData(data) {
  const features = [];
  const services = [];
  const labservices1 = [
    "PET",
    "MRI",
    "CT",
    "USG",
    "Xrays",
    "ECG",
    "Medical Microbiology",
    "Clinical Biochemistry",
    "Hematology",
    "Clinical Pathology",
    "Genetic Testing",
    "Kidney Tests",
    "Prenatal Testing",
  ];
  const labservices2 = [
    "CT",
    "USG",
    "Xrays",
    "ECG",
    "Medical Microbiology",
    "Clinical Biochemistry",
    "Hematology",
    "Clinical Pathology",
    "Kidney Tests",
  ];
  const labfeatures1 = [
    "Home collection",
    "Onilne report",
    "Cashless",
    "24 hours services",
    "Doctor available",
  ];
  const labfeatures2 = ["Home collection", "Onilne report"];
  const labtiming = {
    closing_time: "06:00 PM",
    opening_time: "06:00 AM",
  };
  const images = {
    image1:
      "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360588969-labimg1.jpg",
    image2:
      "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360589079-labimg2.jpg",
    image3:
      "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360589819-labimg3.jpg",
    image4:
      "https://dr1-storage.s3.ap-south-1.amazonaws.com/1722360590510-labimg4.jpg",
  };

  try {
    const labDetailsData = await Promise.all(
      data.map(async (row) => ({
        name: row.name,
        phone_no: row.ContactNumber,
        email: row.emailid,
        password: await bcrypt.hash(`Password@${row.ContactNumber}`, 10),
        address: row.Address,
        license_no: row.license_no,
        pincode: row.Pincode,
        services: row.type === "A" ? labservices1 : labservices2,
        features: row.type === "A" ? labfeatures1 : labfeatures2,
        datetime: istDate,
        status: "Y",
        photo: images,
        timing: labtiming,
      }))
    );

    await prisma.lab_details.createMany({
      data: labDetailsData,
    });
    console.log("Data insertion successful");
  } catch (e) {
    console.error("Error in insertData function:", e);
    throw e;
  }
}

////hospitalcase///////////////

// async function insertData(data) {
//   const labservices = [
//     "Blood Count Tests",
//     "Kidney Tests",
//     "Laboratory Tests",
//     "Thyroid Tests",
//     "Bilirubin Test",
//     "Cholesterol Level",
//     "Electrocardiogram",
//     "TempCheck",
//   ];
//   const labfeatures = [
//     "Home collection",
//     "Onilne report",
//     "Cashless",
//     "24 hours services",
//     "Doctor available",
//   ];
//   const hospitalfeature = [
//     "Op",
//     "Casuality",
//     "Palliative",
//     "Care",
//     "Other Services ",
//   ];
//   const hospitalspeciality = ["General medicine"];
//   const labtiming={
//     "closing_time": "06:00 PM",
//     "opening_time": "06:00 AM"
//   }
//   try {
//     const hospitalDetailsData = await Promise.all(
//       data.map(async (row) => ({
//         name: row.hospitalName,
//         contact_no: row.MobileNo,
//         email: row.Email_id,
//         password: await bcrypt.hash(`Password@${row.MobileNo}`, 10),
//         speciality: hospitalspeciality,
//         type: row.Type,
//         address: row.newaddress,
//         licence_no: row.license_no,
//         pincode: parseInt(row.Pincode),
//         feature: hospitalfeature,
//         datetime: istDate,
//         status: "Y",
//       }))
//     );

//     await prisma.hospital_details.createMany({
//       data: hospitalDetailsData,
//     });
//     console.log("Data insertion successful");
//   } catch (e) {
//     console.error("Error in insertData function:", e);
//     throw e;
//   }
// }

/////////doc case///////
// async function insertData(data) {
//   try {
//     const doctorDetailsData = await Promise.all(
//       data.map(async (row) => ({
//         name: `DR ${row.firstname}`,
//         second_name: row.lastname,
//         phone_no: row.phone_number,
//         email: row.Email_Id,
//         password: await bcrypt.hash(`Password@${row.phone_number}`, 10),
//         education_qualification: row.sp1,
//         additional_qualification: row.speciality,
//         specialization: row.speciality,
//         type: row.Type,
//         gender: row.gender,
//         address: row.address ? `${row.address},${row.area}` : row.area,
//         experience: parseInt(row.experience),
//         registration_no: row.Registrationnumber,
//         pincode: parseInt(row.PINCODE),
//         sector: row.SECTOR,
//         datetime: istDate,
//         status: "Y",
//       }))
//     );

//     await prisma.doctor_details.createMany({
//       data: doctorDetailsData,
//     });
//   } catch (e) {
//     throw e;
//   }
// }

const addUsers = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const {
      name: name,
      phone_no: phone_no,
      email: email,
      password: password,
    } = request.body;
    if (name && password && email && phone_no) {
      const mobileNumber = phone_no;
      if (validateMobileNumber(mobileNumber)) {
        console.log("Valid mobile number");
      } else {
        console.log("Invalid mobile number");
        const resptext = "Invalid mobile number";
        return response.status(401).json({
          error: true,
          success: false,
          message: resptext,
        });
      }
      function validateMobileNumber(mobileNumber) {
        // Regular expression for a valid 10-digit Indian mobile number
        const mobileNumberRegex = /^[6-9]\d{9}$/;
        return mobileNumberRegex.test(mobileNumber);
      }

      const email_id = email;
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
      const users = await prisma.user_details.findMany();
      const emaillowercase = email.toLowerCase();
      for (const user of users) {
        const decryptedEmail = safeDecrypt(user.email, secretKey);
        const decryptedPhone = safeDecrypt(user.phone_no, secretKey);

        if (decryptedEmail === email || decryptedEmail === emaillowercase) {
          return response.status(400).json({
            error: true,
            message: "Email address already exists",
            success: false,
          });
        } else if (decryptedPhone === phone_no) {
          return response.status(400).json({
            error: true,
            message: "Phone number already exists",
            success: false,
          });
        }
      }

      const hashedPass = await bcrypt.hash(password, 5);
      const emailencrypted = encrypt(emaillowercase, secretKey);
      const phoneencrypted = encrypt(phone_no, secretKey);
      await prisma.user_details.create({
        data: {
          name: encrypt(name, secretKey),
          password: hashedPass,
          email: emailencrypted,
          datetime: istDate,
          phone_no: phoneencrypted,
          status: "Y",
        },
      });
      const respText = "Registered successfully";
      response.status(200).json({
        success: true,
        message: respText,
      });
    } else {
      logger.error(`All fields are mandatory in addUsers api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in addUsers api`);
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

const completeRegistration = async (request, response) => {
  try {
    const secretKey = process.env.ENCRYPTION_KEY;
    const user_id = request.user.userId;
    const userimg = request.file?.location;
    console.log({ userimg });
    const { ageGroup, gender, pincode } = JSON.parse(request.body.data);
    if (user_id && ageGroup && gender && pincode) {
      const user = await prisma.user_details.findFirst({
        where: {
          id: user_id,
        },
      });
      if (!user) {
        const resptext = "User doesn't exist";
        return response.status(400).json({
          error: true,
          message: resptext,
        });
      } else {
        const encryptedagegroup = encrypt(ageGroup, secretKey);
        const encryptedgender = encrypt(gender, secretKey);
        await prisma.user_details.update({
          where: {
            id: user_id,
          },
          data: {
            ageGroup: encryptedagegroup,
            gender: encryptedgender,
            pincode,
            updatedDate: istDate,
            image: userimg,
          },
        });
        const respText = "User updated";
        response.status(201).json({
          error: false,
          success: true,
          message: respText,
        });
      }
    } else {
      logger.error(`All fields are mandatory in completeRegistration api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    console.log(error);
    logger.error(
      `Internal server error: ${error.message} in completeRegistration api`
    );
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

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
  const emaillower = email.toLowerCase();
  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password are required",
    });
  }

  try {
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
        message: "Incorrect Email or password!",
      });
    }

    const logged_id = user.id;
    const userType = "customer";
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
      const refreshTokenPayload = {
        userId: logged_id,
        userType,
      };

      const accessTokenPayload = {
        userId: logged_id,
        userType,
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

      await prisma.user_details.update({
        where: { id: logged_id },
        data: { last_active: istDate },
      });

      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        refreshToken,
        accessToken,
        userId: logged_id,
        userType,
      });
    });
  } catch (error) {
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

const getusers = async (request, response) => {
  console.log("getuserssss");
  const secretKey = process.env.ENCRYPTION_KEY;

  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

  try {
    const allData = await prisma.user_details.findMany();

    if (allData.length > 0) {
      // Decrypt fields for each user
      const decryptedData = allData.map((user) => ({
        ...user,
        id: user.id,
        ageGroup: safeDecrypt(user?.ageGroup, secretKey),
        name: safeDecrypt(user?.name, secretKey),
        email: safeDecrypt(user?.email, secretKey),
        phone_no: safeDecrypt(user?.phone_no, secretKey),
        gender: safeDecrypt(user?.gender, secretKey),
      }));

      return response.status(200).json({
        success: true,
        error: false,
        data: decryptedData,
      });
    } else {
      return response.status(200).json({
        success: false,
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    logger.error(`Internal server error: ${error.message} in getusers API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getprofile = async (request, response) => {
  console.log("getprofileeeee");
  const secretKey = process.env.ENCRYPTION_KEY;

  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

  try {
    const userid = request.user.userId;
    // const userid=request.body.userid
    console.log({ userid });
    if (!userid) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User id null!",
      });
    }
    const userDetails = await prisma.user_details.findFirst({
      where: {
        id: userid,
      },
    });

    if (!userDetails) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User not found!",
      });
    }

    const decryptedname = safeDecrypt(userDetails.name, secretKey);
    const decryptedphone = safeDecrypt(userDetails?.phone_no, secretKey);

    const decryptedemail = safeDecrypt(userDetails.email, secretKey);

    const decryptedageGroup = safeDecrypt(userDetails?.ageGroup, secretKey);
    const decryptgender = safeDecrypt(userDetails?.gender, secretKey);

    userDetails.name = decryptedname;
    userDetails.phone_no = decryptedphone;
    userDetails.email = decryptedemail;
    userDetails.ageGroup = decryptedageGroup;
    userDetails.gender = decryptgender;

    return response.status(200).json({
      error: false,
      success: true,
      userDetails,
      data: userDetails,
    });
  } catch (error) {
    console.log("Error:", error);
    logger.error(`Internal server error: ${error.message} in getprofile API`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const edituser = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  try {
    const id = request.user.userId;
    const userimg = request.file?.location || request.body.image;
    console.log(userimg);
    const { name, ageGroup, gender, pincode } = JSON.parse(request.body.data);
    if (id) {
      const userdata = await prisma.user_details.findUnique({
        where: {
          id: id,
        },
      });
      const decryptedName = decrypt(userdata.name, secretKey);
      let decryptedAgeGroup;
      if (userdata.ageGroup) {
        decryptedAgeGroup = decrypt(userdata?.ageGroup, secretKey);
      }
      let decryptedGender;
      if (userdata?.gender) {
        decryptedGender = decrypt(userdata?.gender, secretKey);
      }

      const isNameChanged = decryptedName !== name;
      const isAgeGroupChanged = decryptedAgeGroup !== ageGroup;
      const isGenderChanged = decryptedGender !== gender;
      const isPincodeChanged = userdata.pincode !== pincode;
      const isImageChanged = userdata.image !== userimg;

      if (
        !isNameChanged &&
        !isAgeGroupChanged &&
        !isGenderChanged &&
        !isPincodeChanged &&
        !isImageChanged
      ) {
        return response.status(201).json({
          message: "No changes detected",
          success: false,
          error: true,
        });
      }
      const encryptedname = encrypt(name, secretKey);
      const encryptedagegroup = encrypt(ageGroup, secretKey);
      const encryptedgender = encrypt(gender, secretKey);
      const update = await prisma.user_details.updateMany({
        where: {
          id: id,
        },
        data: {
          name: encryptedname,
          ageGroup: encryptedagegroup,
          gender: encryptedgender,
          pincode: pincode,
          updatedDate: istDate,
          image: userimg,
        },
      });
      if (update) {
        response.status(200).json({
          message: "successfully updated",
          success: true,
          error: false,
        });
      }
    }
  } catch (error) {
    console.log("errr", error);
    logger.error(`Internal server error: ${error.message} in edituser api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const deleteuser = async (request, response) => {
  try {
    const id = request.body.id;
    if (id) {
      const del = await prisma.user_details.update({
        where: {
          id: id,
        },
        data: {
          is_active: "N",
          updatedDate: istDate,
        },
      });
      response.status(200).json({
        success: true,
        error: false,
        data: del,
      });
    }
  } catch (error) {
    console.log("errr", error);
    logger.error(`Internal server error: ${error.message} in deleteuser api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

///login for doctor,lab and hospital
const login = async (request, response) => {
  console.log("Request body:", request.body);
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  try {
    const { email, password, googleVerified } = request.body;

    if (!email || (!password && !googleVerified)) {
      return response.status(401).json({
        error: true,
        success: false,
        message:
          "Email, and either password or Google verification are required",
      });
    }

    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    if (!validateEmail(email)) {
      console.log("Invalid email address");
      return response.status(401).json({
        error: true,
        success: false,
        message: "Invalid email address",
      });
    }
    const emaillower = email.toLowerCase();
    const findUserByEmail = async (emaillower) => {
      const doctor = await prisma.doctor_details.findFirst({
        where: { email: emaillower },
      });
      if (doctor) {
        return {
          user: doctor,
          type: "doctor",
          id: doctor.id,
          databasetype: "doctor",
        };
      }

      const hospital = await prisma.hospital_details.findFirst({
        where: { email: emaillower },
      });
      if (hospital) {
        return {
          user: hospital,
          type: "hospital",
          id: hospital.id,
          databasetype: "hospital",
        };
      }

      const lab = await prisma.lab_details.findFirst({
        where: { email: emaillower },
      });
      if (lab) {
        return {
          user: lab,
          type: "lab", //changed from laboratory
          id: lab.id,
          databasetype: "lab",
        };
      }

      return { user: null, type: null };
    };

    const result = await findUserByEmail(emaillower);
    const { user, type, id, databasetype } = result;

    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Incorrect Email!",
      });
    }

    const userId = user.id;
    const userType = type;

    const hashedDbPassword = user.password;
    console.log({ hashedDbPassword });
    const generateTokens = (userId, userType) => {
      const refreshTokenPayload = { userId, userType };
      const accessTokenPayload = { userId, userType };

      const refreshToken = jwt.sign(
        refreshTokenPayload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "900m" }
      );

      const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "100m" }
      );

      return { refreshToken, accessToken };
    };

    const updateLastActive = async () => {
      await prisma[`${databasetype}_details`].update({
        where: { id },
        data: { last_active: istDate },
      });
    };

    if (password) {
      bcrypt.compare(password, hashedDbPassword, async (error, result) => {
        console.log("errorerrorerror", error);
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

        const { refreshToken, accessToken } = generateTokens(userId, userType);
        await updateLastActive();

        return response.status(200).json({
          success: true,
          error: false,
          message: "Login successful",
          userType: type,
          userId: userId,
          refreshToken,
          accessToken,
        });
      });
    } else {
      const { refreshToken, accessToken } = generateTokens(logged_id, usertype);
      await updateLastActive();

      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        userType: type,
        userId: userId,
        refreshToken,
        accessToken,
      });
    }
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in login API`);
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

/////////forgotpassword//////////////////////////

const UserforgotPwd = async (request, response) => {
  console.log("hyyyyyyyyy", request.body);
  const email = request.body.emailid;
  const secretKey = process.env.ENCRYPTION_KEY;

  try {
    if (!email) {
      return response
        .status(400)
        .json({ error: true, message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return response
        .status(400)
        .json({ error: true, message: "Invalid email address" });
    }

    let user = await prisma.user_details.findMany({
      select: {
        email: true,
        id: true,
        name: true,
      },
    });
    for (const u of user) {
      console.log("heyy");
      const decryptedEmail = decrypt(u.email, secretKey);
      const decryptedname = decrypt(u.name, secretKey);
      console.log({ decryptedEmail });
      if (decryptedEmail === email) {
        console.log("hoiiiiiiiaaaaa");
        user = u;
        user.email = decryptedEmail;
        user.name = decryptedname;
      }
    }
    console.log({ user });

    if (!user) {
      return response
        .status(404)
        .json({ error: true, message: "User not found" });
    }

    const otp = generateOTP();

    await sendOTPByEmail(user.name, user.email, otp);

    return response.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId: user.user_id,
      otp: otp,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in user forgotPwd api`
    );
    return response
      .status(500)
      .json({ error: true, message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const forgotPwd = async (request, response) => {
  console.log("hyyyyyyyyymain", request.body);
  const { email } = request.body;

  console.log({ email });

  try {
    if (!email) {
      return response
        .status(400)
        .json({ error: true, message: "Email is required" });
    }

    if (!validateEmail(email)) {
      return response
        .status(400)
        .json({ error: true, message: "Invalid email address" });
    }

    let user = await prisma.doctor_details.findFirst({ where: { email } });

    console.log({ user });
    if (!user) {
      user = await prisma.hospital_details.findFirst({ where: { email } });
    }

    if (!user) {
      user = await prisma.lab_details.findFirst({ where: { email } });
    }

    if (!user) {
      console.log("object");
      return response
        .status(404)
        .json({ error: true, message: "User not found" });
    }

    const otp = generateOTP();

    await sendOTPByEmail(user.name, user.email, otp);

    return response.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId: user.user_id,
      otp: otp,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in forgotPwd api`);
    return response
      .status(500)
      .json({ error: true, message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

async function sendOTPByEmail(username, userEmail, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 465,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      secure: true,
      tls: { rejectUnauthorized: false },
    });

    const handlebarOptions = {
      viewEngine: {
        partialsDir: path.resolve(__dirname, "../../views"),
        defaultLayout: false,
      },
      viewPath: path.resolve(__dirname, "../../views"),
    };

    transporter.use("compile", hbs(handlebarOptions));

    const mailOptions = {
      from: "support@chaavie.com",
      to: userEmail,
      subject: "OTP Mail",
      template: "user_temp_otp",
      context: {
        username: username,
        otp: otp,
      },
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateOTP() {
  const characters = "0123456789";
  let otp = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters.charAt(randomIndex);
  }
  return otp;
}
////////////////////////////////////////////////////////

const resetpassword = async (request, response) => {
  console.log("resttttadminnnnnnnn", request.body);
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const { email, password } = request.body;

    // Check if email or password is missing
    if (!email || !password) {
      return response.status(400).json({
        error: true,
        message: "Email or password field is empty!",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log("Invalid email address");
      return response.status(401).json({
        error: true,
        success: false,
        message: "Invalid email address!",
      });
    }

    // Function to validate email format
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    let user;
    const doctor = await prisma.doctor_details.findFirst({ where: { email } });
    const hospital = await prisma.hospital_details.findFirst({
      where: { email },
    });
    const lab = await prisma.lab_details.findFirst({ where: { email } });

    if (doctor) {
      user = doctor;
    } else if (hospital) {
      user = hospital;
    } else if (lab) {
      user = lab;
    } else {
      return response
        .status(404)
        .json({ error: true, message: "User not found!" });
    }

    const hashedPassword = await bcrypt.hash(password, 5);

    // Update the password for the found user
    let updatedUser;
    if (doctor) {
      updatedUser = await prisma.doctor_details.update({
        where: {
          email: email,
          id: doctor?.id,
        },
        data: { password: hashedPassword },
      });
    } else if (hospital) {
      updatedUser = await prisma.hospital_details.update({
        where: {
          email: email,
          id: hospital?.id,
        },
        data: { password: hashedPassword },
      });
    } else if (lab) {
      updatedUser = await prisma.lab_details.update({
        where: {
          email: email,
          id: lab?.id,
        },
        data: { password: hashedPassword },
      });
    }

    if (updatedUser) {
      return response.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in resetpassword api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
//neewbelowwww
const restpassword = async (request, response) => {
  console.log("restttt", request.body);
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const { email, password } = request.body;

    // Check if email or password is missing
    if (!email || !password) {
      return response.status(400).json({
        error: true,
        message: "Email or password field is empty!",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log("Invalid email address");
      return response.status(401).json({
        error: true,
        success: false,
        message: "Invalid email address!",
      });
    }

    // Function to validate email format
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
    let user;
    let doc = await prisma.doctor_details.findMany();
    for (const doctor of doc) {
      console.log("heyy");
      const decryptedEmail = decrypt(doctor.email, secretKey);

      console.log({ decryptedEmail });
      if (decryptedEmail === email) {
        doc = doctor;
        doc.email = decryptedEmail;
        doc.id = id;
      }
    }
    //  const doctor = await prisma.doctor_details.findFirst({ where: { email } });
    const hospital = await prisma.hospital_details.findFirst({
      where: { email },
    });
    const lab = await prisma.lab_details.findFirst({ where: { email } });

    if (doc) {
      user = doc;
    } else if (hospital) {
      user = hospital;
    } else if (lab) {
      user = lab;
    } else {
      return response
        .status(404)
        .json({ error: true, message: "User not found!" });
    }

    const hashedPassword = await bcrypt.hash(password, 5);

    // Update the password for the found user
    let updatedUser;
    if (doc) {
      updatedUser = await prisma.doctor_details.update({
        where: {
          //  email: email,
          id: doctor?.id,
        },
        data: { password: hashedPassword },
      });
    } else if (hospital) {
      updatedUser = await prisma.hospital_details.update({
        where: {
          email: email,
          id: hospital?.id,
        },
        data: { password: hashedPassword },
      });
    } else if (lab) {
      updatedUser = await prisma.lab_details.update({
        where: {
          email: email,
          id: lab?.id,
        },
        data: { password: hashedPassword },
      });
    }

    if (updatedUser) {
      return response.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in resetpassword api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const userresetpassword = async (request, response) => {
  console.log("Request Body:", request.body);
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const { email, password } = request.body;

    // Check if email or password is missing
    if (!email || !password) {
      return response.status(400).json({
        error: true,
        message: "Email or password field is empty!",
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log("Invalid email address");
      return response.status(401).json({
        error: true,
        success: false,
        message: "Invalid email address!",
      });
    }

    // Function to validate email format
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    let user = null; // Initialize user as null
    const users = await prisma.user_details.findMany(); // Fetch all users

    for (const u of users) {
      const decryptedEmail = decrypt(u.email, secretKey);
      const decryptedName = decrypt(u.name, secretKey);
      console.log({ decryptedEmail });

      if (decryptedEmail === email) {
        user = u; // Assign the matched user
        user.email = decryptedEmail;
        user.name = decryptedName;
        break; // Exit loop once user is found
      }
    }

    if (user) {
      const hashedPassword = await bcrypt.hash(password, 5);
      const updatedUser = await prisma.user_details.update({
        where: {
          id: user.id, // Use the correct table and user ID
        },
        data: { password: hashedPassword },
      });

      return response.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    } else {
      return response.status(404).json({
        error: true,
        message: "User not found!",
      });
    }
  } catch (error) {
    console.error(
      `Internal server error: ${error.message} in resetpassword api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const userotpLogin = async (request, response) => {
  const { email, otp } = request.body;

  if (!email || !otp) {
    logger.error(`email or otp field is empty in otpLogin api`);
    response.status(400).json({
      error: true,
      message: "email or otp field is empty!",
    });
    return;
  }
  try {
    const user = await prisma.user_details.findOne({ email: email });

    if (!user) {
      response.status(400).json({
        error: true,
        message: "no user found!",
      });
    } else {
      const dbOtp = user.temp_otp;
      const result = await bcrypt.compare(otp, dbOtp);
      if (!result) {
        logger.error(`otp is not matching -in otpLogin api`);
        response.status(401).json({
          error: true,
          message: "otp is not matching!",
        });
      } else {
        response.status(200).json({
          success: true,
          message: "Login successful",
          data: user,
        });
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in otpLogin api`);
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const viewchatdetails = async (request, response) => {
  try {
    const view = await prisma.chat_data.findMany();
    if (view.length > 0) {
      response.status(200).json({
        data: view,
        error: false,
        success: true,
      });
    } else {
      response.status(400).json({
        message: "No data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error:${error.message} in viewchatdetails api`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const consultcount = async (request, response) => {
  console.log("consultcountttt", request.user.userId);
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try {
    const userid = request.user.userId;
    const { id, type, status } = request.body;
    const consultcount = 1;
    // Define 24hours ago hours
    const twentyFourHoursAgo = new Date(
      istDate.getTime() - 24 * 60 * 60 * 1000
    );
    // 24 hours in milliseconds
    // const oneWeekAgo = new Date(istDate.getTime() - 168 * 60 * 60 * 1000); // 168 hours

    if (!userid || !id || !type) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }
    if (userid && type == "Hospital") {
      console.log("hospii");
      const check = await prisma.hospital_interacteduser.findFirst({
        where: {
          user_id: userid,
          hospital_id: id,
          consultcount: 1,
        },
      });

      if (check) {
        // Check if the created_date is older than one week
        if (new Date(check.created_date) <= twentyFourHoursAgo) {
          // Create a new row
          const add = await prisma.hospital_interacteduser.create({
            data: {
              user_id: userid,
              hospital_id: id,
              consultcount: consultcount || 1,
              created_date: istDate,
              status: status,
            },
          });

          if (add) {
            return response.status(200).json({
              message: "Success",
              success: true,
              error: false,
            });
          } else {
            return response.status(500).json({
              message: "Failed to create record",
              error: true,
            });
          }
        } else {
          // Do not update or create a new row if the record is newer than one week
          return response.status(200).json({
            message:
              "Record is newer than one 24hours, no update or creation needed",
            success: true,
            error: false,
          });
        }
      } else {
        // Create a new row if no existing record is found
        const add = await prisma.hospital_interacteduser.create({
          data: {
            user_id: userid,
            hospital_id: id,
            consultcount: 1,
            created_date: istDate,
            status: status,
          },
        });

        if (add) {
          return response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        } else {
          return response.status(500).json({
            message: "Failed to create record",
            error: true,
          });
        }
      }
    } else if (userid && type == "Lab") {
      const check = await prisma.lab_interacteduser.findFirst({
        where: {
          user_id: userid,
          lab_id: id,
          consultcount: 1,
        },
      });
      if (check) {
        // Check if the created_date is older than one week
        if (new Date(check.created_date) <= twentyFourHoursAgo) {
          // Create a new row
          const add = await prisma.lab_interacteduser.create({
            data: {
              user_id: userid,
              lab_id: id,
              consultcount: 1,
              created_date: istDate,
              status: status,
            },
          });

          if (add) {
            return response.status(200).json({
              message: "Success",
              success: true,
              error: false,
            });
          } else {
            return response.status(500).json({
              message: "Failed to create record",
              error: true,
            });
          }
        } else {
          // Do not update or create a new row if the record is newer than one week
          return response.status(200).json({
            message:
              "Record is newer than 24hours, no update or creation needed",
            success: true,
            error: false,
          });
        }
      } else {
        // Create a new row if no existing record is found
        const add = await prisma.lab_interacteduser.create({
          data: {
            user_id: userid,
            lab_id: id,
            consultcount: 1,
            created_date: istDate,
            status: status,
          },
        });

        if (add) {
          return response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        } else {
          return response.status(500).json({
            message: "Failed to create record",
            error: true,
          });
        }
      }
    } else if (userid && type == "Doctor") {
      const check = await prisma.doctor_interacteduser.findFirst({
        where: {
          user_id: userid,
          doctor_id: id,
          consultcount: 1,
        },
      });
      if (check) {
        // Check if the created_date is older than one week
        if (new Date(check.created_date) <= twentyFourHoursAgo) {
          // Create a new row
          console.log("createdddddd");
          const add = await prisma.doctor_interacteduser.create({
            data: {
              user_id: userid,
              doctor_id: id,
              consultcount: 1,
              created_date: istDate,
              status: status,
            },
          });

          if (add) {
            return response.status(200).json({
              message: "Success",
              success: true,
              error: false,
            });
          } else {
            return response.status(500).json({
              message: "Failed to create record",
              error: true,
            });
          }
        } else {
          // Do not update or create a new row if the record is newer than one week
          return response.status(200).json({
            message:
              "Record is newer than 24hours, no update or creation needed",
            success: true,
            error: false,
          });
        }
      } else {
        // Create a new row if no existing record is found
        const add = await prisma.doctor_interacteduser.create({
          data: {
            user_id: userid,
            doctor_id: id,
            consultcount: 1,
            created_date: istDate,
            status: status,
          },
        });

        if (add) {
          return response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        } else {
          return response.status(500).json({
            message: "Failed to create record",
            error: true,
          });
        }
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in consultcount api`);
    response.status(400).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const viewcount = async (request, response) => {
  console.log("viewcountttttttt===========>", request.body);
  try {
    const userid = request.user.userId;
    const { id, type } = request.body;
    if (userid && type == "Hospital") {
      const check = await prisma.hospital_interacteduser.findFirst({
        where: {
          user_id: userid,
          hospital_id: id,
        },
      });
      if (check) {
        const update = await prisma.hospital_interacteduser.create({
          data: {
            user_id: userid,
            hospital_id: id,
            viewcount: 1,
            created_date: istDate,
          },
        });
        if (update) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      } else {
        const add = await prisma.hospital_interacteduser.create({
          data: {
            user_id: userid,
            hospital_id: id,
            viewcount: 1,
            created_date: istDate,
            // st_modifiedDate:istDate
          },
        });
        if (add) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      }
    } else if (userid && type == "Lab") {
      const check = await prisma.lab_interacteduser.findFirst({
        where: {
          user_id: userid,
          lab_id: id,
          // viewcount:1
        },
      });
      console.log({ check });
      if (check) {
        const update = await prisma.lab_interacteduser.create({
          // where: {
          //   id: check?.id,
          // },
          data: {
            user_id: userid,
            lab_id: id,
            viewcount: 1,
            created_date: istDate,
            // st_modifiedDate:istDate
          },
        });
        if (update) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      } else {
        const add = await prisma.lab_interacteduser.create({
          data: {
            user_id: userid,
            lab_id: id,
            viewcount: 1,
            created_date: istDate,
            // st_modifiedDate:istDate
          },
        });
        if (add) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      }
    } else if (userid && type == "Doctor") {
      const check = await prisma.doctor_interacteduser.findFirst({
        where: {
          user_id: userid,
          doctor_id: id,
          // viewcount:1
        },
      });
      if (check) {
        const update = await prisma.doctor_interacteduser.create({
          data: {
            user_id: userid,
            doctor_id: id,
            viewcount: 1,
            created_date: istDate,
            // st_modifiedDate:istDate
          },
        });
        if (update) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      } else {
        const add = await prisma.doctor_interacteduser.create({
          data: {
            user_id: userid,
            doctor_id: id,
            viewcount: 1,
            created_date: istDate,
            // st_modifiedDate:istDate
          },
        });
        if (add) {
          response.status(200).json({
            message: "Success",
            success: true,
            error: false,
          });
        }
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in viewcount api`);
    response.status(400).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const allconsultcount = async (request, response) => {
  try {
    const { id, type } = request.body;

    // Check if id or type is missing
    if (!id || !type) {
      return response.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }

    let all = [];

    // Fetch based on type with consultcount filter
    if (type === "Hospital") {
      all = await prisma.hospital_interacteduser.findMany({
        where: {
          hospital_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
      });
    } else if (type === "Lab") {
      all = await prisma.lab_interacteduser.findMany({
        where: {
          lab_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
      });
    } else if (type === "Doctor") {
      all = await prisma.doctor_interacteduser.findMany({
        where: {
          doctor_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
      });
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid type provided",
      });
    }

    return response.status(200).json({
      error: false,
      message: "Success",
      data: all,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in allconsultcount api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

///////////both consult and view count

const allcount = async (request, response) => {
  console.log("allcountttt", request.body);
  try {
    const { id, type } = request.body;
    const secretKey = process.env.ENCRYPTION_KEY;

    if (!id || !type) {
      return response.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }

    let allData = [];

    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };

    // Fetch based on type with consultcount and viewcount filters
    if (type === "Hospital") {
      allData = await prisma.hospital_interacteduser.findMany({
        where: {
          hospital_id: id,
          OR: [
            {
              consultcount: {
                not: 0,
                not: null,
              },
            },
            {
              viewcount: {
                not: 0,
                not: null,
              },
            },
          ],
        },
        select: {
          viewcount: true,
          consultcount: true,
          status: true,
          userid: {
            select: {
              name: true,
              id: true,
              pincode: true,
            },
          },
          hospitalid: {
            select: {
              name: true,
              id: true,
            },
          },
          created_date: true,
        },
      });
      if (allData.length <= 0) {
        return response.status(200).json({
          allData: [],
          consultCount: 0,
          viewCount: 0,
        });
      }
    } else if (type === "Lab") {
      allData = await prisma.lab_interacteduser.findMany({
        where: {
          lab_id: id,
          OR: [
            {
              consultcount: {
                not: 0,
                not: null,
              },
            },
            {
              viewcount: {
                not: 0,
                not: null,
              },
            },
          ],
        },
        select: {
          viewcount: true,
          consultcount: true,
          status: true,
          userid: {
            select: {
              name: true,
              id: true,
              phone_no: true,
              pincode: true,
            },
          },
          labId: {
            select: {
              name: true,
              id: true,
            },
          },
          created_date: true,
        },
      });
      if (allData.length <= 0) {
        return response.status(200).json({
          allData: [],
          consultCount: 0,
          viewCount: 0,
        });
      }
    } else if (type === "Doctor") {
      allData = await prisma.doctor_interacteduser.findMany({
        where: {
          doctor_id: id,
          OR: [
            {
              consultcount: {
                not: 0,
                not: null,
              },
            },
            {
              viewcount: {
                not: 0,
                not: null,
              },
            },
          ],
        },
        select: {
          viewcount: true,
          consultcount: true,
          status: true,
          userid: {
            select: {
              name: true,
              id: true,
              pincode: true,
            },
          },
          doctorid: {
            select: {
              name: true,
              id: true,
            },
          },
          created_date: true,
        },
      });
      if (allData.length <= 0) {
        return response.status(200).json({
          allData: [],
          consultCount: 0,
          viewCount: 0,
        });
      }
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid type provided",
      });
    }

    // Decrypt the names in the retrieved data
    allData = allData.map((item) => {
      return {
        ...item,
        userid: {
          ...item.userid,
          name: safeDecrypt(item.userid.name, secretKey),
        },
      };
    });

    // Sort allData by created_date in descending order
    allData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return response.status(200).json({
      error: false,
      message: "Success",
      consultCount: allData.filter(
        (item) => item.consultcount !== null && item.consultcount !== 0
      ).length,
      viewCount: allData.filter(
        (item) => item.viewcount !== null && item.viewcount !== 0
      ).length,
      allData: allData,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in allcount API`);
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const userdisable = async (request, response) => {
  try {
    const { id } = request.body;
    if (id) {
      const disable = await prisma.user_details.update({
        where: {
          id: id,
        },
        data: {
          status: "N",
        },
      });
      if (disable) {
        return response.status(200).json({
          message: "successfully disabled the user",
          success: true,
          error: false,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in user-userdisable api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const monthlyCount = async (request, response) => {
  try {
    const { id, type } = request.body;

    // Check if id or type is missing
    if (!id || !type) {
      return response.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }

    let consultData = [];
    let viewData = [];

    if (type === "Hospital") {
      consultData = await prisma.hospital_interacteduser.groupBy({
        by: ["month"],
        where: {
          hospital_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          consultcount: true,
        },
      });
      viewData = await prisma.hospital_interacteduser.groupBy({
        by: ["month"],
        where: {
          hospital_id: id,
          viewcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          viewcount: true,
        },
      });
    } else if (type === "Lab") {
      consultData = await prisma.lab_interacteduser.groupBy({
        by: ["month"],
        where: {
          lab_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          consultcount: true,
        },
      });
      viewData = await prisma.lab_interacteduser.groupBy({
        by: ["month"],
        where: {
          lab_id: id,
          viewcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          viewcount: true,
        },
      });
    } else if (type === "Doctor") {
      consultData = await prisma.doctor_interacteduser.groupBy({
        by: ["month"],
        where: {
          doctor_id: id,
          consultcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          consultcount: true,
        },
      });
      viewData = await prisma.doctor_interacteduser.groupBy({
        by: ["month"],
        where: {
          doctor_id: id,
          viewcount: {
            not: 0,
            not: null,
          },
        },
        _count: {
          viewcount: true,
        },
      });
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid type provided",
      });
    }

    const formatData = (data, field) => {
      return data.map((item) => ({
        month: item.month,
        count: item._count[field],
      }));
    };

    return response.status(200).json({
      error: false,
      message: "Success",
      consultData: formatData(consultData, "consultcount"),
      viewData: formatData(viewData, "viewcount"),
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in monthlyCount API`);
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

///////////////intercated status========> "N"->no feedback,"P"-->Pending feedback , "L"==>"Maybe later" and "Y"==>"Feedback provided"
///for feedback afterrr 72hours


const Doctorafterconsult = async (request, response) => {
  console.log("docafterconsulttttt");
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  const user_id = request.user.userId;
  const past72HoursDate = new Date(istDate.getTime() - 72 * 60 * 60 * 1000);
  const threeDaysAgoDate = new Date(
    istDate.getTime() - 3 * 24 * 60 * 60 * 1000
  );

  try {
    if (!user_id) {
      return response.status(400).json({
        message: "customer id can't be null!",
        error: true,
      });
    }

    const interactions = await prisma.doctor_interacteduser.findMany({
      where: {
        user_id: user_id,
        consultcount: 1,
        status: {
          notIn: ["N", "Y", "NR"],
        },
        st_modifiedDate: {
          lt: past72HoursDate,
        },
      },
      orderBy: {
        st_modifiedDate: "desc",
      },
      select: {
        id: true,
        doctorid: true,
        st_modifiedDate: true,
        status: true,
      },
    });
    console.log("docccccccccc", interactions);
    if (interactions.length === 0) {
      return response.status(404).json({
        error: true,
        message:
          "No consultations found for this user greater than 72 hours ago",
      });
    }

    const interactionDetails = [];
    const uniqueDoctors = new Set();

    for (const interaction of interactions) {
      if (!uniqueDoctors.has(interaction.doctorid?.id)) {
        const feedback = await prisma.doctor_feedback.findFirst({
          where: {
            doctor_id: interaction.doctorid?.id,
            user_id: user_id,
          },
          orderBy: {
            created_date: "desc",
          },
          select: {
            created_date: true,
          },
        });

        const oneWeekAgoDate = new Date(
          istDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        if (
          !feedback ||
          new Date(feedback.created_date) < oneWeekAgoDate ||
          (interaction.status === "L" &&
            interaction.st_modifiedDate < threeDaysAgoDate)
        ) {
          interactionDetails.push({
            doctor_id: interaction.doctorid?.id,
            doctor_name: interaction?.doctorid?.name,
            type: "Doctor",
            lastInteractionId: interaction.id,
          });

          // Add the doctor ID to the Set to avoid duplicates
          uniqueDoctors.add(interaction.doctorid?.id);
        }
      }
    }

    console.log({ interactionDetails });

    return response.status(200).json({
      success: true,
      interactions: interactionDetails,
      message: "Found consultations greater than 72 hours ago",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctorafterconsult API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const hospitalafterconsult = async (request, response) => {
  console.log("hospitalafterconsulttttt");
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  const user_id = request.user.userId;
  const past72HoursDate = new Date(istDate.getTime() - 72 * 60 * 60 * 1000);
  // const past72HoursDate = new Date(istDate.getTime() - 1 * 60 * 1000);
  const threeDaysAgoDate = new Date(
    istDate.getTime() - 3 * 24 * 60 * 60 * 1000
  );

  try {
    if (!user_id) {
      return response.status(400).json({
        message: "custpomer id can't be null!",
        error: true,
      });
    }
    const interactions = await prisma.hospital_interacteduser.findMany({
      where: {
        user_id: user_id,
        consultcount: 1,
        status: {
          notIn: ["N", "Y", "NR"],
        },
        st_modifiedDate: {
          lt: past72HoursDate,
        },
      },
      orderBy: {
        st_modifiedDate: "desc",
      },
      select: {
        id: true,
        hospitalid: true,
        st_modifiedDate: true,
      },
    });

    if (interactions.length === 0) {
      return response.status(404).json({
        error: true,
        message:
          "No consultations found for this user greater than 72 hours ago",
      });
    }

    const interactionDetails = [];
    const uniqueHospitals = new Set();
    for (const interaction of interactions) {
      if (!uniqueHospitals.has(interaction.hospitalid?.id)) {
        const feedback = await prisma.hospital_feedback.findFirst({
          where: {
            hospital_id: interaction.hospitalid?.id,
            user_id: user_id,
          },
          orderBy: {
            created_date: "desc",
          },
          select: {
            created_date: true,
          },
        });

        // Check if feedback exists and is older than 1 week
        const oneWeekAgoDate = new Date(
          istDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        if (
          !feedback ||
          new Date(feedback.created_date) < oneWeekAgoDate ||
          (interaction.status === "L" &&
            interaction.st_modifiedDate < threeDaysAgoDate)
        ) {
          interactionDetails.push({
            hospital_id: interaction.hospitalid?.id,
            hospital_name: interaction?.hospitalid?.name,
            type: "Hospital",
            lastInteractionId: interaction.id,
          });
        }
        // Add the hospital ID to the Set to avoid duplicates
        uniqueHospitals.add(interaction.hospitalid?.id);
      }
    }

    return response.status(200).json({
      success: true,
      interactions: interactionDetails,
      message: "Found consultations greater than 72 hours ago",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in hospitalafterconsult API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const labafterconsult = async (request, response) => {
  console.log("labafterconsulttttt");
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  const user_id = request.user.userId;
  const past72HoursDate = new Date(istDate.getTime() - 72 * 60 * 60 * 1000);
  const threeDaysAgoDate = new Date(
    istDate.getTime() - 3 * 24 * 60 * 60 * 1000
  );

  try {
    if (!user_id) {
      return response.status(400).json({
        message: "custpomer id can't be null!",
        error: true,
      });
    }
    const interactions = await prisma.lab_interacteduser.findMany({
      where: {
        user_id: user_id,
        consultcount: 1,
        status: {
          notIn: ["N", "Y", "NR"],
        },
        st_modifiedDate: {
          lt: past72HoursDate,
        },
      },
      orderBy: {
        st_modifiedDate: "desc",
      },
      select: {
        id: true,
        labId: true,
        st_modifiedDate: true,
        status: true,
      },
    });

    if (interactions.length === 0) {
      return response.status(404).json({
        error: true,
        message:
          "No consultations found for this user greater than 72 hours ago",
      });
    }

    const interactionDetails = [];
    const uniqueLab = new Set();

    for (const interaction of interactions) {
      if (!uniqueLab.has(interaction.labId?.id)) {
        const feedback = await prisma.lab_feedback.findFirst({
          where: {
            lab_id: interaction.labId?.id,
            user_id: user_id,
          },
          orderBy: {
            created_date: "desc",
          },
          select: {
            created_date: true,
          },
        });

        const oneWeekAgoDate = new Date(
          istDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        if (
          !feedback ||
          new Date(feedback.created_date) < oneWeekAgoDate ||
          (interaction.status === "L" &&
            interaction.st_modifiedDate < threeDaysAgoDate)
        ) {
          interactionDetails.push({
            lab_id: interaction.labId?.id,
            lab_name: interaction?.labId?.name,
            type: "Lab",
            lastInteractionId: interaction.id,
          });
        }
        // Add the Lab ID to the Set to avoid duplicates
        uniqueLab.add(interaction.labId?.id);
      }
    }
    console.log({ interactionDetails });
    return response.status(200).json({
      success: true,
      data: interactionDetails,
      message: "Found last consultation greater than 72 hours ago",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in labafterconsult API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const afterconsultupdate = async (request, response) => {
  console.log("afterconssssssssssssssulttt", request.body);
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);
  try {
    //status==>L (later) || N ==>Not consulted ||  Y==>Consulted  || NR ==>Not responded
    const user_id = request.user.userId;
    const { status, type, interactedid } = request.body;
    if (!user_id || !type || !interactedid) {
      return response.status(400).json({
        message: "required fields can't be null",
        error: true,
      });
    }
    if (type === "Doctor") {
      const find = await prisma.doctor_interacteduser.findFirst({
        where: {
          id: interactedid,
          user_id: user_id,
        },
      });
      // console.log({ find });
      const startOfDay = new Date(find.created_date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(find.created_date);
      endOfDay.setHours(23, 59, 59, 999);
      const interactions = await prisma.doctor_interacteduser.updateMany({
        where: {
          doctor_id: find?.doctor_id,
          user_id: user_id,
          created_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        data: {
          status: status,
          st_modifiedDate: istDate,
        },
      });
      // console.log({ interactions });
      // const interactions = await prisma.doctor_interacteduser.updateMany({
      //   where: {
      //     id: interactedid,
      //     user_id: user_id,
      //   },
      //   data: {
      //     status: status,
      //     st_modifiedDate: istDate,
      //   },
      // });
      if (interactions) {
        return response.status(200).json({
          error: false,
          success: true,
          message: "Success",
        });
      }
    } else if (type === "Lab") {
      const find = await prisma.doctor_interacteduser.findFirst({
        where: {
          id: interactedid,
          user_id: user_id,
        },
      });
      const startOfDay = new Date(find.created_date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(find.created_date);
      endOfDay.setHours(23, 59, 59, 999);
      const interactions = await prisma.lab_interacteduser.updateMany({
        where: {
          lab_id: find?.lab_id,
          user_id: user_id,
          created_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        data: {
          status: status,
          st_modifiedDate: istDate,
        },
      });
      if (interactions) {
        return response.status(200).json({
          error: false,
          success: true,
          message: "Success",
        });
      }
    } else if (type === "Hospital") {
      const find = await prisma.doctor_interacteduser.findFirst({
        where: {
          id: interactedid,
          user_id: user_id,
        },
      });
      const startOfDay = new Date(find.created_date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(find.created_date);
      endOfDay.setHours(23, 59, 59, 999);

      const interactions = await prisma.hospital_interacteduser.updateMany({
        where: {
          hospital_id: find?.hospital_id,
          user_id: user_id,
          created_date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        data: {
          status: status,
          st_modifiedDate: istDate,
        },
      });

      if (interactions) {
        return response.status(200).json({
          error: false,
          success: true,
          message: "Success",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in afterconsultupdate API`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

///////////////user approval/////////////

const getunapproveuser = async (request, response) => {
  try {
    const complete_dr = await prisma.doctor_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });

    const complete_hospital = await prisma.hospital_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });

    const complete_lab = await prisma.lab_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });

    const complete_data = await prisma.user_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });

    const combined_data = [
      ...complete_dr.map((dr) => ({ ...dr, type: "Doctor" })),
      ...complete_hospital.map((hospital) => ({
        ...hospital,
        type: "Hospital",
      })),
      ...complete_lab.map((lab) => ({ ...lab, type: "Laboratory" })),
      ...complete_data.map((user) => ({ ...user, type: "User" })),
    ];

    if (combined_data.length > 0) {
      response.status(200).json({
        success: true,
        data: combined_data,
      });
    } else {
      response.status(400).json({
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getunapproveuser API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const approveuser = async (request, response) => {
  try {
    const { id, status } = request.body;
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);

    if (!id) {
      return response.status(400).json({ message: "User ID is required." });
    }

    if (status !== "Y" && status !== "N" && status !== "R") {
      return response.status(400).json({ message: "Invalid status value." });
    }

    const user = await prisma.user_details.update({
      where: { id: id },
      data: { status: status, updatedDate: istDate },
    });

    if (user) {
      let message;
      if (status === "Y") {
        message = "User Approved.";
      } else if (status === "N") {
        message = "User Disabled.";
      } else {
        message = "User Rejected.";
      }
      response.status(200).json({ message: message });
    } else {
      response.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in approveuser API`);
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

////////customer interacted data
const auserinteract = async (request, response) => {
  try {
    const id = request.body.id;
    let all = [];
    const drfind = await prisma.doctor_interacteduser.findMany({
      where: {
        user_id: id,
      },
      select: {
        created_date: true,
        viewcount: true,
        consultcount: true,
        doctorid: {
          select: {
            name: true,
          },
        },
      },
    });
    if (drfind.length > 0) {
      all.push(
        ...drfind.map((item) => ({
          ...item,
          type: "Doctor",
          typename: item?.doctorid?.name,
        }))
      );
    }
    const hospitalfind = await prisma.hospital_interacteduser.findMany({
      where: {
        user_id: id,
      },
      select: {
        created_date: true,
        viewcount: true,
        consultcount: true,
        hospitalid: {
          select: {
            name: true,
          },
        },
      },
    });
    if (hospitalfind.length > 0) {
      all.push(
        ...hospitalfind.map((item) => ({
          ...item,
          type: "Hospital",
          typename: item?.hospitalid?.name,
        }))
      );
    }
    const labfind = await prisma.lab_interacteduser.findMany({
      where: {
        user_id: id,
      },
      select: {
        created_date: true,
        viewcount: true,
        consultcount: true,
        labId: {
          select: {
            name: true,
          },
        },
      },
    });
    if (labfind.length > 0) {
      all.push(
        ...labfind.map((item) => ({
          ...item,
          type: "Lab",
          typename: item?.labId?.name,
        }))
      );
    }

    // Sort all interactions in descending order based on date
    all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return response.status(200).json({
      data: all,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in auserinteract API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};
//to check if the user has completed their profile or not
const profilecompleted = async (request, response) => {
  try {
    const id = request.user.userId;
    if (id) {
      const find = await prisma.user_details.findFirst({
        where: {
          id,
        },
        select: {
          pincode: true,
          ageGroup: true,
          gender: true,
        },
      });

      if (
        find?.pincode === null ||
        find?.ageGroup === null ||
        find?.gender === null
      ) {
        return response.status(200).json({
          profilecompleted: false,
          success: true,
        });
      } else {
        return response.status(200).json({
          profilecompleted: true,
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in profilecompleted API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

///profile completed and incomplete count

const profilecount = async (request, response) => {
  try {
    const [incompleteCount, totalCount, completeCount] = await Promise.all([
      prisma.user_details.count({
        where: {
          OR: [
            { ageGroup: { equals: null } },
            { gender: { equals: null } },
            { pincode: { equals: null } },
          ],
        },
      }),
      prisma.user_details.count(),
      prisma.user_details.count({
        where: {
          AND: [
            { ageGroup: { not: null } },
            { gender: { not: null } },
            { pincode: { not: null } },
          ],
        },
      }),
    ]);

    return response.status(200).json({
      incompleteProfiles: incompleteCount,
      totalProfiles: totalCount,
      completeProfiles: completeCount,
      success: true,
      message: "success",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in user profilecount API`
    );
    console.error(error);
    return response.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const emailencryption = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  if (!secretKey) {
    return response.status(500).json({
      success: false,
      message: "Encryption key is not set in the environment variables.",
    });
  }

  try {
    const user = await prisma.user_details.findUnique({
      where: {
        id: 8,
      },
    });

    const updateData = {};

    if (user.email) {
      try {
        console.log("object", user.email);
        const encryptedemail = encrypt(user.email, secretKey);

        updateData.email = encryptedemail;
        const encryptphone = encrypt(user.phone_no, secretKey);
        updateData.phone_no = encryptphone;
        const encryptname = encrypt(user.name, secretKey);
        updateData.name = encryptname;
      } catch (encryptionError) {
        console.error(
          `Error encrypting phone number for user ID ${user.id}:`,
          encryptionError
        );
      }
    } else {
      console.warn(
        `Skipping phone number encryption for doctor ID ${user.id} due to missing phone number`
      );
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user_details.update({
        where: { id: user.id },
        data: updateData,
      });

      console.log(`Encrypted data for user ID ${user.id}`);
    }

    response.status(200).json({
      success: true,
      message: "All emails and phone numbers encrypted successfully.",
    });
  } catch (error) {
    console.error("Error encrypting emails and phone numbers:", error);
    response.status(500).json({
      success: false,
      message: "An error occurred while encrypting emails and phone numbers.",
    });
  }
};

const decryptEmails = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

  try {
    // Fetch all records from the doctor_details table
    const doctors = await prisma.doctor_details.findMany();

    for (const doctor of doctors) {
      const updateData = {};

      try {
        if (doctor.email) {
          const decryptedEmail = safeDecrypt(doctor.email, secretKey);
          updateData.email = decryptedEmail;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.doctor_details.update({
            where: { id: doctor.id },
            data: updateData,
          });

          console.log(`Decrypted email for doctor ID ${doctor.id}`);
        }
      } catch (decryptionError) {
        console.error(
          `Error decrypting email for doctor ID ${doctor.id}:`,
          decryptionError
        );
      }
    }

    response.status(200).json({
      success: true,
      message: "All emails decrypted successfully.",
    });
  } catch (error) {
    console.error("Error decrypting emails:", error);
    response.status(500).json({
      success: false,
      message: "An error occurred while decrypting emails.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  addUsers,
  userLogin,
  getusers,
  edituser,
  deleteuser,
  login,
  forgotPwd,
  resetpassword,
  viewchatdetails,
  consultcount,
  viewcount,
  allconsultcount,
  allcount,
  completeRegistration,
  userdisable,
  monthlyCount,
  emailencryption,
  Doctorafterconsult,
  hospitalafterconsult,
  labafterconsult,
  afterconsultupdate,
  getunapproveuser,
  approveuser,
  getprofile,
  decryptEmails,
  auserinteract,
  profilecompleted,
  profilecount,
  csvupload,
  UserforgotPwd,
  userresetpassword,
  userotpLogin,
};
