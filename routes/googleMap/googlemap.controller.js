const axios = require("axios");
require("dotenv").config();

const getCurrentLocation = async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({
      error: true,
      message: "Latitude and Longitude are required",
    });
  }
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await axios.get(geocodeUrl);
    console.log("response",response.data.results)
    if (response.data.status === "OK") {
      const address = response.data.results[0].formatted_address;
      return res.status(200).json({ success: true, data: address });
    } else {
      logger.error(`Geocoding failed in google map  API`);
      return res
        .status(400)
        .json({ error: `Geocoding failed: ${response.data.status}` });
    }
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in google map  API`);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getCurrentLocation,
};
