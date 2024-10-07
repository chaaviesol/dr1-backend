const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");

const getadm_notification = async (request, response) => {
  const usertype = request.body.userType;
  try {
    if (usertype === "ADM" || usertype === "SU") {
      const admin_notification = await prisma.adm_notification.findMany({
        orderBy: [
          {
            read: "asc",
          },
          {
            created_date: "desc",
          },
        ],
      });
      response.status(200).json({ admin_notification });
    } else {
      logger.error(`Unauthorized- in getadm_notification api`);
      return response
        .status(403)
        .json({ message: "Unauthorized. You are not an admin" });
    }
  } catch (error) {
    logger.error(`Internal server error- in adm_read_notification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const adm_read_notification = async (request, response) => {
  const usertype = request.body.type;
  const datetime = getCurrentDateInIST();
  console.log("adm_read_notification");
  try {
    if (usertype === "SU" || usertype === "ADM") {
      const id = request.body.id;
      if (id) {
        const read_notification = await prisma.adm_notification.update({
          where: {
            id: id,
          },
          data: {
            read: "Y",
            modified_date: datetime,
          },
        });
        console.log({ read_notification });
        if (read_notification) {
          return response.status(200).json({
            message: "success",
            success: true,
          });
        }
      }
    } else {
      logger.error(`Unauthorized- in adm_read_notification api`);
      return response
        .status(403)
        .json({ message: "Unauthorized. You are not an admin" });
    }
  } catch (error) {
    logger.error(`Internal server error- in adm_read_notification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const add_notification = async (request, response) => {
  try {
    const datetime = getCurrentDateInIST();
    const { text, user_id, type } = request.body;
    const add = await prisma.adm_notification.create({
      data: {
        sender: user_id,
        type: type,
        read: "N",
        text: text,
        created_date: datetime,
      },
    });
    if (add) {
      return response.status(200).json({
        message: "success",
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error- in add_notification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const addtypenotification = async (request, response) => {
  try {
    const datetime = getCurrentDateInIST();
    const { login_id, text, user_id, type, category } = request.body;
    const add = await prisma.type_notification.create({
      data: {
        receiver_id: user_id,
        type: type,
        category: category,
        read: "N",
        text: text,
        created_by: login_id,
        created_date: datetime,
      },
    });
    if (add) {
      return response.status(200).json({
        message: "success",
        success: true,
      });
    }
  } catch (error) {
    logger.error(`Internal server error- in addtypenotification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const gettype_notification = async (request, response) => {
  const { category, user_id } = request.body;
  try {
    const type_notification = await prisma.type_notification.findMany({
      where: {
        category: category,
        receiver_id: user_id,
      },
      orderBy: [
        {
          read: "asc",
        },
        {
          created_date: "desc",
        },
      ],
    });
    response.status(200).json({
      success: true,
      data: type_notification,
    });
  } catch (error) {
    logger.error(`Internal server error- in gettype_notification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const typeread_notification = async (request, response) => {
  try {
    const id = request.body.id;
    const datetime = getCurrentDateInIST();
    if (id) {
      const read_notification = await prisma.type_notification.update({
        where: {
          id: id,
        },
        data: {
          read: "Y",
          modified_date: datetime,
        },
      });
      console.log({ read_notification });
      if (read_notification) {
        return response.status(200).json({
          message: "success",
          success: true,
        });
      }
    }
  } catch (error) {
    logger.error(`Internal server error- in typeread_notification api`);
    response.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  getadm_notification,
  adm_read_notification,
  add_notification,
  addtypenotification,
  gettype_notification,
  typeread_notification,
};
