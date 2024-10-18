const bcrypt = require("bcrypt");
const {
  decrypt,
  getCurrentDateInIST,
  istDate,
  logger,
  prisma,
} = require("../../utils");

require("dotenv").config();
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

const addadmin = async (request, response) => {
  try {
    console.log("object", request.body);
    const { type, name, password, emailid, phone_no, created_by, user_access } =
      request.body;
    if (type && name && password && emailid && phone_no) {
      const datetime = getCurrentDateInIST();
      const up_type = type.toUpperCase();

      const check = await prisma.admin_details.findFirst({
        where: {
          OR: [
            {
              emailid: emailid,
            },
            {
              phone_no: phone_no,
            },
          ],
        },
      });

      if (check) {
        return response.status(400).json({
          message: "Email or phone number already exists",
          success: false,
        });
      }

      // Example usage:
      const mobileNumber = phone_no;
      if (validateMobileNumber(mobileNumber)) {
        console.log("Valid mobile number");
      } else {
        console.log("Invalid mobile number");
        const resptext = "Invalid mobile number";
        return response.send(resptext);
      }
      function validateMobileNumber(mobileNumber) {
        // Regular expression for a valid 10-digit Indian mobile number
        const mobileNumberRegex = /^[6-9]\d{9}$/;

        return mobileNumberRegex.test(mobileNumber);
      }
      // Example usage:
      const email_id = emailid;
      if (validateEmail(email_id)) {
        console.log("Valid email address");
      } else {
        console.log("Invalid email address");
        const resptext = "Invalid email address";
        return response.send(resptext);
      }
      function validateEmail(email_id) {
        // Regular expression for a simple email validation
        const emailRegex = /^[^\s@]+@gmail\.com$/;

        return emailRegex.test(email_id);
      }

      const hasedpass = bcrypt.hashSync(password, 5);

      const maxIdResult = await prisma.admin_details.aggregate({
        _max: {
          id: true,
        },
      });
      const new_id = maxIdResult._max.id + 1;
      const recentUserResult = await prisma.admin_details.findFirst({
        select: {
          id: true,
          created_date: true,
        },
        where: {
          adm_type: type,
        },
        orderBy: {
          id: "desc",
        },
      });
      const month = ("0" + (datetime.getMonth() + 1)).slice(-2);
      let new_user_id = 1;

      if (recentUserResult) {
        new_user_id = recentUserResult.id + 1;
      } else {
        // Handle the case when there are no matching records
        new_user_id = 1;
      }
      const ad_id =
        type.toUpperCase() +
        datetime.getFullYear() +
        month +
        ("0000" + new_user_id).slice(-4);

      const admin = await prisma.admin_details.create({
        data: {
          id: new_id,
          adm_id: ad_id,
          name: name,
          password: hasedpass,
          emailid: emailid,
          phone_no: phone_no,
          adm_type: up_type,
          is_active: "Y",
          created_date: datetime,
          created_by,
          user_access: user_access,
        },
      });

      response.status(200).json({
        success: true,
        message: "success",
      });
      const respText = "Success";
      // const notification = await prisma.adm_notification.create({
      //   data: {
      //     text: respText,
      //     sender: new_id,
      //     read: "N",
      //     type: "UR",
      //     created_date: datetime,
      //     verification_id: ad_id
      //   }
      // })
    } else {
      logger.error(`All fields are mandatory in addadmin api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    response.status(500).json(error.message);
    logger.error(
      `Internal server error: ${error.message} in admin-addadmin api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const adminLogin = async (request, response) => {
  const { email, password } = request.body;
  console.log("loginnnn");
  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password required",
    });
  }

  try {
    const user = await prisma.admin_details.findFirst({
      where: { emailid: email },
    });
    console.log("user=======================", user);
    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Incorrect Email or password!",
      });
    }

    const user_id = user.adm_id;
    const logged_id = user.id;
    const hashedDbPassword = user.password;
    const type = user.adm_type;

    // Compare the provided password with the hashed password from the database
    bcrypt.compare(password, hashedDbPassword, async function (err, result) {
      if (err) {
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
      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        userType: type,
        logged_id: logged_id,
        user: user_id,
      });
    });
  } catch (error) {
    console.log("errr", error);
    logger.error(
      `Internal server error: ${error.message} in admin- admLogin api`
    );
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const editadmin = async (request, response) => {
  console.log("editadmin", request.body);
  const { id, emailid, phone_no, user_access } = request.body;

  if (!emailid || !phone_no) {
    logger.error("All fields are required in editUser api");
    throw new Error("All fields are required");
  }

  try {
    if (id) {
      const user = await prisma.admin_details.findUnique({
        where: { id: id },
      });

      if (!user) {
        return response.status(404).json({
          error: true,
          success: false,
          message: "No user found",
        });
      }

      // Check if email or phone number already exists, but ignore the current user's email and phone number
      const check = await prisma.admin_details.findFirst({
        where: {
          AND: [
            {
              id: {
                not: id,
              },
            },
            {
              OR: [
                {
                  emailid: emailid,
                },
                {
                  phone_no: phone_no,
                },
              ],
            },
          ],
        },
      });

      if (check) {
        return response.status(400).json({
          message: "Email or phone number already exists",
          success: false,
        });
      }

      const update = await prisma.admin_details.update({
        where: { id: id },
        data: {
          emailid: emailid,
          phone_no: phone_no,
          modified_date: new Date(),
          user_access,
        },
      });

      return response.status(200).json({
        success: true,
        error: false,
        message: "Successfully updated",
      });
    } else {
      logger.error("id is undefined in editUser api");
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-editUser api`
    );
    response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const admprofile = async (request, response) => {
  try {
    const id = request.body.id;
    if (id) {
      const find = await prisma.admin_details.findUnique({
        where: {
          id: id,
        },
      });
      if (find) {
        return response.status(200).json({
          success: true,
          data: find,
          error: false,
        });
      } else {
        return response.status(400).json({
          success: false,
          message: "Lab not found",
          error: true,
        });
      }
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in admprofile api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getadmins = async (request, response) => {
  try {
    const all = await prisma.admin_details.findMany();
    if (all) {
      return response.status(200).json({
        data: all,
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in getadmins api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const deleteadmin = async (request, response) => {
  try {
    const { id } = request.body.id;
    const del = await prisma.admin_details.update({
      where: {
        id: id,
      },
      data: {
        is_active: "N",
      },
    });
    if (del) {
      return response.status(200).json({
        message: "Succesfully deleted",
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in getadmins api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const forgotPwd = async (request, response) => {
  const { email } = request.body;
  console.log({ email });

  try {
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

    const user = await prisma.admin_details.findFirst({ where: { email } });

    console.log({ user });

    if (!user) {
      return response
        .status(404)
        .json({ error: true, message: "User not found" });
    }

    const otp = generateOTP();

    await sendOTPByEmail(user.name, email, otp);

    return response.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId: user.user_id,
      otp: otp,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-forgotPwd  api`
    );
    return response
      .status(500)
      .json({ error: true, message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const resetpassword = async (request, response) => {
  console.log("restttt", request.body);
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

    const admin = await prisma.admin_details.findFirst({ where: { email } });
    if (!admin) {
      return response
        .status(404)
        .json({ error: true, message: "User not found!" });
    }

    const hashedPassword = await bcrypt.hash(password, 5);
    // Update the password for the found user
    const updatedUser = await prisma.admin_details.update({
      where: {
        email: email,
        id: admin?.id,
      },
      data: { password: hashedPassword },
    });

    if (updatedUser) {
      return response.status(200).json({
        success: true,
        message: "Password reset successful",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-resetpassword api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const editcategory = async (request, response) => {
  console.log("editcategoryyy", request.body);
  try {
    const { main_type, type, department, services, features } = request.body;
    if (!main_type) {
      return response.status(400).json({
        error: true,
        message: "main type can't be null",
      });
    }

    if (
      (main_type === "Doctor" || main_type === "Hospital") &&
      type &&
      department
    ) {
      console.log("workkkkkkkkkkk");
      // Search in doctor_details table
      const doctorDetails = await prisma.doctor_details.findMany({
        where: {
          specialization: {
            equals: department.trim(),
            mode: "insensitive",
          },
          type: {
            equals: type.trim(),
            mode: "insensitive",
          },
        },
      });

      // Search in hospital_details table
      const hospitalDetails = await prisma.hospital_details.findMany({
        where: {
          type: {
            equals: type.trim(),
            mode: "insensitive",
          },
        },
      });

      let hospitalExists = false;
      for (const hospital of hospitalDetails) {
        if (
          hospital.type === type &&
          hospital.speciality.includes(department)
        ) {
          hospitalExists = true;
          break;
        }
      }

      if (doctorDetails.length > 0 || hospitalExists) {
        return response.status(400).json({
          message: `Can't delete or edit because ${
            doctorDetails.length > 0 ? "doctor" : "hospital"
          } exists for this department`,
          success: false,
        });
      } else {
        return response.status(200).json({
          message: "You can proceed with editing.",
          success: true,
        });
      }
    } else if (main_type === "Hospital" && features) {
      const allHospitals = await prisma.hospital_details.findMany();
      let hospitalExists = false;
      for (const hospital of allHospitals) {
        if (hospital?.feature?.includes(features)) {
          hospitalExists = true;
          break;
        }
      }
      if (hospitalExists) {
        return response.status(400).json({
          message:
            "Can't delete or edit because hospital exists for this feature",
          success: false,
        });
      } else {
        return response.status(200).json({
          message: "You can proceed with editing.",
          success: true,
        });
      }
    } else if (main_type === "Laboratory" && services) {
      const alllabs = await prisma.lab_details.findMany();
      let labExists = false;
      for (const lab of alllabs) {
        if (lab?.services?.includes(services)) {
          labExists = true;
          break;
        }
      }
      if (labExists) {
        return response.status(400).json({
          message: "Can't delete or edit because lab exists for this service",
          success: false,
        });
      } else {
        return response.status(200).json({
          message: "You can proceed with editing.",
          success: true,
        });
      }
    } else if (main_type === "Laboratory" && features) {
      const alllabs = await prisma.lab_details.findMany();
      let labExists = false;
      for (const lab of alllabs) {
        if (lab?.features?.includes(features)) {
          labExists = true;
          break;
        }
      }
      if (labExists) {
        return response.status(400).json({
          message: "Can't delete or edit because lab exists for this feature",
          success: false,
        });
      } else {
        return response.status(200).json({
          message: "You can proceed with editing.",
          success: true,
        });
      }
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid type.",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-editcategory api`
    );
    return response.status(500).json({
      error: true,
      message: "Internal server error.",
    });
  }
};

const addcategory = async (request, response) => {
  console.log("reeeeeeeeeee", request.body);
  try {
    const { main_type, type, department, services, features } = request.body;
    const datetime = getCurrentDateInIST();
    // Validate the required field
    if (!main_type) {
      return response.status(400).json({
        error: true,
        message: "main type can't be null",
      });
    }

    let conditions = [];
    if (main_type) {
    }

    if (type) {
      conditions.push({ type });
    }

    if (services) {
      conditions.push({ services: { array_contains: services } });
    }

    if (features) {
      conditions.push({ features: { array_contains: features } });
    }

    // Check for existing category based on the given conditions
    const check = await prisma.categoryManager.findMany({
      where: {
        // main_type:main_type,
        AND: conditions,
      },
    });

    // Update logic if a matching record is found
    if (check.length > 0) {
      const update = await prisma.categoryManager.updateMany({
        where: {
          main_type: main_type,
          AND: conditions,
        },
        data: {
          type,
          department,
          services,
          features,
          modified_date: datetime, // Assuming there's a modified_date field to track updates
        },
      });
      if (update.count > 0) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category updated successfully",
        });
      }
    } else if (main_type && !type) {
      // Create new category if no matching record is found
      const add = await prisma.categoryManager.updateMany({
        where: {
          main_type: main_type,
        },
        data: {
          type,
          department: department,
          services,
          features,
          created_date: datetime,
        },
      });

      if (add) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category updated successfully",
        });
      }
    } else {
      const update = await prisma.categoryManager.updateMany({
        where: {
          AND: conditions,
        },
        data: {
          type,
          department,
          services,
          features,
          modified_date: datetime,
        },
      });
      if (update) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category updated successfully",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-addcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const get_category = async (request, response) => {
  try {
    const get = await prisma.categoryManager.findMany();
    if (get.length > 0) {
      const groupedData = get.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = [];
        }
        if (item.department) {
          acc[item.type].push(...item.department);
        }
        return acc;
      }, {});

      // Transform the grouped data into the desired format
      const transformedData = Object.keys(groupedData).map((type) => ({
        type: type, // Include main_type as heading
        department: groupedData[type],
      }));

      // Extract all types
      let allTypes = Object.keys(groupedData);
      allTypes = allTypes.filter((allType, index) => allType !== "null");

      // Check if transformedData and allTypes are not null or empty arrays
      const responseData = {};
      if (transformedData.length > 0) {
        responseData.transformedData = transformedData;
      }
      if (allTypes.length > 0) {
        allTypes.sort((a, b) => a.localeCompare(b));
        responseData.allTypes = allTypes;
      }

      // Include the original data with main_type as heading
      responseData.originalData = get.map((item) => ({
        [item.main_type]: item,
      }));

      return response.status(200).json({
        data: responseData,
      });
    } else {
      // If no data found, return an empty object
      return response.status(200).json({
        data: {},
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-get_category API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getAllTypesAndCategories = async (request, response) => {
  try {
    //get All Data
    const allData = await prisma.categoryManager.findMany();
    // console.log({ allData });
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

    const laboratory = allData.find((ele) => ele.main_type === "Laboratory");
    const hospital = allData.find((ele) => ele.main_type === "Hospital");
    const laboratoryFeatures = laboratory?.features;
    const laboratoryServices = laboratory?.services;
    const hospitalFeatures = hospital?.features;

    response.status(200).json({
      success: true,
      error: false,
      message: "sucessfully fetched data",
      types,
      allopathySpecs,
      ayurvedicSpecs,
      homeopathySpecs,
      OtherSpecs,
      hospitalFeatures,
      laboratoryFeatures,
      laboratoryServices,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-getAllTypesAndCategories API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const alltypefeedback = async (request, response) => {
  console.log("typppfeedddddddd");
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const [doctorfeedback, hospitalfeedback, labfeedback] = await Promise.all([
      prisma.doctor_feedback.findMany({
        where: {
          status: "requested",
        },
        orderBy: {
          created_date: "desc",
        },
        select: {
          id: true,
          created_date: true,
          message: true,
          rating: true,
          doctorid: {
            select: { name: true },
          },
          userid: {
            select: { name: true },
          },
        },
      }),
      prisma.hospital_feedback.findMany({
        where: {
          status: "requested",
        },
        orderBy: {
          created_date: "desc",
        },
        select: {
          id: true,
          created_date: true,
          message: true,
          rating: true,
          hospitalid: {
            select: { name: true },
          },
          userid: {
            select: { name: true },
          },
        },
      }),
      prisma.lab_feedback.findMany({
        where: {
          status: "requested",
        },
        orderBy: {
          created_date: "desc",
        },
        select: {
          id: true,
          created_date: true,
          message: true,
          rating: true,
          labid: {
            select: { name: true },
          },
          userid: {
            select: { name: true },
          },
        },
      }),
    ]);
    // console.log({ doctorfeedback });
    const allFeedback = [
      ...doctorfeedback.map((feedback) => ({
        ...feedback,
        type: "Doctor",
        typename: feedback?.doctorid?.name,
        username: safeDecrypt(feedback?.userid?.name),
      })),
      ...hospitalfeedback.map((feedback) => ({
        ...feedback,
        type: "Hospital",
        typename: feedback?.hospitalid?.name,
        username: safeDecrypt(feedback?.userid?.name),
      })),
      ...labfeedback.map((feedback) => ({
        ...feedback,
        type: "Lab",
        typename: feedback?.labid?.name,
        username: safeDecrypt(feedback?.userid?.name),
      })),
    ];

    allFeedback.sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );

    response.status(200).json({
      success: true,
      message: "success",
      data: allFeedback,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-profilecompleted API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const feedbackapproval = async (req, res) => {
  const { id, status, type } = req.body;
  const datetime = getCurrentDateInIST();

  try {
    if (!id || !status || !type) {
      return res.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }
    let updatedFeedback;

    if (type === "Doctor") {
      updatedFeedback = await prisma.doctor_feedback.update({
        where: { id: id },
        data: { status: status, modified_date: datetime },
      });
    } else if (type === "Lab") {
      updatedFeedback = await prisma.lab_feedback.update({
        where: { id: id },
        data: { status: status, modified_date: datetime },
      });
    } else if (type === "Hospital") {
      updatedFeedback = await prisma.hospital_feedback.update({
        where: { id: id },
        data: { status: status, modified_date: datetime },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type provided",
      });
    }

    if (updatedFeedback) {
      return res.status(200).json({
        success: true,
        message: `Successfully ${status} the request`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-feedbackapproval API`
    );
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//count of total doctors,disabled doctors,pending doctors and active doctors for drs,lab & hospital

const totalCount = async (request, response) => {
  console.log("bodddddddd", request.body);
  const type = request.body.type;

  try {
    const [
      drpendingCount,
      dractiveCount,
      drdisabledCount,
      drallCount,
      labpendingCount,
      labactiveCount,
      labdisabledCount,
      laballCount,
      hspendingCount,
      hsactiveCount,
      hsdisabledCount,
      hsallCount,
    ] = await Promise.all([
      prisma.doctor_details.count({
        where: {
          OR: [{ status: "P" }, { status: null }],
        },
      }),
      prisma.doctor_details.count({
        where: {
          status: "Y",
        },
      }),
      prisma.doctor_details.count({
        where: {
          status: "N",
        },
      }),
      prisma.doctor_details.count(),
      prisma.lab_details.count({
        where: {
          OR: [{ status: "P" }, { status: null }],
        },
      }),
      prisma.lab_details.count({
        where: {
          status: "Y",
        },
      }),
      prisma.lab_details.count({
        where: {
          status: "N",
        },
      }),
      prisma.lab_details.count(),
      prisma.hospital_details.count({
        where: {
          OR: [{ status: "P" }, { status: null }],
        },
      }),
      prisma.hospital_details.count({
        where: {
          status: "Y",
        },
      }),
      prisma.hospital_details.count({
        where: {
          status: "N",
        },
      }),
      prisma.hospital_details.count(),
    ]);

    if (type === "Doctor") {
      return response.status(200).json({
        alldoctors: drallCount,
        pendingdoctors: drpendingCount,
        disableddoctors: drdisabledCount,
        activedoctors: dractiveCount,
        success: true,
        message: "success",
      });
    } else if (type === "Lab") {
      return response.status(200).json({
        alllabs: laballCount,
        pendinglabs: labpendingCount,
        disabledlabs: labdisabledCount,
        activelabs: labactiveCount,
        success: true,
        message: "success",
      });
    } else if (type === "Hospital") {
      return response.status(200).json({
        allhospitals: hsallCount,
        pendinghospitals: hspendingCount,
        disabledhospitals: hsdisabledCount,
        activehospitals: hsactiveCount,
        success: true,
        message: "success",
      });
    } else if (type === "all") {
      return response.status(200).json({
        all: laballCount + drallCount + hsallCount,
        pending: labpendingCount + drpendingCount + hspendingCount,
        disabled: labdisabledCount + drdisabledCount + hsdisabledCount,
        active: labactiveCount + dractiveCount + hsactiveCount,
        success: true,
        message: "success",
      });
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid type provided",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-totalCount API`
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

const messagesave = async (request, response) => {
  console.log("heyy", request.body);
  const datetime = getCurrentDateInIST();
  try {
    const { name, contact_number, type } = request.body;
    // const mobileNumber = contact_number;
    // if (validateMobileNumber(mobileNumber)) {
    //   console.log('Valid mobile number');
    // } else {
    //   console.log('Invalid mobile number');
    //   const resptext = "Invalid mobile number"
    //   return response.status(401).json({
    //     error: true,
    //     success: false,
    //     message: resptext
    //   })
    // }
    // function validateMobileNumber(mobileNumber) {
    //   // Regular expression for a valid 10-digit Indian mobile number
    //   const mobileNumberRegex = /^[6-9]\d{9}$/;
    //   return mobileNumberRegex.test(mobileNumber);
    // }
    if (!name || !contact_number || !type) {
      return response.status(400).json({
        message: "required fields can't be null",
      });
    }
    const check = await prisma.chat_data.findFirst({
      where: {
        type: {
          mode: "insensitive",
          equals: type,
        },
        contact_no: {
          mode: "insensitive",
          equals: contact_number.toString(),
        },
      },
    });
    if (check) {
      response.status(200).json({
        message: "Success",
        success: true,
      });
    } else {
      const adddata = await prisma.chat_data.create({
        data: {
          name: name,
          contact_no: contact_number.toString(),
          created_date: datetime,
          type: type,
        },
      });
      console.log({ adddata });
      if (adddata) {
        response.status(200).json({
          success: true,
        });
      } else {
        response.status(500).json({
          error: true,
          message: "Error occured",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-messagesave api`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getchatdata = async (request, response) => {
  try {
    const getdata = await prisma.chat_data.find();
    if (getdata.length > 0) {
      return response.status(200).json({
        success: true,
        data: getdata,
      });
    } else {
      return response.status(204).json({
        success: false,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-getchatdata api`
    );
    response.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
//admin get all details of health partners
const getalldatas = async (request, response) => {
  try {
    const secretKey = process.env.ENCRYPTION_KEY;
    // Helper function to handle decryption with fallback
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const { type } = request.body;
    if (type == "Doctor") {
      const decrypted_data = await prisma.doctor_details.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          pincode: true,
          gender:true,
          email: true,
          specialization: true,
          datetime: true,
          status: true,
          phone_no: true,
          registration_no: true,
          interacteduser: true,
          phone_office: true,
          education_qualification: true,
          additional_qualification: true,
          additional_speciality: true,
          experience: true,
          second_name: true,
          sector: true,
          about: true,
          type: true,
          phone_office: true,
          address: true,
        },
      });

      const complete_data = decrypted_data.map((doctor) => {
        const consult_count = doctor.interacteduser.filter(
          (interaction) => interaction.consultcount
        ).length;
        const view_count = doctor.interacteduser.filter(
          (interaction) => interaction.viewcount
        ).length;
        return {
          ...doctor,
          email: safeDecrypt(doctor.email, secretKey),
          phone_no: safeDecrypt(doctor.phone_no, secretKey),
          registration_no: safeDecrypt(doctor.registration_no, secretKey),
          consult_count,
          view_count,
        };
      });

      response.status(200).json({
        error: false,
        success: true,
        message: "successful",
        data: complete_data,
      });
    } else if (type == "Hospital") {
      const decrypted_data = await prisma.hospital_details.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          pincode: true,
          speciality: true,
          type: true,
          email: true,
          feature: true,
          datetime: true,
          about: true,
          status: true,
          contact_no: true,
          interacteduser: true,
          photo: true,
        },
      });
      if (decrypted_data.length > 0) {
        const complete_data = decrypted_data.map((hospital) => {
          const consult_count = hospital.interacteduser.filter(
            (interaction) => interaction.consultcount
          ).length;
          const view_count = hospital.interacteduser.filter(
            (interaction) => interaction.viewcount
          ).length;
          return {
            ...hospital,
            consult_count,
            view_count,
          };
        });
        response.status(200).json({
          success: true,
          data: complete_data,
        });
      } else {
        response.status(204).json({
          error: true,
          message: "No Data",
        });
      }
    } else if (type == "Lab") {
      const decrypted_data = await prisma.lab_details.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          pincode: true,
          services: true,
          features: true,
          datetime: true,
          status: true,
          phone_no: true,
          address: true,
          interacteduser: true,
          about: true,
          email: true,
          timing: true,
        },
      });
      if (decrypted_data.length > 0) {
        const complete_data = decrypted_data.map((lab) => {
          const consult_count = lab.interacteduser.filter(
            (interaction) => interaction.consultcount
          ).length;
          const view_count = lab.interacteduser.filter(
            (interaction) => interaction.viewcount
          ).length;
          return {
            ...lab,
            consult_count,
            view_count,
          };
        });
        response.status(200).json({
          success: true,
          data: complete_data,
        });
      } else {
        response.status(204).json({
          error: true,
          message: "No Data",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in admin-getalldatas API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  addcategory,
  adminLogin,
  editadmin,
  admprofile,
  getadmins,
  deleteadmin,
  get_category,
  addadmin,
  forgotPwd,
  resetpassword,
  editcategory,
  getAllTypesAndCategories,
  alltypefeedback,
  feedbackapproval,
  totalCount,
  messagesave,
  getchatdata,
  getalldatas,
};
