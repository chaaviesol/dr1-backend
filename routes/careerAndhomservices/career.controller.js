const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

const careerupload = async (request, response) => {
  const datetime = getCurrentDateInIST();
  console.log(request.body);
  try {
    const {
      name,
      phone_no,
      preferred_location,
      specialization,
      year_of_passout,
      gender,
      qualification,
      experience,
      type,
      status,
      department,
    } = request.body;

    // Check if required fields are present
    if (
      !name ||
      !phone_no ||
      !preferred_location ||
      !qualification ||
      !gender ||
      !type ||
      !year_of_passout
    ) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.career.findFirst({
      where: { name: name, phone_no: phone_no, qualification: qualification },
    });

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Already Submitted",
        error: true,
      });
    }

    const create = await prisma.career.create({
      data: {
        name,
        phone_no,
        preferred_location,
        qualification,
        specialization,
        year_of_passout,
        gender,
        experience,
        type,
        status,
        department,
        created_date: datetime,
      },
    });

    if (create) {
      return response.status(200).json({
        message: "Successfully created",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-careerupload API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const getcareerrequest = async (request, response) => {
  try {
    const getall = await prisma.career.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    if (getall.length > 0) {
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-getcareerrequest API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const homeserviceupload = async (request, response) => {
  const datetime = getCurrentDateInIST();
  console.log(request.body);
  try {
    const { name, phone_no, type, status } = request.body;

    // Check if required fields are present
    if (!name || !phone_no || !type) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // Create a new pharmacy record
    const create = await prisma.home_services.create({
      data: {
        name,
        phone_no,
        type,
        status,
        created_date: datetime,
      },
    });

    if (create) {
      return response.status(200).json({
        message: "Successfully created",
        error: false,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-homeserviceupload API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

const homeservicerequests = async (request, response) => {
  try {
    const getall = await prisma.home_services.findMany({
      orderBy: {
        created_date: "desc",
      },
    });
    if (getall.length > 0) {
      return response.status(200).json({
        data: getall,
        success: true,
      });
    } else {
      return response.status(400).json({
        message: "No Data",
        error: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-homeservicerequests API`
    );
    response.status(500).json({ message: "An error occurred", error: true });
  } finally {
    await prisma.$disconnect();
  }
};

/////////////////category-manage///////////////////////////////////////////
const addcategory = async (request, response) => {
  try {
    let { id, type, department, speciality } = request.body;
    const imageLink = request.file?.location;
    const datetime = getCurrentDateInIST();
    department = department?.trim().replace(/\s+/g, " ");

    // Validate the required fields
    if (!department) {
      return response.status(400).json({
        error: true,
        message: "department can't be null or empty.",
      });
    }

    const upr_category = department.toUpperCase();
    if (id) {
      const check = await prisma.career_category.findUnique({
        where: {
          id: id,
        },
      });
      console.log({ check });
      if (!check) {
        return response.status(400).json({
          error: true,
          message: "department not found.",
        });
      }

      if (check.department !== upr_category) {
        console.log("heyyyyyyyyy");
        const checkcategory = await prisma.career.findFirst({
          where: {
            department: check.department,
            type: check?.type,
          },
        });
        console.log({ checkcategory });
        if (checkcategory) {
          return response.status(400).json({
            error: true,
            message: "This department can't be updated ",
          });
        }

        const update = await prisma.career_category.update({
          where: {
            id: id,
          },
          data: {
            department: upr_category,
            type: type,
            speciality: speciality,
            modified_date: datetime,
          },
        });

        if (update) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Updated successfully.",
          });
        }
      } else {
        const update = await prisma.career_category.update({
          where: {
            id: id,
          },
          data: {
            department: upr_category,
            type: type,
            speciality: speciality,
            modified_date: datetime,
          },
        });

        if (update) {
          return response.status(200).json({
            success: true,
            error: false,
            message: "Category updated successfully.",
          });
        }
      }
    } else {
      const checkcategory = await prisma.productcategory.findMany({
        where: {
          type: type,
          department: department,
        },
      });

      if (checkcategory.length > 0) {
        return response.status(400).json({
          error: true,
          message: "Department already exists.",
          status: 400,
        });
      }
      const add = await prisma.career_category.create({
        data: {
          department: department,
          type: type,
          speciality: speciality,
          created_date: datetime,
        },
      });

      if (add) {
        return response.status(200).json({
          success: true,
          error: false,
          message: "Category created successfully.",
        });
      }
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-addcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getcategory = async (request, response) => {
  try {
    const get = await prisma.career_category.findMany({
      orderBy: {
        department: "asc",
      },
      select: {
        id: true,
        type: true,
        department: true,
        speciality: true,
      },
    });
    if (get.length > 0) {
      return response.status(200).json({
        data: get,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in career-getcategory API`
    );
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  careerupload,
  getcareerrequest,
  homeserviceupload,
  homeservicerequests,
  addcategory,
  getcategory,
};
