const {getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");

const createcampaign = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const {
      name,
      coupon_code,
      product_id,
      discount_type,
      discount,
      start_date,
      end_date,
      image,
      status,
      created_by,
    } = request.body;
    if (
      name &&
      coupon_code &&
      product_id &&
      discount_type &&
      discount &&
      start_date &&
      end_date &&
      image &&
      status
    ) {
      const campaign_data = await prisma.campaigns.findFirst({
        where: {
          name: name,
          coupon_code: coupon_code,
        },
      });
      if (campaign_data) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "same data exists!",
        });
      } else {
        const campaign_datas = await prisma.campaigns.findFirst({
          where: {
            coupon_code: coupon_code,
          },
        });
        if (campaign_datas) {
          return response.status(401).json({
            error: true,
            success: false,
            message: "same coupon_code exists!",
          });
        } else {
          const create = await prisma.campaigns.create({
            data: {
              name: name,
              coupon_code: coupon_code,
              product_id: product_id,
              discount_type: discount_type,
              discount: parseInt(discount),
              start_date: start_date,
              end_date: end_date,
              image: image,
              status: "Y",
              created_by: created_by,
              created_date: datetime,
            },
          });
          response.status(200).json({
            message: "success",
            data: create,
            success: true,
            error: false,
          });
        }
      }
    } else {
      response.status(200).json({
        message: "all fields are mandatory",
        success: false,
        error: true,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in createcampaign api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const getcampaign = async (request, response) => {
  try {
    const datetime = getCurrentDateInIST();
    const campaignsdata = await prisma.campaigns.findMany({
      where: {
        NOT: {
          status: "N",
        },
      },
      orderBy: {
        end_date: "asc",
      },
    });
    const updatedCampaigns = campaignsdata.map(async (campaign) => {
      if (campaign.status === "Y" && datetime > campaign.end_date) {
        await prisma.campaigns.update({
          where: {
            id: campaign.id,
          },
          data: {
            status: "N",
          },
        });
        return { ...campaign, status: "N" };
      } else {
        return campaign;
      }
    });

    await Promise.all(updatedCampaigns);
    // Filter the campaigns that are currently active after the updates
    const activeCampaigns = campaignsdata.filter((campaign) => {
      return (
        currentDate >= campaign.start_date && currentDate <= campaign.end_date
      );
    });

    response.json(activeCampaigns);
  } catch (error) {
    response.status(500).json({
      error: "Internal server error",
    });
    logger.error(`Internal server error: ${error.message} in getcampaign api`);
  } finally {
    await prisma.$disconnect();
  }
};

const singlecampaign = async (request, response) => {
  try {
    const campaign_id = request.body.campaign_id;
    if (campaign_id) {
      const campaign = await prisma.campaigns.findFirst({
        where: {
          id: campaign_id,
        },
      });
      const prod_ids = campaign?.product_id;

      let fullproducts = [];
      for (let i = 0; i < prod_ids.length; i++) {
        const prod_id = prod_ids[i];
        const product = await prisma.product_master.findUnique({
          where: {
            product_id: prod_id,
          },
        });
        const coupon = await prisma.campaigns.findMany({
          where: {
            product_id: {
              array_contains: prod_id,
            },
            NOT: {
              status: "N",
            },
          },
        });

        const updatedCampaigns = coupon.map(async (campaign) => {
          if (campaign.status === "Y" && datetime > campaign.end_date) {
            await prisma.campaigns.update({
              where: {
                id: campaign.id,
              },
              data: {
                status: "N",
              },
            });
            return { ...campaign, status: "N" };
          } else {
            return campaign;
          }
        });

        await Promise.all(updatedCampaigns);
        // Filter the campaigns that are currently active after the updates
        const activeCampaigns = coupon.filter((campaign) => {
          return (
            currentDate >= campaign.start_date &&
            currentDate <= campaign.end_date
          );
        });

        const productWithCampaigns = {
          ...product,
          activeCampaigns: activeCampaigns || [],
        };

        // Push the object into the fullproducts array
        fullproducts.push(productWithCampaigns);
      }
      response.status(200).json({
        data: fullproducts,
        success: true,
        error: false,
      });
    } else {
      response.status(400).json({
        message: "campaign id is null",
        success: false,
        error: true,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in singlecampaign api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const allproducts = async (request, response) => {
  const datetime = getCurrentDateInIST();
  try {
    const allprods = await prisma.product_master.findMany({
      where: {
        is_active: "Y",
      },
      orderBy: {
        product_id: "desc",
      },
    });
    let fullproducts = [];
    for (let i = 0; i < allprods.length; i++) {
      const prod_id = allprods[i]?.product_id;

      const coupon = await prisma.campaigns.findMany({
        where: {
          product_id: {
            array_contains: prod_id,
          },
          NOT: {
            status: "N",
          },
        },
      });

      const updatedCampaigns = coupon.map(async (campaign) => {
        if (campaign.status === "Y" && datetime > campaign.end_date) {
          await prisma.campaigns.update({
            where: {
              id: campaign.id,
            },
            data: {
              status: "N",
            },
          });
          return { ...campaign, status: "N" };
        } else {
          return campaign;
        }
      });

      await Promise.all(updatedCampaigns);
      // Filter the campaigns that are currently active after the updates
      const activeCampaigns = coupon.filter((campaign) => {
        return (
          currentDate >= campaign.start_date && currentDate <= campaign.end_date
        );
      });

      const productWithCampaigns = {
        ...allprods[i],
        activeCampaigns: activeCampaigns || [],
      };

      // Push the object into the fullproducts array
      fullproducts.push(productWithCampaigns);
    }
    response.status(200).json({
      data: fullproducts,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Internal server error",
    });
    logger.error(`Internal server error: ${error.message} in allproducts api`);
  } finally {
    await prisma.$disconnect();
  }
};

const single_product = async (request, response) => {
  try {
    const datetime = getCurrentDateInIST();
    const product_id = request.body.product_id;
    const allprods = await prisma.product_master.findUnique({
      where: {
        product_id: product_id,
      },
    });
    let fullproducts = [];

    const prod_id = allprods?.product_id;

    const coupon = await prisma.campaigns.findMany({
      where: {
        product_id: {
          array_contains: prod_id,
        },
        NOT: {
          status: "N",
        },
      },
    });

    const updatedCampaigns = coupon.map(async (campaign) => {
      if (campaign.status === "Y" && datetime > campaign.end_date) {
        await prisma.campaigns.update({
          where: {
            id: campaign.id,
          },
          data: {
            status: "N",
          },
        });
        return { ...campaign, status: "N" };
      } else {
        return campaign;
      }
    });

    await Promise.all(updatedCampaigns);
    // Filter the campaigns that are currently active after the updates
    const activeCampaigns = coupon.filter((campaign) => {
      return (
        currentDate >= campaign.start_date && currentDate <= campaign.end_date
      );
    });

    const productWithCampaigns = {
      ...allprods,
      activeCampaigns: activeCampaigns || [],
    };

    // Push the object into the fullproducts array
    fullproducts.push(productWithCampaigns);

    response.status(200).json({
      data: fullproducts,
      success: true,
      error: false,
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      error: "Internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in single_product api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const getDiscountByCoupon = async (request, response) => {
  try {
    const { couponId, price, qty } = request.body;
    const campaign = await prisma.campaigns.findUnique({
      where: {
        id: couponId,
      },
    });
    const { discount_type, discount } = campaign;
    let discountAmount;
    if (discount_type === "Percentage") {
      discountAmount = price * (discount / 100);
    } else if (discount_type === "Amount") {
      discountAmount = discount;
    } else {
      return response.status(400).json({
        success: false,
        message: "Invalid discount type.",
      });
    }

    const totalDiscount = qty * discountAmount;
    return response.status(200).json({
      success: true,
      discount: totalDiscount,
    });
  } catch (err) {
    logger.error(
      `Internal server error: ${err.message} in getDiscountByCoupon`
    );
    return response.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  createcampaign,
  getcampaign,
  singlecampaign,
  allproducts,
  single_product,
  getDiscountByCoupon,
};
