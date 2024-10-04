const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

require("dotenv").config();

const careerupload = async (request, response) => {
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  try {
    const {
      name,
      phone_no,
      preferred_location,
      qualification,
      experience,
      type,
      status,
      department,
    } = request.body;

    // Check if required fields are present
    if (!name || !phone_no || !address || !email || !pincode) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // // Check if email already exists
    // const checkEmail = await prisma.career.findFirst({
    //   where: { email },
    // });

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.career.findFirst({
      where: { phone_no },
    });

    // if (checkEmail) {
    //   return response.status(400).json({
    //     message: "Email ID already exists",
    //     error: true,
    //   });
    // }

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }

    // Create a new pharmacy record
    const create = await prisma.career.create({
      data: {
        name,
        phone_no,
        preferred_location,
        qualification,
        experience,
        type,
        status,
        department,
        created_date: istDate,
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
    const getall = await prisma.career.findMany();
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
  const currentDate = new Date();
  const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
  const istDate = new Date(currentDate.getTime() + istOffset);

  try {
    const {
      name,
      phone_no,
      address,
      start_date,
      end_date,
      experience,
      type,
      status,
      department,
      pincode
    } = request.body;

    // Check if required fields are present
    if (!name || !phone_no || !address || !department || !pincode) {
      return response.status(400).json({
        message: "Required fields can't be null",
        error: true,
      });
    }

    // // Check if email already exists
    // const checkEmail = await prisma.career.findFirst({
    //   where: { email },
    // });

    // Check if phone number already exists
    const checkPhoneNumber = await prisma.home_services.findFirst({
      where: { phone_no },
    });

    // if (checkEmail) {
    //   return response.status(400).json({
    //     message: "Email ID already exists",
    //     error: true,
    //   });
    // }

    if (checkPhoneNumber) {
      return response.status(400).json({
        message: "Phone number already exists",
        error: true,
      });
    }

    // Create a new pharmacy record
    const create = await prisma.home_services.create({
      data: {
        name,
        phone_no,
        preferred_location,
        qualification,
        experience,
        start_date,
        end_date,
        type,
        status,
        department,
        created_date: istDate,
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

const homeservicerequests = async (request, response) => {
    try {
      const getall = await prisma.home_services.findMany();
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

module.exports = { careerupload, getcareerrequest, homeserviceupload,homeservicerequests };
