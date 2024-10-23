const express = require("express");
require("dotenv").config();

const bodyParser = require("body-parser");
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const server = express();
const cors = require("cors");
const authRouter = require("./routes/Auth/authRouters");
const auth = require("./middleware/Auth/auth");
const DoctorRouter = require("./routes/doctor/doctor.routes");
const HospitalRouter = require("./routes/hospital/hospital.routes");
const LabRouter = require("./routes/lab/lab.routes");
const PharmacyRouter = require("./routes/pharmacy/pharmacy.routes");
const UserRouter = require("./routes/user/user.routes");
const adminRouter = require("./routes/admin/admin.routes");
const notificationRouter = require("./routes/notifications/notifications.routes");
const ChatbotRouter = require("./routes/chatbot/chatbot.routes");
const OpinionRouter = require("./routes/secondopinion/secondopinion.routes");
const productRouter = require("./routes/productcategory/productcategory.routes");
const CareerRouter = require("./routes/careerAndhomservices/career.routes");
const medoneRouter = require("./routes/medOne/medone.routes");
const googleMapRouter=require("./routes/googleMap/googlemap.routes")

server.use(
  cors({
    origin: "*",
    allowedHeaders: "X-Requested-With,Content-Type,auth-token,Authorization",
    credentials: true,
  })
);
server.use(bodyParser.json());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use("/auth", authRouter);
server.use("/doctor", DoctorRouter);
server.use("/hospital", HospitalRouter);
server.use("/lab", LabRouter);
server.use("/pharmacy", PharmacyRouter);
server.use("/user", UserRouter);
server.use("/admin", adminRouter);
server.use("/notification", notificationRouter);
server.use("/bot", ChatbotRouter);
server.use("/secondop", OpinionRouter);
server.use("/product", productRouter);
server.use("/career",CareerRouter)
server.use("/medone",medoneRouter)
server.use("/googlemap",googleMapRouter)

if (process.env.NODE_ENV === "development") {
  server.listen(PORT, () => {
    console.log(`server started at ${HOST}:${PORT}`);
  });
}
