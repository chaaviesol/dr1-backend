const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const currentDate = new Date();
const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);
const { encrypt, decrypt } = require("../../utils");
const winston = require("winston");
const fs = require("fs");
const { response } = require("express");
const logDirectory = "./logs";
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

const addlab = async (req, response) => {
  try {
    const lab_imageLink = req.files;
    const {
      name,
      contact_no,
      address,
      pincode,
      timing,
      lisence_no,
      email,
      password,
      status,
      rating,
      photo,
      about,
      featured_partner,
      Services,
      features,
    } = JSON.parse(req.body.data);
    if (
      (name &&
        contact_no &&
        address &&
        pincode &&
        timing &&
        lisence_no &&
        email &&
        password &&
        rating &&
        photo &&
        about,
      Services,
      features)
    ) {
      // Validate mobile number
      const mobileNumber = contact_no;
      if (validateMobileNumber(mobileNumber)) {
        console.log("Valid mobile number");
      } else {
        console.log("Invalid mobile number");
        const resptext = "Invalid mobile number";
        return response.status(404).json({
          error: true,
          message: resptext,
        });
      }

      // Function to validate mobile number
      function validateMobileNumber(mobileNumber) {
        // Regular expression for a valid 10-digit Indian mobile number
        const mobileNumberRegex = /^[6-9]\d{9}$/;
        return mobileNumberRegex.test(mobileNumber);
      }

      // Validate email address
      const email_id = email;
      if (validateEmail(email_id)) {
        console.log("Valid email address");
      } else {
        console.log("Invalid email address");
        const resptext = "Invalid email address";
        return response.status(404).json({
          error: true,
          message: resptext,
        });
      }

      function validateEmail(email_id) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email_id);
      }

      // Validate PIN code
      const pin = pincode;
      if (validatePin(pin)) {
        console.log("Valid PIN code");
      } else {
        const resptext = "Invalid PIN code";
        console.log("Invalid PIN code");
        return response.status(404).json({
          error: true,
          message: resptext,
        });
      }

      // Function to validate PIN code
      function validatePin(pin) {
        // Regular expression for PIN code validation (6 digits)
        const pinRegex = /^\d{6}$/;
        return pinRegex.test(pin);
      }

      let labImage = {};

      for (i = 0; i < lab_imageLink?.length; i++) {
        let keyName = `image${i + 1}`;

        labImage[keyName] = lab_imageLink[i].location;
      }
    
      const emaillower = email.toLowerCase();
      console.log({emaillower})
      // const lab = await prisma.lab_details.findMany({
      //   where: {
      //     OR: [{ email: email }, { phone_no: contact_no },{ license_no: lisence_no}],
      //   },
      // });
      // if (lab.length > 0) {
      //   const resptext = "Email or phone number already exists";
      //   return response.status(400).json({
      //     error: true,
      //     message: resptext,
      //   });
      // } else {
      // Check if email already exists
      const checkEmail = await prisma.lab_details.findFirst({
        where: { email: emaillower },
      });

      // Check if phone number already exists
      const checkPhoneNumber = await prisma.lab_details.findFirst({
        where: { phone_no: contact_no },
      });
      const checklicense_no = await prisma.lab_details.findFirst({
        where: { license_no: lisence_no },
      });
      if (checkEmail) {
        return response.status(400).json({
          message: "Email ID already exists",
          error: true,
        });
      }

      if (checkPhoneNumber) {
        return response.status(400).json({
          message: "Phone number already exists",
          error: true,
        });
      }
      if (checklicense_no) {
        return response.status(400).json({
          message: "license number already exists",
          error: true,
        });
      }
      // let servicesid = [];
      // for (let i = 0; i < Services.length; i++) {
      //     const servicesearch = await prisma.services.findMany({
      //         where: {
      //             service_name: Services[i],
      //             mode: "insensitive"
      //         }
      //     });
      //     // Assuming servicesearch returns an array of objects with 'id' property
      //     servicesid.push(...servicesearch.map(service => service.id));
      // }
      const hashedPass = await bcrypt.hash(password, 5);
      const create = await prisma.lab_details.create({
        data: {
          name: name,
          phone_no: contact_no,
          address: address,
          pincode: pincode,
          timing: timing,
          license_no: lisence_no,
          email: emaillower,
          password: hashedPass,
          status: status,
          rating: rating,
          photo: labImage,
          about: about,
          featured_partner: featured_partner,
          datetime: istDate,
          services: Services,
          features: features,
          status: "P",
        },
      });
      if (create) {
        const respText = "Laboratory successfully registered";
        // const add = await prisma.adm_notification.create({
        //   data: {
        //     sender: create?.id,
        //     type: "Laboratory",
        //     read: "N",
        //     text: "Laboratory successfully registered",
        //     created_date: istDate
        //   },
        // })
        response.status(201).json({
          message: respText,
          success: true,
          error: false,
        });
      }
      // }
    } else {
      response.status(404).json("All fields are mandatory");
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in addlab api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const labLogin = async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password required",
    });
  }
  try {
    const user = await prisma.lab_details.findFirst({
      where: { email: email },
    });
    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Incorrect Email or password!.",
      });
    }
    const logged_id = user.id;
    const hashedDbPassword = user.password;
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
        logged_id: logged_id,
      });
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in labLogin api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getlab = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      // console.error(
      //   `Decryption failed for text: ${text}. Error: ${err.message}`
      // );
      return text;
    }
  };
  try {
    const alldata = await prisma.lab_details.findMany({
      where: { OR: [{ status: "Y" }, { status: null }] },
      orderBy: {
        name: "asc",
      },
    });
    // const decrypted_data = alldata.map((lab) => {
    //   return {
    //     ...lab,
    //     email: safeDecrypt(lab.email, secretKey),
    //     phone_no: safeDecrypt(lab?.phone_no, secretKey),
    //     registration_no: safeDecrypt(lab.registration_no, secretKey),
    //   };
    // });
    response.status(200).json({
      success: true,
      error: false,
      data: alldata,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in getlab api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

//details of a lab
const getlabdetails = async (request, response) => {
  try {
    const id = request.body.id;
    console.log({ id });
    if (id) {
      const find = await prisma.lab_details.findUnique({
        where: {
          id: id,
        },
      });

      if (find) {
        const place=await prisma.pincode_data.findFirst({
          where:{
            pincode:parseInt(find?.pincode)
          }
        })
      
        let district=place?.district
        const result = {
          ...find,
          district: district, 
        };
        
        return response.status(200).json({
          success: true,
          data: result,
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
    logger.error(
      `Internal server error: ${error.message} in getlabdetails api`
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

const editlab = async (request, response) => {
  const id=request.user.userId
  console.log(request.body)
  try {
    const { name, timing, about, featured_partner, services, features } =
      request.body;

    if (id) {
      const update = await prisma.lab_details.updateMany({
        where: {
          id: id,
        },
        data: {
          name: name,
          timing: timing,
          // photo: photo,
          services: services,
          features: features,
          about: about,
          featured_partner: featured_partner,
        },
      });
      response.status(200).json({
        message: "successfully updated",
        success: true,
        error: false,
        data: update,
      });
    } else {
      return response.status(404).json({
        error: true,
        success: false,
        message: "Lab id can't be null",
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in editlab api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const deletelab = async (request, response) => {
  try {
    const id = request.body.id;
    if (id) {
      const del = await prisma.lab_details.update({
        where: {
          id: id,
        },
        data: {
          is_active: "N",
        },
      });
      response.status(200).json({
        success: true,
        error: false,
        data: del,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in deletelab api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

//filter lab by name
const filterlab = async (request, response) => {
  try {
    const { name, timing, status, rating } = request.body;
    let filterdata = {};
    if (name || timing || status || rating) {
      if (name) {
        filterdata.name = {
          contains: name,
          mode: "insensitive",
        };
      }

      if (timing) {
        filterdata.timing = {
          contains: timing,
          mode: "insensitive",
        };
      }

      if (status !== undefined) {
        filterdata.status = status;
      }

      if (rating !== undefined) {
        filterdata.rating = rating;
      }

      const filter = await prisma.lab_details.findFirst({
        where: filterdata,
      });
      response.status(200).json({
        success: true,
        error: false,
        data: filter,
      });
    } else {
      const filter = await prisma.lab_details.findMany();
      response.status(200).json({
        success: true,
        error: false,
        data: filter,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in filterlab api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const services = async (request, response) => {
  try {
    const services = request.body.services;
    if (services) {
      const createservices = await prisma.services.create({
        data: {
          service_name: services,
        },
      });
      response.status(200).json({
        message: "successfully created",
        success: true,
        error: false,
        data: createservices,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in services api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const get_labBypin = async (req, res) => {
  try {
    const { selectedArea_id } = req.body;

    const get_postalData = await prisma.pincode_data.findMany({
      where: {
        id: selectedArea_id,
      },
    });
    const result = get_postalData[0].pincode;

    const get_labDetails = await prisma.lab_details.findMany({
      where: {
        pincode: result.toString(),
      },
      orderBy: {
        name: "asc",
      },
    });
    let featured_partner = [];
    let not_featured_partner = [];
    if (get_labDetails.length > 0) {
      for (i = 0; i < get_labDetails.length; i++) {
        if (get_labDetails[i].featured_partner === true) {
          featured_partner.push(get_labDetails[i]);
        } else {
          not_featured_partner.push(get_labDetails[i]);
        }
      }
      return res.status(200).json({
        error: false,
        success: true,
        message: "successfull",
        data: [...featured_partner, ...not_featured_partner],
      });
    }
    let nearByData = [];
    let nearBy_notfeatured = [];
    let samePinData = [];
    let nearByData_featured = [];
    if (get_labDetails.length === 0) {
      let suggestedpincodes = [
        result - 1,
        result + 1,
        result - 2,
        result + 2,
        result - 3,
        result + 3,
        result - 4,
        result + 4,
      ];
      // for(let i=result-4; i<=result+4; i++){
      //     suggestedpincodes.push(i)
      // }

      for (i = 0; i < suggestedpincodes.length; i++) {
        const nearBypincode = await prisma.lab_details.findMany({
          where: {
            pincode: suggestedpincodes[i].toString(),
          },
          orderBy: {
            name: "asc",
          },
        });
        if (nearBypincode.length > 0) {
          for (j = 0; j < nearBypincode.length; j++) {
            if (nearBypincode[j].featured_partner === true) {
              nearByData.push(nearBypincode[j]);
            } else {
              nearBy_notfeatured.push(nearBypincode[j]);
            }
          }

          samePinData = [...nearByData, ...nearBy_notfeatured];

          for (k = 0; k < samePinData.length; k++) {
            nearByData_featured.push(samePinData[k]);
          }
          nearByData = [];
          nearBy_notfeatured = [];
        }
        //  ggg.push(samePinData)

        if (nearByData_featured.length > 0) {
          return res.status(200).json({
            error: false,
            success: true,
            message: "successfull",
            data: nearByData_featured,
          });
        } else {
          return res.status(400).json({
            error: true,
            success: false,
            message: "No data found",
          });
        }
      }
    }

    return res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: nearByData_featured,
    });
  } catch (err) {
    logger.error(`Internal server error: ${err.message} in get_labBypin api`);
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const labpriceadd = async (request, response) => {
  try {
    const { lab_id, data } = request.body;
    //eg:data:{
    //         "link":"imagelinkkkkkkkkk"}
    //}
    //    or eg:data:{
    //details:{"1sttest":"340","2ndtest":"460"}
    // }

    const update = await prisma.lab_details.update({
      where: {
        id: lab_id,
      },
      data: {
        data: data,
      },
    });
    if (update) {
      return response.status(200).json({
        message: "Successfully added",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in labpriceadd api`);
    response.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const lab_feedback = async (req, res) => {
  try {
    const { user_id, lab_id, message, rating, interactedid } = req.body;
    const status = "requested";
    if (!user_id || !lab_id) {
      return res.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }
    const update = await prisma.lab_interacteduser.update({
      where: {
        id: interactedid,
      },
      data: {
        status: "Y",
        st_modifiedDate: istDate,
      },
    });

    const create = await prisma.lab_feedback.create({
      data: {
        user_id,
        lab_id,
        message,
        rating,
        status: status,
        created_date: istDate,
      },
    });
    if (create) {
      res.status(201).json({
        error: false,
        message: "Successfully added your feedback",
        data: create,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in lab_feedback API`);
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const lab_searchdata = async (req, res) => {
  try {
    const { user_id, speciality, type } = req.body;

    // Input validation: check if at least speciality or type is provided
    if (!speciality && !type) {
      return res.status(400).json({
        error: true,
        message: "Either speciality or type must be provided",
      });
    }

    const create = await prisma.lab_searchdata.create({
      data: {
        user_id,
        speciality,
        type,
        created_date: istDate,
      },
    });
    if (create) {
      res.status(201).json({
        error: false,
        message: "successfull",
        data: create,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab_searchdata API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

///all feedback dataaa
const get_feedback = async (req, res) => {
  const id = req.body.id;
  try {
    const data = await prisma.lab_feedback.findMany({
      where: {
        id: id,
      },
      orderBy: {
        created_date: "desc",
      },
    });
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab get_feedback API`
    );
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//all lab searchdata
const get_searchdata = async (req, res) => {
  const id = req.body.id;
  try {
    const data = await prisma.lab_searchdata.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    res.status(200).json({ data: data, message: "success", success: true });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab get_searchdata API`
    );
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//a single lab feedback
const getalabfeedback = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const lab_id = req.body.lab_id;
  try {
    if (!lab_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "lab_id can't be null",
      });
    }
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const datas = await prisma.lab_feedback.findMany({
      where: {
        lab_id,
        status: "accepted",
      },
      orderBy: {
        created_date: "desc",
      },
      select: {
        message: true,
        userid: {
          select: {
            name: true,
          },
        },
        rating: true,
        created_date: true,
      },
    });

    const data = datas.map((feedback) => {
      return {
        ...feedback,
        userid: {
          ...feedback.userid,
          name: safeDecrypt(feedback.userid.name, secretKey),
        },
      };
    });
    console.log("datas========", datas[0]?.userid);
    // Calculate the sum and average of the ratings
    const totalRatings = datas.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    const averageRating = datas.length > 0 ? totalRatings / datas.length : 0;

    res.status(200).json({
      success: true,
      data: data,
      averageRating: averageRating,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getalabfeedback API`
    );
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//approve or reject lab feedback
const feedbackapproval = async (req, res) => {
  const { id, status } = req.body;

  try {
    // Update the status of the doctor_feedback entry with the provided id
    const updatedFeedback = await prisma.lab_feedback.update({
      where: { id: id },
      data: { status: status },
    });

    if (updatedFeedback) {
      res.status(200).json({
        success: true,
        message: `successfully ${status} the request`,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab feedbackapproval API`
    );
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const lab_disable = async (request, response) => {
  const usertype = request.user.userType;
  console.log("object", usertype);
  try {
    const { id, type, status } = request.body;
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    if (id && status) {
      const disable = await prisma.lab_details.update({
        where: {
          id: id,
        },
        data: {
          status: status,
          updatedDate: istDate,
        },
      });
      let newstatus;
      if (status === "Y") {
        newstatus = "approved";
      } else if (status === "N") {
        newstatus = "disabled";
      }
      response.status(200).json({
        success: true,
        message: `Laboratory ${newstatus} successfully.`,
      });
    } else if ((type = "all")) {
      // Calculate the date 6 months ago
      const sixMonthsAgo = new Date(istDate);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const inactive = await prisma.lab_details.findMany({
        where: {
          last_active: {
            lt: sixMonthsAgo,
          },
        },
        orderBy: {
          datetime: "asc",
        },
      });

      // const allDoctors = await prisma.hospital_details.findMany();

      // if (allDoctors.length > 0) {
      //   for (const doctor of allDoctors) {
      //     // Assuming last_active is stored as a Date object in the database
      //     if (new Date(doctor.last_active) < sixMonthsAgo) {

      //     }
      //   }
      // }

      response.status(200).json({
        sucess: true,
        data: inactive,
      });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in lab_disable API`);
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getunapprovelab = async (request, response) => {
  try {
    const complete_data = await prisma.lab_details.findMany({
      where: {
        OR: [{ status: "P" }, { status: null }],
      },
      orderBy: {
        datetime: "asc",
      },
    });
    if (complete_data.length > 0) {
      response.status(200).json({
        success: true,
        data: complete_data,
      });
    } else {
      response.status(400).json({
        error: true,
        message: "No Data",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getunapprovelab API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const approvelab = async (request, response) => {
  try {
    const { id, status } = request.body;
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);

    if (!id) {
      return response.status(400).json({ message: "Lab ID is required." });
    }

    if (status !== "Y" && status !== "N" && status !== "R") {
      return response.status(400).json({ message: "Invalid status value." });
    }

    const lab = await prisma.lab_details.update({
      where: { id: id },
      data: { status: status, updatedDate: istDate },
    });

    if (lab) {
      let message;
      if (status === "Y") {
        message = "Laboratory Approved.";
      } else if (status === "N") {
        message = "Laboratory Disabled.";
      } else {
        message = "Laboratory Rejected.";
      }
      response.status(200).json({ message: message });
    } else {
      response.status(404).json({ message: "Lab not found." });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in approvelab API`);
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

// const completeedit = async (req, res) => {
//   // const secretKey = process.env.ENCRYPTION_KEY;

//   const currentDate = new Date();
//   const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
//   const istDate = new Date(currentDate.getTime() + istOffset);

//   try {
//     const {
//       lab_id,
//       name,
//       contact_no,
//       address,
//       pincode,
//       timing,
//       lisence_no,
//       email,
//       password,
//       status,
//       rating,
//       photo,
//       about,
//       featured_partner,
//       Services,
//       features,
//     } = req.body;

//     if (!lab_id) {
//       return res.status(400).json({
//         message: "Laboratory ID is required",
//         error: true,
//       });
//     }

//     // Validation functions
//     const validateMobileNumber = (mobileNumber) => {
//       const mobileNumberRegex = /^[6-9]\d{9}$/;
//       return mobileNumberRegex.test(mobileNumber);
//     };

//     const validateEmail = (email_id) => {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       return emailRegex.test(email_id);
//     };

//     // Check for email, phone, or lisence number changes
//     let updateFields = [];

//     if (contact_no) {
//       if (!validateMobileNumber(contact_no)) {
//         return res.status(400).json({
//           message: "Invalid mobile number",
//           error: true,
//         });
//       }
//       updateFields.push("contact_no");
//     }

//     if (email) {
//       if (!validateEmail(email)) {
//         return res.status(400).json({
//           message: "Invalid email address",
//           error: true,
//         });
//       }
//       updateFields.push("email");
//     }

//     if (email || contact_no || lisence_no) {
//       const labs = await prisma.lab_details.findMany({
//         where: {
//           OR: [
//             { email: email },
//             { contact_no: contact_no },
//             { lisence_no: lisence_no },
//           ],
//         },
//       });

//       if (labs.length > 0) {
//         return res.status(400).json({
//           error: true,
//           message: "Email, phone number, or lisence number already exists",
//           success: false,
//         });
//       }
//     }

//     const updateData = {
//       name,
//       contact_no,
//       address,
//       pincode,
//       timing,
//       lisence_no,
//       email,
//       // password,
//       status,
//       rating,
//       photo,
//       about,
//       featured_partner,
//       Services,
//       features,
//       updatedDate: istDate,
//     };

//     // Remove undefined fields from updateData
//     Object.keys(updateData).forEach(
//       (key) => updateData[key] === undefined && delete updateData[key]
//     );

//     const edited_data = await prisma.lab_details.update({
//       where: { id: lab_id },
//       data: updateData,
//     });

//     if (edited_data) {
//       const text = `Successfully updated your ${updateFields.join(", ")}.`;
//       await prisma.adm_notification.create({
//         data: {
//           sender: lab_id,
//           type: "Laboratory",
//           read: "N",
//           text: text,
//           created_date: istDate,
//         },
//       });
//       return res.status(200).json({
//         error: false,
//         success: true,
//         message: "Successfully edited the details",
//         data: edited_data,
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in lab completeedit API`
//     );
//     console.error(error);
//     return res.status(500).json({
//       error: true,
//       message: "Internal Server Error",
//     });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const completeedit = async (req, res) => {
  // const secretKey = process.env.ENCRYPTION_KEY;

  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  try {
    const {
      id,
      name,
      phone_no,
      address,
      pincode,
      timing,
      license_no,
      email,
      password,
      status,
      rating,
      photo,
      about,
      featured_partner,
      services,
      features,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Laboratory ID is required",
        error: true,
      });
    }

    const findlab = await prisma.lab_details.findFirst({
      where: { id: id },
    });

    if (!findlab) {
      return res.status(404).json({
        message: "Laboratory not found",
        error: true,
      });
    }

    // Validation functions
    const validateMobileNumber = (mobileNumber) => {
      const mobileNumberRegex = /^[6-9]\d{9}$/;
      return mobileNumberRegex.test(mobileNumber);
    };

    const validateEmail = (email_id) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email_id);
    };

    // Check for email, phone, or license number changes
    let updateFields = [];

    const checkChanges = (field, newValue) => {
      if (newValue && findlab[field] !== newValue) {
        updateFields.push(field);
        return newValue;
      }
      return findlab[field];
    };

    let skipEmailCheck = findlab.email === email;
    let skipPhoneCheck = findlab.phone_no === phone_no;
    let skipLicenseCheck = findlab.license_no === license_no;

    if (!skipPhoneCheck && phone_no) {
      if (!validateMobileNumber(phone_no)) {
        return res.status(400).json({
          message: "Invalid mobile number",
          error: true,
        });
      }
    }

    if (!skipEmailCheck && email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          message: "Invalid email address",
          error: true,
        });
      }
    }

    if (
      (!skipEmailCheck && email) ||
      (!skipPhoneCheck && phone_no) ||
      (!skipLicenseCheck && license_no)
    ) {
      const labs = await prisma.lab_details.findMany({
        where: {
          OR: [
            { email: !skipEmailCheck ? email : undefined },
            { phone_no: !skipPhoneCheck ? phone_no : undefined },
            { license_no: !skipLicenseCheck ? license_no : undefined },
          ],
        },
      });

      if (labs.length > 0) {
        return res.status(400).json({
          error: true,
          message: "Email, phone number, or license number already exists",
          success: false,
        });
      }
    }

    const updateData = {
      name: checkChanges("name", name),
      phone_no: checkChanges("phone number", phone_no),
      address: checkChanges("address", address),
      pincode: checkChanges("pincode", pincode),
      timing: checkChanges("timing", timing),
      license_no: checkChanges("license number", license_no),
      email: checkChanges("email", email),
      // password: checkChanges('password', password), // Uncomment and handle password hashing if needed
      status: checkChanges("status", status),
      rating: checkChanges("rating", rating),
      photo: checkChanges("photo", photo),
      about: checkChanges("about", about),
      featured_partner: checkChanges("featured partner", featured_partner),
      services: checkChanges("services", services),
      features: checkChanges("features", features),
      updatedDate: istDate,
    };

    // Remove undefined fields from updateData
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const edited_data = await prisma.lab_details.update({
      where: { id: id },
      data: updateData,
    });

    if (edited_data && updateFields.length > 0) {
      const text = `Successfully updated your ${updateFields.join(", ")}.`;
      await prisma.adm_notification.create({
        data: {
          sender: id,
          type: "Laboratory",
          read: "N",
          text: text,
          created_date: istDate,
        },
      });
      return res.status(200).json({
        error: false,
        success: true,
        message: "Successfully edited the details",
        data: edited_data,
      });
    } else {
      return res.status(400).json({
        error: true,
        success: false,
        message: "No Data to update",
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in lab completeedit API`
    );
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  addlab,
  labLogin,
  getlab,
  editlab,
  deletelab,
  filterlab,
  services,
  get_labBypin,
  getlabdetails,
  labpriceadd,
  lab_feedback,
  lab_searchdata,
  get_feedback,
  get_searchdata,
  getalabfeedback,
  feedbackapproval,
  lab_disable,
  getunapprovelab,
  approvelab,
  completeedit,
};
