const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();

const careerupload = async (request, response) => {
  const datetime = getCurrentDateInIST();

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

module.exports = {
  careerupload,
  getcareerrequest,
  homeserviceupload,
  homeservicerequests,
};
