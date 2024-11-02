const {
  encrypt,
  getCurrentDateInIST,
  decrypt,
  istDate,
  logger,
  prisma,
} = require("../../utils");
const bcrypt = require("bcrypt");
require("dotenv").config();
const nodemailer = require("nodemailer");

const doctor_registration = async (req, res) => {
  const {
    name,
    second_name,
    phone,
    email,
    password,
    image,
    qualification,
    additional_qualification,
    specialization,
    additional_speciality,
    type,
    gender,
    address,
    experience,
    about,
    registration_no,
    pincode,
    sector,
    phone_office,
    query,
    expert_opinion,
    video_consultaion,
  } = JSON.parse(req.body.data);
  const datetime = getCurrentDateInIST();
  const secretKey = process.env.ENCRYPTION_KEY;
  const dr_imageLink = req.file?.location;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const is_query = query ? query : false;
    const is_expert_opinion = expert_opinion ? expert_opinion : false;
    const is_video_consultaion = video_consultaion ? video_consultaion : false;
    if (
      !name ||
      !phone ||
      !email ||
      !password ||
      !qualification ||
      !specialization ||
      !type ||
      !gender ||
      !experience ||
      !pincode ||
      !registration_no
    ) {
      return res.status(400).json({
        message: "all fields are required",
        error: true,
      });
    }

    const capitalizeFirstLetter = (string) => {
      const prefix = "Dr.";
      const nameWithoutPrefix = string.startsWith(prefix)
        ? string.slice(prefix.length)
        : string;
      return (
        prefix +
        nameWithoutPrefix.charAt(0).toUpperCase() +
        nameWithoutPrefix.slice(1)
      );
    };

    const mobileNumber = phone;
    if (validateMobileNumber(mobileNumber)) {
    } else {
      const resptext = "Invalid mobile number";
      return res.send(resptext);
    }
    function validateMobileNumber(mobileNumber) {
      // Regular expression for a valid 10-digit Indian mobile number
      const mobileNumberRegex = /^[6-9]\d{9}$/;
      return mobileNumberRegex.test(mobileNumber);
    }
    const email_id = email;
    if (validateEmail(email_id)) {
    } else {
      const resptext = "Invalid email address";
      return res.send(resptext);
    }
    function validateEmail(email_id) {
      // Regular expression for a simple email validation
      // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailRegex = /^[^\s@]+/;

      return emailRegex.test(email_id);
    }
    const emaillower = email.toLowerCase();
    const existingDoctor = await prisma.doctor_details.findFirst({
      where: {
        email: emaillower,
      },
    });

    if (existingDoctor) {
      return res.status(400).json({
        error: true,
        message: "Email already exists",
        success: false,
      });
    }

    const doctors = await prisma.doctor_details.findMany();

    for (const doctor of doctors) {
      const decryptedPhone = safeDecrypt(doctor.phone_no, secretKey);
      const decryptedregistration_no = safeDecrypt(
        doctor.registration_no,
        secretKey
      );
      if (decryptedPhone === phone) {
        return res.status(400).json({
          error: true,
          message: "Phone number already exists",
          success: false,
        });
      } else if (decryptedregistration_no == registration_no) {
        return res.status(400).json({
          error: true,
          message: "Register number already exists",
          success: false,
        });
      }
      // Perform the search using the decrypted email and phone number
      // Example:
      // const user = await prisma.doctor_details.findFirst({
      //   where: {
      //     OR: [{ email: decryptedEmail }, { phone_no: decryptedPhone }],
      //   },
      // });
    }

    const capitalised_name = capitalizeFirstLetter(name);
    const hashedpassword = await bcrypt.hash(password, 10);
    // Encrypting phone, email, and registration number
    const encryptedPhone = encrypt(phone, secretKey);
    // const encryptedEmail = encrypt(email, secretKey);
    const encryptedRegistrationNo = encrypt(registration_no, secretKey);

    const registration_data = await prisma.doctor_details.create({
      data: {
        name: capitalised_name,
        second_name: second_name,
        phone_no: encryptedPhone,
        email: emaillower,
        password: hashedpassword,
        image: dr_imageLink,
        education_qualification: qualification,
        additional_qualification: additional_qualification,
        specialization: specialization,
        additional_speciality: additional_speciality,
        type: type,
        gender: gender,
        address: address,
        // status:status,
        experience: parseInt(experience),
        about: about,
        registration_no: encryptedRegistrationNo,
        datetime: datetime,
        pincode: parseInt(pincode),
        sector: sector,
        phone_office: phone_office,
        status: "P",
        query: is_query,
        expert_opinion: is_expert_opinion,
        video_consultaion: is_video_consultaion,
      },
    });
    const add = await prisma.type_notification.create({
      data: {
        receiver_id: registration_data?.id,
        category: "Doctor",
        read: "N",
        text: "Your profile has been successfully registered",
        created_date: datetime,
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfully registered",
      data: registration_data,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor-doctor_registration API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//login for doctors
const doctor_login = async (req, res) => {
  const { userid, password } = req.body;
  const secretKey = process.env.ENCRYPTION_KEY;

  if (!userid || !password) {
    return res.status(400).json({
      error: true,
      message: "User ID and password are required",
    });
  }

  try {
    let user;
    let identifier;

    const emailformat = /^[^\s@]+@gmail\.com$/.test(userid);
    if (emailformat) {
      identifier = "email";
    } else {
      identifier = "mobile";
    }

    if (identifier === "email") {
      const allUsers = await prisma.doctor_details.findMany();
      for (const u of allUsers) {
        const decryptedEmail = decrypt(u.email, secretKey);
        if (decryptedEmail === userid) {
          user = u;
          break;
        }
      }
    } else {
      user = await prisma.doctor_details.findFirst({
        where: {
          phone_no: userid,
        },
      });
    }

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    const hashedpassword = user.password;
    bcrypt.compare(password, hashedpassword, function (err, result) {
      if (err) {
        return res.status(500).json({
          error: true,
          message: "Password hashing error",
        });
      }

      if (!result) {
        return res.status(400).json({
          error: false,
          message: "Invalid password",
        });
      }

      return res.status(200).json({
        error: false,
        success: true,
        message: "Successfully logged in",
        data: user,
      });
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor-doctor_login API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//getting all active doctors

const get_doctors = async (req, res) => {
  try {
    const complete_data = await prisma.doctor_details.findMany({
      where: { OR: [{ status: "Y" }, { status: null }] },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        second_name: true,
        phone_office: true,
        image: true,
        education_qualification: true,
        additional_qualification: true,
        specialization: true,
        additional_speciality: true,
        type: true,
        gender: true,
        address: true,
        experience: true,
        sector: true,
        pincode: true,
        about: true,
        rating: true,
        doctor_hospitalId: {
          select: {
            hospitalid: {
              select: {
                pincode: true,
              },
            },
          },
        },
        feedback: {
          where: { status: "accepted" },
          select: { rating: true },
        },
      },
    });

    const updatePromises = complete_data.map(async (doctor) => {
      const pincodes = [
        doctor.pincode,
        ...doctor.doctor_hospitalId.map((entry) => entry.hospitalid?.pincode),
      ].filter((pincode) => pincode !== null);

      // Calculate the average rating from feedback
      const totalRatings = doctor.feedback.reduce(
        (sum, { rating }) => sum + rating,
        0
      );
      const averageRating =
        doctor.feedback.length > 0
          ? (totalRatings / doctor.feedback.length).toFixed(1)
          : 0;

      await prisma.doctor_details.update({
        where: { id: doctor.id },
        data: { rating: averageRating.toString() },
      });

      return {
        ...doctor,
        pincodes,
        rating: averageRating,
        doctor_hospitalId: undefined,
        feedback: undefined,
      };
    });

    const processed_data = await Promise.all(updatePromises);

    res.status(200).json({
      error: false,
      success: true,
      message: "successful",
      data: processed_data,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in get_doctors API`);

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//getting a doctor details

const get_doctorDetails = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;

  try {
    const { id } = req.body;
    if (!id) {
      return res.status(404).json({
        message: "required field can't be null",
        error: true,
      });
    }
    const find = await prisma.doctor_details.findUnique({
      where: {
        id: id,
      },
    });

    if (find) {
      if (find.status !== "Y") {
        return response.status(404).json({
          success: false,
          message:
            "Approval is pending for your account. Thank you for your patience.",
          error: true,
        });
      }
      // Decrypting sensitive data
      const decryptedPhone = decrypt(find.phone_no, secretKey);
      // const decryptedEmail = decrypt(find.email, secretKey);
      const decryptedRegistrationNo = decrypt(find.registration_no, secretKey);

      // Sending response with decrypted data
      return res.status(200).json({
        data: {
          ...find,
          phone_no: decryptedPhone,
          // email: decryptedEmail,
          registration_no: decryptedRegistrationNo,
        },
        error: false,
        success: true,
      });
    } else {
      return res.status(400).json({
        message: "No data",
        success: false,
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in get_doctorDetails API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for editing the doctor profile

const edit_doctor = async (req, res) => {
  try {
    const { doctor_id, about } = req.body;
    const dr_imageLink = req.file?.location;
    const datetime = getCurrentDateInIST();
    if (!doctor_id) {
      return res.status(400).json({
        message: "error",
        error: true,
      });
    }
    const edited_data = await prisma.doctor_details.update({
      where: {
        id: doctor_id,
      },
      data: {
        image: dr_imageLink,
        about: about,
        updatedDate: datetime,
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfully edited the details",
      data: edited_data,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in edit_doctor API`);

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for deleting the profile
const delete_doctor = async (req, res) => {
  try {
    const { doctor_id } = req.body;
    const deleted_doctor = await prisma.doctor_details.update({
      where: {
        id: doctor_id,
      },
      data: {
        status: "inactivated",
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully deleted",
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in delete_doctor API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for adding the timeing of the doctor
const consultation_data = async (req, res) => {
  try {
    const { id, timing, days, consultation_fees } = req.body;
    const datetime = getCurrentDateInIST();
    const add_data = await prisma.doctor_hospital.update({
      where: {
        id: id, //doctor_hospital table id
      },
      data: {
        timing: timing,
        days: days,
        consultation_fees: consultation_fees,
        updated_date: datetime,
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfully added the timing",
      data: add_data,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor consultation_data API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for editing the consultation details
const edit_consultationDetails = async (req, res) => {
  try {
    const { id, timing, days, consultation_fees } = req.body;
    const datetime = getCurrentDateInIST();
    const edited_consultation = await prisma.doctor_hospital.update({
      where: {
        id: id,
      },
      data: {
        timing: timing,
        days: days,
        consultation_fees: consultation_fees,
        updated_date: datetime,
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully edited the consultation data",
      data: edited_consultation,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor-edit_consultationDetails API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//to filter using the specialization

const filter_specialization = async (req, res) => {
  try {
    const { specialization } = req.body;

    const filter_spec = await prisma.doctor_details.findMany({
      where: {
        specialization: {
          contains: specialization,
        },
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: filter_spec,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in filter_specialization API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for filter doctor using various parameters
const doctor_filter = async (req, res) => {
  try {
    const { data } = req.body;

    const filter_doc = await prisma.doctor_details.findMany({
      where: {
        OR: [
          {
            name: {
              contains: data,
            },
          },
          {
            education_qualification: {
              contains: data,
            },
          },
          // {
          //     additional_qualification:{
          //         contains:data
          //     }

          // },
          {
            gender: {
              contains: data,
            },
          },
          {
            specialization: {
              contains: data,
            },
          },
          {
            type: {
              contains: data,
            },
          },
        ],
      },
    });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: filter_doc,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor_filter API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for filter doctor using the name
const doctor_nameFilter = async (req, res) => {
  try {
    const { name } = req.body;
    const find_byName = await prisma.doctor_details.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
    });
    res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: find_byName,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor_nameFilter API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for suggesting the pincode and district
const suggest_postname_district = async (req, res) => {
  try {
    const { searchitem } = req.body;

    const trimmedSearchItem = searchitem.trim();
    const suggest_item_postname = await prisma.pincode_data.findMany({
      where: {
        postname: {
          contains: trimmedSearchItem,
          mode: "insensitive",
        },
      },
    });

    const suggest_item_district = await prisma.pincode_data.findMany({
      where: {
        district: {
          startsWith: trimmedSearchItem,
          mode: "insensitive",
        },
      },
    });
    const suggest_item = [...suggest_item_postname, ...suggest_item_district];

    res.status(200).json({
      error: false,
      success: true,
      message: "successfull",
      data: suggest_item,
      // data:{suggest_item_postname:suggest_item_postname,suggest_item_district:suggest_item_district}
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in get_category API`);

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//for getting pincode
// const get_pincode = async (req, res) => {
//   console.log("suggestttttttt",req.body)
//   try {
//     const { selectedArea_id } = req.body;

//     const get_postalData = await prisma.pincode_data.findMany({
//       where: {
//         id: selectedArea_id,
//       },
//     });

//     const result = get_postalData[0].pincode;

//     const get_doctorDetails = await prisma.doctor_details.findMany({
//       where: {
//         OR:[
//         pincode: result,
//         doctor_hospitalId: {
//           select: {
//             hospitalid: {
//               select: {
//                 pincode: true,
//               },
//             },
//           },
//         },
//       ]
//       },
//     });
//     let featured_partner = [];
//     let not_featured_partner = [];
//     if (get_doctorDetails.length > 0) {
//       for (i = 0; i < get_doctorDetails.length; i++) {
//         if (get_doctorDetails[i].featured_partner === true) {
//           featured_partner.push(get_doctorDetails[i]);
//         } else {
//           not_featured_partner.push(get_doctorDetails[i]);
//         }
//       }
//       return res.status(200).json({
//         error: false,
//         success: true,
//         message: "successfull",
//         data: [...featured_partner, ...not_featured_partner],
//       });
//     }
//     let nearByData = [];
//     let nearBy_notfeatured = [];
//     let samePinData = [];
//     let nearByData_featured = [];
//     if (get_doctorDetails.length === 0) {
//       let suggestedpincodes = [
//         result - 1,
//         result + 1,
//         result - 2,
//         result + 2,
//         result - 3,
//         result + 3,
//         result - 4,
//         result + 4,
//       ];
//       // for(let i=result-4; i<=result+4; i++){
//       //     suggestedpincodes.push(i)
//       // }

//       for (i = 0; i < suggestedpincodes.length; i++) {
//         const nearBypincode = await prisma.doctor_details.findMany({
//           where: {
//             pincode: suggestedpincodes[i],
//           },
//         });
//         if (nearBypincode.length > 0) {
//           for (j = 0; j < nearBypincode.length; j++) {
//             if (nearBypincode[j].featured_partner === true) {
//               nearByData.push(nearBypincode[j]);
//             } else {
//               nearBy_notfeatured.push(nearBypincode[j]);
//             }
//           }

//           samePinData = [...nearByData, ...nearBy_notfeatured];

//           for (k = 0; k < samePinData.length; k++) {
//             nearByData_featured.push(samePinData[k]);
//           }
//           nearByData = [];
//           nearBy_notfeatured = [];
//         }
//         //  ggg.push(samePinData)

//         if (nearByData_featured.length > 0) {
//           return res.status(200).json({
//             error: false,
//             success: true,
//             message: "successfull",
//             data: nearByData_featured,
//           });
//         } else {
//           // const get_completeDr = await prisma.doctor_details.findMany()
//           return res.status(404).json({
//             error: true,
//             success: false,
//             // data:get_completeDr,
//             message: "No data found",
//           });
//         }
//       }
//     }

//     res.status(200).json({
//       error: false,
//       success: true,
//       message: "successfull",
//       data: nearByData_featured,
//     });
//   } catch (error) {
//     logger.error(`Internal server error: ${error.message} in get_pincode API`);

//     res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };
const get_pincode = async (req, res) => {
  try {
    const { selectedArea_id } = req.body;

    // Fetch postal data based on the selected area ID
    const postalData = await prisma.pincode_data.findUnique({
      where: {
        id: selectedArea_id,
      },
    });

    if (!postalData) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Postal data not found",
      });
    }

    const pincode = postalData.pincode;

    // Fetch doctor details based on pincode or associated hospital pincode
    const doctorDetails = await prisma.doctor_details.findMany({
      where: {
        OR: [
          { pincode }, // Direct match on the pincode field of doctor_details
          {
            doctor_hospitalId: {
              some: {
                hospitalid: {
                  pincode: pincode, // Match on the pincode field of hospital_details
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        second_name: true,
        phone_office: true,
        image: true,
        education_qualification: true,
        additional_qualification: true,
        specialization: true,
        additional_speciality: true,
        type: true,
        gender: true,
        address: true,
        experience: true,
        sector: true,
        pincode: true,
        about: true,
        rating: true,
        featured_partner: true,
      },
    });

    if (doctorDetails.length > 0) {
      const featuredDoctors = doctorDetails.filter(
        (doc) => doc.featured_partner
      );
      const nonFeaturedDoctors = doctorDetails.filter(
        (doc) => !doc.featured_partner
      );

      return res.status(200).json({
        error: false,
        success: true,
        message: "Successful",
        data: [...featuredDoctors, ...nonFeaturedDoctors],
      });
    }

    // Suggest nearby pincodes if no doctors found in the exact pincode
    const suggestedPincodes = Array.from({ length: 4 }, (_, i) => [
      pincode - (i + 1),
      pincode + (i + 1),
    ]).flat();

    let nearByDoctors = [];

    for (const suggestedPincode of suggestedPincodes) {
      const doctorsNearby = await prisma.doctor_details.findMany({
        where: {
          OR: [
            { pincode: suggestedPincode },
            {
              doctor_hospitalId: {
                some: {
                  hospitalid: {
                    pincode: suggestedPincode,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          second_name: true,
          phone_office: true,
          image: true,
          education_qualification: true,
          additional_qualification: true,
          specialization: true,
          additional_speciality: true,
          type: true,
          gender: true,
          address: true,
          experience: true,
          sector: true,
          pincode: true,
          about: true,
          rating: true,
          featured_partner: true,
        },
      });

      if (doctorsNearby.length > 0) {
        nearByDoctors = nearByDoctors.concat(doctorsNearby);
      }
    }

    if (nearByDoctors.length > 0) {
      const featuredNearByDoctors = nearByDoctors.filter(
        (doc) => doc.featured_partner
      );
      const nonFeaturedNearByDoctors = nearByDoctors.filter(
        (doc) => !doc.featured_partner
      );
      console.log({ nonFeaturedNearByDoctors });

      return res.status(200).json({
        error: false,
        success: true,
        message: "Successful",
        data: [...featuredNearByDoctors, ...nonFeaturedNearByDoctors],
      });
    }

    return res.status(404).json({
      error: true,
      success: false,
      message: "No data found",
    });
  } catch (error) {
    console.error(`Internal server error: ${error.message} in get_pincode API`);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//forgot password
const forgot_password = async (req, res) => {
  try {
    const { email } = req.body;

    const doctors = await prisma.doctor_details.findMany();

    const secretKey = process.env.ENCRYPTION_KEY;
    for (const doctor of doctors) {
      const decryptedEmail = decrypt(doctor.email, secretKey);

      if (decryptedEmail === email) {
        const generateOTP = () => {
          const otp = Math.floor(100000 + Math.random() * 900000);
          return otp.toString();
        };

        const randomOTP = generateOTP();

        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.in",
          port: 465,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const mailOptions = {
          from: "support@chaavie.com",
          to: email,
          subject: "New Password",
          text: `Dear user,\nYour OTP: ${randomOTP}\n\nThank you.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return res.status(400).json({
              error: true,
              success: false,
              message: "Error occurred while sending the email",
            });
          } else {
            return res.status(200).json({
              error: false,
              success: true,
              message: "OTP sent successfully to your email",
              data: randomOTP,
            });
          }
        });

        return; // Exit the loop and function once the email is found and handled
      }
    }

    // If no match is found
    return res.status(404).json({
      error: true,
      success: false,
      message: "Email not found",
    });
  } catch (err) {
    res.status(500).json({
      error: true,
      success: false,
      message: "Internal server error",
    });
  }
};

//reset password
const reset_password = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    const { email, password } = req.body;
    const doctors = await prisma.doctor_details.findMany();

    for (const doctor of doctors) {
      const decryptedEmail = decrypt(doctor.email, secretKey);

      if (decryptedEmail === email) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = find_Email[0].id;
        const newPassword = await prisma.doctor_details.update({
          where: {
            id: userId,
          },
          data: {
            password: hashedPassword,
          },
        });
        res.status(200).json({
          error: true,
          success: false,
          message: "successfully reset the password",
          data: newPassword,
        });
      } else {
        res.status(404).json({
          error: true,
          success: false,
          message: "Email not found",
        });
      }
    }
  } catch (err) {
    res.status(400).json({
      error: true,
      success: false,
      message: "internal server error",
    });
  }
};
//add doctor feedback
const doctor_feedback = async (req, res) => {
  try {
    const { user_id, doctor_id, message, rating, interactedid } = req.body;
    const datetime = getCurrentDateInIST();
    const status = "requested";
    if (!user_id || !doctor_id) {
      return res.status(400).json({
        error: true,
        message: "Required fields can't be null",
      });
    }
    const update = await prisma.doctor_interacteduser.update({
      where: {
        id: interactedid,
      },
      data: {
        status: "Y",
        st_modifiedDate: datetime,
      },
    });

    const create = await prisma.doctor_feedback.create({
      data: {
        user_id,
        doctor_id,
        message,
        rating,
        status: status,
        created_date: datetime,
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
    logger.error(
      `Internal server error: ${error.message} in doctor_feedback API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const doctor_searchdata = async (req, res) => {
  try {
    const { user_id, speciality, type } = req.body;
    const datetime = getCurrentDateInIST();
    // Input validation: check if at least speciality or type is provided
    if (!speciality && !type) {
      return res.status(400).json({
        error: true,
        message: "Either speciality or type must be provided",
      });
    }

    const create = await prisma.doctor_searchdata.create({
      data: {
        user_id: user_id || null,
        speciality,
        type,
        created_date: datetime,
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
      `Internal server error: ${error.message} in doctor_searchdata API`
    );
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const get_feedback = async (req, res) => {
  try {
    const data = await prisma.doctor_feedback.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    res.status(200).json(data);
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in get_feedback API`);

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const get_searchdata = async (req, res) => {
  const id = req.body.id;
  try {
    const data = await prisma.doctor_searchdata.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    res.status(200).json({ data: data, success: true });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in get_searchdata API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

//a single doctor feedback

const getadoctorfeedback = async (req, res) => {
  const doctor_id = req.body.doctor_id;
  const secretKey = process.env.ENCRYPTION_KEY;
  try {
    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "doctor_id can't be null",
      });
    }
    const safeDecrypt = (text, key) => {
      try {
        return decrypt(text, key);
      } catch (err) {
        return text;
      }
    };
    const datas = await prisma.doctor_feedback.findMany({
      where: {
        doctor_id,
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

    // Decrypt the name field
    const data = datas.map((feedback) => {
      return {
        ...feedback,
        userid: {
          ...feedback.userid,
          name: safeDecrypt(feedback.userid.name, secretKey),
        },
      };
    });

    // Calculate the sum and average of the ratings
    const totalRatings = datas.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    const averageRating =
      datas.length > 0 ? (totalRatings / datas.length).toFixed(1) : 0;
    const updaterating = await prisma.doctor_details.update({
      where: {
        id: doctor_id,
      },
      data: {
        rating: averageRating.toString(),
      },
    });

    res.status(200).json({
      success: true,
      data: data,
      averageRating: averageRating,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getadoctorfeedback API`
    );

    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const doctor_disable = async (request, response) => {
  try {
    const { id, type, status } = request.body;
    const datetime = getCurrentDateInIST();
    if (id && status) {
      const disable = await prisma.doctor_details.update({
        where: {
          id: id,
        },
        data: {
          status: status,
          updatedDate: datetime,
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
        message: `Doctor ${newstatus} successfully.`,
      });
    } else if ((type = "all")) {
      // Calculate the date 6 months ago
      const sixMonthsAgo = new Date(datetime);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const inactiveDoctors = await prisma.doctor_details.findMany({
        where: {
          last_active: {
            lt: sixMonthsAgo,
          },
        },
        orderBy: {
          datetime: "asc",
        },
      });

      response.status(200).json({
        sucess: true,
        data: inactiveDoctors,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in doctor_disable API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getunapprovedrs = async (request, response) => {
  try {
    const complete_data = await prisma.doctor_details.findMany({
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
      `Internal server error: ${error.message} in getunapprovedrs API`
    );

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const approvedr = async (request, response) => {
  try {
    const { id, status } = request.body;
    const datetime = getCurrentDateInIST();

    if (!id) {
      return response.status(400).json({ message: "Doctor ID is required." });
    }

    if (status !== "Y" && status !== "N" && status !== "R") {
      return response.status(400).json({ message: "Invalid status value." });
    }

    const doctor = await prisma.doctor_details.update({
      where: { id: id },
      data: { status: status, updatedDate: datetime },
    });

    if (doctor) {
      let message;
      if (status === "Y") {
        message = "Doctor Approved.";
      } else if (status === "N") {
        message = "Doctor Disabled.";
      } else {
        message = "Doctor Rejected.";
      }
      response.status(200).json({ message: message });
    } else {
      response.status(404).json({ message: "Doctor not found." });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in approvedr API`);

    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const completeedit = async (req, res) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };

  const datetime = getCurrentDateInIST();

  try {
    const {
      id,
      name,
      second_name,
      phone_no,
      email,
      password,
      image,
      education_qualification,
      additional_qualification,
      specialization,
      additional_speciality,
      type,
      gender,
      address,
      experience,
      about,
      registration_no,
      pincode,
      sector,
      phone_office,
    } = req.body;
    const intpincode = parseInt(pincode);
    if (!id) {
      return res.status(400).json({
        message: "Doctor ID is required",
        error: true,
      });
    }

    const finddoc = await prisma.doctor_details.findFirst({
      where: {
        id: id,
      },
    });

    if (!finddoc) {
      return res.status(404).json({
        message: "Doctor not found",
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

    // Check for email, phone, or registration number changes
    let updateFields = [];

    const checkChanges = (field, newValue, encrypted = false) => {
      if (
        newValue &&
        finddoc[field] !== (encrypted ? encrypt(newValue, secretKey) : newValue)
      ) {
        updateFields.push(field);
        return encrypted ? encrypt(newValue, secretKey) : newValue;
      }
      return finddoc[field];
    };

    // let skipEmailCheck = safeDecrypt(finddoc?.email, secretKey) === email;
    let skipPhoneCheck = safeDecrypt(finddoc.phone_no, secretKey) === phone_no;
    let skipRegistrationCheck =
      safeDecrypt(finddoc.registration_no, secretKey) === registration_no;

    if (!skipPhoneCheck && phone_no) {
      if (!validateMobileNumber(phone_no)) {
        return res.status(400).json({
          message: "Invalid mobile number",
          error: true,
        });
      }
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({
          message: "Invalid email address",
          error: true,
        });
      }
    }

    if (
      // (!skipEmailCheck && email) ||
      (!skipPhoneCheck && phone_no) ||
      (!skipRegistrationCheck && registration_no)
    ) {
      const doctors = await prisma.doctor_details.findMany();

      for (const doctor of doctors) {
        if (
          // (!skipEmailCheck &&
          //   email &&
          //   doctor.email === encrypt(email, secretKey)) ||
          (!skipPhoneCheck &&
            phone_no &&
            doctor.phone_no === encrypt(phone_no, secretKey)) ||
          (!skipRegistrationCheck &&
            registration_no &&
            doctor.registration_no === encrypt(registration_no, secretKey))
        ) {
          return res.status(400).json({
            error: true,
            message: "Phone number, or registration number already exists",
            success: false,
          });
        }
      }
    }

    const updateData = {
      name: checkChanges("name", name),
      second_name: checkChanges("second_name", second_name),
      phone_no: skipPhoneCheck
        ? finddoc.phone_no
        : checkChanges("phone number", phone_no, true),
      email: checkChanges("email", email),
      // skipEmailCheck
      //   ? finddoc.email
      //   :
      registration_no: skipRegistrationCheck
        ? finddoc.registration_no
        : checkChanges("registration number", registration_no, true),
      image: checkChanges("image", image),
      education_qualification: checkChanges(
        "education_qualification",
        education_qualification
      ),
      additional_qualification: checkChanges(
        "additional_qualification",
        additional_qualification
      ),
      specialization: checkChanges("specialization", specialization),
      additional_speciality: checkChanges(
        "additional_speciality",
        additional_speciality
      ),
      type: checkChanges("type", type),
      gender: checkChanges("gender", gender),
      address: checkChanges("address", address),
      experience: checkChanges("experience", experience),
      about: checkChanges("about", about),
      pincode: checkChanges("pincode", intpincode),
      sector: checkChanges("sector", sector),
      phone_office: checkChanges("phone_office", phone_office),
      updatedDate: datetime,
    };

    // Remove undefined fields from updateData
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const edited_data = await prisma.doctor_details.update({
      where: { id: id },
      data: updateData,
    });

    if (edited_data && updateFields.length > 0) {
      const text = `Successfully updated your ${updateFields.join(", ")}.`;
      await prisma.adm_notification.create({
        data: {
          sender: id,
          type: "Doctor",
          read: "N",
          text: text,
          created_date: datetime,
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
    logger.error(`Internal server error: ${error.message} in completeedit API`);

    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

/////////hospital adding by a doctor

const addhospital = async (req, res) => {
  console.log("adddddddddddd", req.body);
  const { name, address, contact_no, pincode, type } = req.body;
  const doc_id = req.user.userId;

  const datetime = getCurrentDateInIST();
  try {
    const checkPhoneNumber = await prisma.hospital_details.findFirst({
      where: { contact_no: contact_no },
    });

    if (checkPhoneNumber) {
      return res.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }

    const find = await prisma.hospital_details.findFirst({
      where: {
        AND: [
          { name: { equals: name.trim(), mode: "insensitive" } },
          { pincode: { equals: parseInt(pincode) } },
        ],
      },
    });

    if (find) {
      return res.status(400).json({
        message: "Hospital Already exists",
        error: true,
      });
    }
    const findtype = await prisma.doctor_details.findFirst({
      where: {
        id: doc_id,
      },
      select: {
        type: true,
        specialization: true,
      },
    });

    const type = findtype?.type;
    const hospitalspeciality = ["General medicine", findtype?.specialization];
    console.log({ hospitalspeciality });
    const hospitalfeature = ["Op", "Other Services "];
    // const register_data = await prisma.hospital_details.create({
    //   data: {
    //     name: name,
    //     address: address,
    //     contact_no: contact_no,
    //     datetime: datetime,
    //     email: emaillower,
    //     speciality: hospitalspeciality,
    //     feature: hospitalfeature,
    //     type: type,
    //     pincode: parseInt(pincode),
    //     status: "tobeonboarded",
    //   },
    // });

    res.status(200).json({
      error: false,
      success: true,
      message: "successfully registered",
      // data: register_data,
    });
    // }
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in doctor-addhospital api`
    );
    res.status(500).json({
      error: true,
      message: "internal server error",
    });
  }
};

module.exports = {
  doctor_registration,
  doctor_login,
  get_doctors,
  edit_doctor,
  get_doctorDetails,
  delete_doctor,
  consultation_data,
  edit_consultationDetails,
  filter_specialization,
  doctor_filter,
  doctor_nameFilter,
  suggest_postname_district,
  get_pincode,
  forgot_password,
  reset_password,
  doctor_searchdata,
  doctor_feedback,
  get_feedback,
  get_searchdata,
  getadoctorfeedback,
  doctor_disable,
  getunapprovedrs,
  approvedr,
  completeedit,
  addhospital,
};
