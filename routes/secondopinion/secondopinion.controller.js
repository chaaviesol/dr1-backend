const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { encrypt, decrypt } = require("../../utils");
const moment = require('moment-timezone');

require("dotenv").config();
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();
const currentDate = new Date();
const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
const istDate = new Date(currentDate.getTime() + istOffset);
const winston = require("winston");
const fs = require("fs");

//Configure the Winston logger
const logDirectory = "./logs";
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
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

const addreport = async (request, response) => {
  console.log("Request Body:", request.body); // Logs form data fields
  // console.log("Request Files:", request.files);
  try {
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    const user_id = request.user.userId;
    // const user_id= 7
    const { department, contact_no, patient_name, doctor_name, remarks } =
      request.body;

    // Validation
    if (!department || !contact_no || !patient_name || !doctor_name) {
      return response
        .status(400)
        .json({ message: "Missing required fields", error: true });
    }

    // Ensure contact_no is valid (e.g., proper format, length)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact_no)) {
      return response
        .status(400)
        .json({ message: "Invalid contact number", error: true });
    }

    // Ensure other fields are not empty or null
    if (!patient_name.trim() || !doctor_name.trim() || !department.trim()) {
      return response
        .status(400)
        .json({ message: "Fields cannot be empty", error: true });
    }

    const reportimg = request.files;
    let imagerep = {};

    //
    if (!reportimg || reportimg.length === 0) {
      return response
        .status(400)
        .json({ message: "Please attach at least one report", error: true });
    }

    for (i = 0; i < reportimg?.length; i++) {
      let keyName = `image${i + 1}`;

      imagerep[keyName] = reportimg[i].location;
    }

    const create = await prisma.second_opinion_data.create({
      data: {
        report_image: JSON.stringify(imagerep),
        patient_name,
        doctor_name,
        department,
        alternative_number: contact_no,
        remarks,
        user_id,
        created_date: istDate,
        status: "requested",
      },
    });
    console.log({ create });
    if (create) {
      response.status(200).json({
        message: "Report created successfully",
        error: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion addreport API`
    );

    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getallreport = async (request, response) => {
  try {
    const allrequested = await prisma.second_opinion_data.findMany({
      orderBy: {
        created_date: "desc",
      },
    });

    if (allrequested.length > 0) {
      let requestcount = [];
      let completedcount = [];
      let otherscount = [];
      allrequested.forEach((item) => {
        if (item.status === "requested") {
          requestcount.push(item);
        } else if (item.status === "completed") {
          completedcount.push(item);
        } else {
          otherscount.push(item);
        }
      });

      response.status(200).json({
        data: allrequested,
        error: false,
        allrequest: requestcount.length,
        otherscount: otherscount.length,
        completedcount: completedcount.length,
      });
    } else {
      response.status(204).json({
        message: "No Data",
        error: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getrequested API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

// const getareport = async (request, response) => {
//   console.log("Fetching report data...");

//   try {
//     const { id } = request.body;

//     if (!id) {
//       return response.status(400).json({
//         message: "ID is required",
//         error: true,
//       });
//     }

//     const requested = await prisma.second_opinion_data.findFirst({
//       where: { id: id },
//     });

//     if (!requested) {
//       return response.status(204).json({
//         message: "No data found",
//         error: false,
//       });
//     }

//     if (requested.doctor_remarksid) {
//       const doctorRemarks = await prisma.doctor_remarks.findMany({
//         where: { query_id: requested.doctor_remarksid },
//       });

//       return response.status(200).json({
//         data: { requested, doctorRemarks },
//         error: false,
//       });
//     }

//     return response.status(200).json({
//       data: requested,
//       error: false,
//     });
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in secondopinion getareport API`
//     );
//     response.status(500).json({ message: "An error occurred", error: true });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

const getareport = async (request, response) => {
  console.log("getaaaaaaaaddddddddddddddddddaa");
  try {
    const id = request.body.id;
    if (id) {
      const requested = await prisma.second_opinion_data.findFirst({
        where: {
          id: id,
        },
      });

      if (requested) {
        response.status(200).json({
          data: requested,
          error: false,
        });
      } else {
        response.status(204).json({
          message: "No Data",
          error: false,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getareport API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const statusupdate = async (request, response) => {
  console.log("object", request.body);
  try {
    // const { updated_by } = request.user.userId;
    const { id, status, doctor_remarks } = request.body;
    if (!id || !status) {
      return response
        .status(400)
        .json({ message: "Required fields can't be bull", error: true });
    }
    const update = await prisma.second_opinion_data.update({
      where: {
        id: id,
      },
      data: {
        status,
        // updated_by,
        doctor_remarks,
      },
    });
    if (update) {
      console.log("heyyyyyyy");
      return response.status(200).json({
        message: "Successfully updated",
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "error",
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion statusupdate API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

// const statusupdate = async (request, response) => {
//   console.log("object", request.body);

//   try {
//     const { id, status, doctor_remarks, doctor_id } = request.body;

//     if (!id || !status || !doctor_remarks) {
//       return response
//         .status(400)
//         .json({ message: "Required fields can't be null", error: true });
//     }

//     const transaction = await prisma.$transaction(async (prisma) => {
//       let remarksupdate;

//       const check = await prisma.doctor_remarks.findFirst({
//         where: { query_id: id },
//       });

//       if (!check) {
//         remarksupdate = await prisma.doctor_remarks.update({
//           where: { query_id: id },
//           data: { doctor_remarks, doctor_id },
//         });

//         await prisma.second_opinion_data.update({
//           where: { id: id },
//           data: {
//             status,
//             doctor_remarksid: remarksupdate?.id,
//           },
//         });
//       } else {
//         remarksupdate = await prisma.doctor_remarks.update({
//           where: { query_id: id },
//           data: { doctor_remarks, doctor_id },
//         });

//         await prisma.second_opinion_data.update({
//           where: { id: id },
//           data: { status },
//         });
//       }

//       return remarksupdate;
//     });

//     if (transaction) {
//       return response.status(200).json({
//         message: "Successfully updated",
//         success: true,
//       });
//     } else {
//       return response.status(400).json({
//         message: "Error updating data",
//         success: false,
//       });
//     }
//   } catch (error) {
//     logger.error(
//       `Internal server error: ${error.message} in secondopinion statusupdate API`
//     );
//     response.status(500).json({ message: "An error occurred", error: true });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

/////////////////for customers//////////////////////

const alluserqueries = async (request, response) => {
  try {
    const user_id = request.user.userId;
    const find = await prisma.query_data.findMany({
      where: {
        user_id,
      },
      orderBy: {
        created_date: "desc",
      },
    });
    let data = [];
    for (i = 0; i <= find.length; i++) {
      if (find.doctor_remarksid) {
        const findremarks = await prisma.doctor_remarks.findFirst({
          where: {
            id: find.doctor_remarksid,
          },
          select: {
            doctor_remarks,
            doctorid: {
              select: {
                name: true,
              },
            },
          },
        });
        findremarks.push(data);
        data.push({
          query: find[i].remarks,
          doctor_remarks: findremarks?.doctor_remarks,
          department: find[i].department,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion -alluserqueries API`
    );

    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const addquery = async (request, response) => {
  console.log("Request Body:", request.body);
  try {
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    const usertype = request.user.userType;
    const user_id = request.user.userId;
    if (!user_id) {
      logger.error("user_id is undefined in salesorder API");
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "customer") {
      return response.status(400).json({
        error: true,
        message: "Please login as a customer",
      });
    }

    const { department, query } = request.body;

    if (!department || !query) {
      return response
        .status(400)
        .json({ message: "Missing required fields", error: true });
    }

    const create = await prisma.query_data.create({
      data: {
        department,
        query,
        user_id,
        created_date: istDate,
        status: "requested",
      },
    });
    console.log({ create });
    if (create) {
      response.status(200).json({
        message: "Query submitted successfully",
        error: false,
      });
    } else {
      response.status(400).json({
        error: true,
      });
    }
  } catch {
  } finally {
    await prisma.$disconnect();
  }
};

const getcusquery = async (request, response) => {
  console.log("getcusqueryyyyyyyy");
  try {
    const user_id = request.user.userId;
    const usertype = request.user.userType;

    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "customer") {
      return response.status(400).json({
        error: true,
        message: "Please login as a customer",
      });
    }
    const requested = await prisma.query_data.findMany({
      where: {
        user_id: user_id,
      },
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        department: true,
        query: true,

        created_date: true,
        doctor_remarksid: true,

        doctor_remarks: {
          orderBy: {
            created_date: "asc",
          },
          select: {
            id: true,
            doctorid: {
              select: {
                name: true,
                image:true,
                education_qualification:true,
                additional_qualification:true
              },
            },
            doctor_remarks: true,
            created_date: true,
            doctor_id: true,
          },
        },
      },
    });

    if (requested.length > 0) {
      requested.forEach((questions) => (questions.isShowAnswers = false));
      response.status(200).json({
        data: requested,
        error: false,
      });
    } else {
      response.status(204).json({
        message: "No Queries",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getareport API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

////for admin-to get all doctor remarks/////////////

const getaquery = async (request, response) => {
  console.log("getaaaaaaaaddddddddddddddddddaa", request.body);
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const id = request.body.id;
    if (id) {
      console.log(id);
      const requested = await prisma.query_data.findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          department: true,
          query: true,
          users: {
            select: {
              name: true,
            },
          },
          created_date: true,
          doctor_remarksid: true,

          doctor_remarks: {
            orderBy: {
              created_date: "asc",
            },
            select: {
              id: true,
              doctorid: {
                select: {
                  name: true,
                },
              },
              doctor_remarks: true,
              created_date: true,
              doctor_id: true,
            },
          },
        },
      });

      if (requested) {
        requested.users.name = safeDecrypt(requested.users.name, secretKey);
        response.status(200).json({
          data: requested,
          error: false,
        });
      } else {
        response.status(204).json({
          message: "No Data",
          error: true,
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getareport API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getallqueries = async (request, response) => {
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const allquery = await prisma.query_data.findMany({
      orderBy: {
        created_date: "desc",
      },
      select: {
        id: true,
        department: true,
        created_date: true,
        query: true,
        status: true,
        users: {
          select: {
            name: true,
          },
        },
      },
    });
    if (allquery.length > 0) {
      let requested = [];
      let answered = [];
      let completed = [];
      allquery.forEach((query) => {
        if (query.users.name) {
          query.username = safeDecrypt(query.users.name, secretKey);
        }
        if (query.status === "requested") {
          requested.push(query);
        }
        if (query.status === "answered") {
          answered.push(query);
        }
        if (query.status === "completed") {
          completed.push(query);
        }
      });
      response.status(200).json({
        data: allquery,
        allrequestcount: requested.length,
        answeredcount: answered.length,
        completedcount: completed.length,
        error: false,
      });
    } else {
      response.status(400).json({
        message: "No Data",

        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getallqueries API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const queryupdate = async (request, response) => {
  console.log("queryupppppppppp", request.body);
  const { id, doctor_remarksid, status } = request.body;
  try {
    if (!id || !doctor_remarksid) {
      return response.status(400).json({
        error: true,
        message: "id and remarkid cant be null",
      });
    }
    const allrequestedquery = await prisma.query_data.update({
      where: {
        id: id,
      },
      data: {
        doctor_remarksid,
        // status,
        updated_date: istDate,
      },
    });
    console.log({ allrequestedquery });
    response.status(200).json({
      message: "successfully updated",
      data: allrequestedquery,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion queryupdate API`
    );

    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const querycomplete = async (request, response) => {
  console.log("querycomplete", request.body);
  const { id, status } = request.body;
  try {
    if (!id || !status) {
      return response.status(400).json({
        error: true,
        message: "id and status cant be null",
      });
    }
    const allrequestedquery = await prisma.query_data.update({
      where: {
        id: id,
      },
      data: {
        status,
        updated_date: istDate,
      },
    });
    if (allrequestedquery) {
      response.status(200).json({
        message: "successfully updated",
        error: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion querycomplete API`
    );

    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

//////////for docadmin///////////


const adddocremarks = async (request, response) => {
  const { id, doctor_remarks, status } = request.body;

  if (!id || !doctor_remarks || !status) {
    return response.status(400).json({
      error: true,
      message: "id, doctor_remarks, and status are required",
    });
  }
  try {
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    const user_id = request.user.userId;
    const usertype = request.user.userType;

    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "doctor") {
      return response.status(400).json({
        error: true,
        message: "Please login as a doctor",
      });
    }

    const doctorDetails = await prisma.doctor_details.findFirst({
      where: {
        id: user_id,
        query: true,
      },
    });

    if (!doctorDetails) {
      return response.status(400).json({
        error: true,
        message: "Doctor not approved or does not exist",
      });
    }

    const existingRemark = await prisma.doctor_remarks.findFirst({
      where: {
        query_id: id,
      },
    });

    const newRemark = await prisma.doctor_remarks.create({
      data: {
        query_id: id,
        doctor_id: user_id,
        doctor_remarks,
        created_date: istDate,
      },
    });

    if (!existingRemark) {
      await prisma.query_data.update({
        where: {
          id: id,
        },
        data: {
          doctor_remarksid: newRemark.id,
          status,
          updated_date: istDate,
        },
      });
    }

    response.status(200).json({
      message: "Successfully added",
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in adddocremarks API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const editremarks = async (request, response) => {
  const { remarkid, doctor_remarks } = request.body;

  if (!remarkid || !doctor_remarks) {
    return response.status(400).json({
      error: true,
      message: "id, doctor_remarks are required",
    });
  }
  try {
    const currentDate = new Date();
    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const istDate = new Date(currentDate.getTime() + istOffset);
    const user_id = request.user.userId;
    const usertype = request.user.userType;

    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "doctor") {
      return response.status(400).json({
        error: true,
        message: "Please login as a doctor",
      });
    }

    const doctorDetails = await prisma.doctor_details.findFirst({
      where: {
        id: user_id,
        query: true,
      },
    });

    if (!doctorDetails) {
      return response.status(400).json({
        error: true,
        message: "Doctor not approved or does not exist",
      });
    }

    const newRemark = await prisma.doctor_remarks.update({
      where: {
        id: remarkid,
      },
      data: {
        doctor_remarks,
      },
    });
    if (newRemark) {
      response.status(200).json({
        message: "Successfully updated",
        error: false,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in adddocremarks API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

////////////all queries----for doc/////////////////

const getqueries = async (request, response) => {
  console.log("getttttttttttttttttttttttttt");
  const secretKey = process.env.ENCRYPTION_KEY;
  const safeDecrypt = (text, key) => {
    try {
      return decrypt(text, key);
    } catch (err) {
      return text;
    }
  };
  try {
    const usertype = request.user.userType;
    const user_id = request.user.userId;

    if (!user_id) {
      return response.status(400).json({
        error: true,
        message: "user_id is required",
      });
    }
    if (!usertype || usertype != "doctor") {
      return response.status(400).json({
        error: true,
        message: "Please login as a doctor",
      });
    }

    const doctor = await prisma.doctor_details.findFirst({
      where: {
        id: user_id,
        query: true,
      },
      select: {
        specialization: true,
      },
    });

    if (!doctor) {
      return response.status(404).json({
        error: true,
        message: "Doctor not found or not approved",
      });
    }

    const allrequestedquery = await prisma.query_data.findMany({
      orderBy: {
        created_date: "desc",
      },
      where: {
        department: doctor.specialization,
      },
      select: {
        id: true,
        department: true,
        query: true,
        status: true,
        users: {
          select: {
            name: true,
            id: true,
          },
        },
        doctor_remarksid: true,
        created_date: true,
      },
    });

    const queryIds = allrequestedquery.map((query) => query.id);
    const doctorRemarks = await prisma.doctor_remarks.findMany({
      where: {
        query_id: { in: queryIds },
        doctor_id: user_id,
      },
      select: {
        id: true,
        query_id: true,
        doctor_id: true,
        doctor_remarks: true,
      },
    });
    console.log({ doctorRemarks });
    const remarksMap = new Map();
    doctorRemarks.forEach((remark) => {
      remarksMap.set(remark.query_id, remark);
    });

    const myanswers = [];
    const questions = [];

    allrequestedquery.forEach((query) => {
      if (query.users && typeof query.users === "object") {
        query.users.name = safeDecrypt(query.users.name, secretKey);
      }
      if (remarksMap.has(query.id)) {
        const remark = remarksMap.get(query.id);
        query.doctor_remarks = remark.doctor_remarks;
        query.remarkid = remark.id;
        myanswers.push(query);
      } else {
        questions.push(query);
      }
    });

    response.status(200).json({
      myanswers,
      questions,
      error: false,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in secondopinion getqueries API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  addreport,
  getallreport,
  statusupdate,
  getareport,
  getqueries,
  alluserqueries,
  addquery,
  getaquery,
  queryupdate,
  adddocremarks,
  getallqueries,
  editremarks,
  getcusquery,
  querycomplete,
};
