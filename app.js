require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const path = require("path"); // Import path module
const CSS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// Load swagger.yaml
const swaggerDocument = yaml.load(path.join(__dirname, "docs", "swagger.yaml"));
const serverUrl = process.env.SERVER_URL;
swaggerDocument.servers[0].url = `${serverUrl}/api`;

//extra security packages
const helmet = require("helmet");
const cors = require("cors");
const xss = require("xss-clean");
const rateLimiter = require("express-rate-limit");
const authenticateUser = require("./middleware/authentication");

//connect db
const connectDB = require("./db/connect");

//routers
const authRouter = require("./routes/auth");
const verifyRouter = require("./routes/verify");
const userRouter = require("./routes/user");
const coursesRouter = require("./routes/course");

app.use(express.json());

// extra packages
app.set("trust proxy", 1);
app.use(
    rateLimiter({
        windowMs: 1 * 60 * 1000, // 1 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    })
);
app.use(helmet());
app.use(cors());
app.use(xss());

// routes
app.get("/", (req, res) => {
    res.send("E-Learning Api");
});
app.use("/api/auth", authRouter);
app.use("/api/verify", authenticateUser, verifyRouter);
app.use("/api/user", authenticateUser, userRouter);
app.use("/api/courses", authenticateUser, coursesRouter);

// Swagger documentation route
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        customCss:
            ".swagger-ui .opblock .opblock-summary-path-description-wrapper { align-items: center; display: flex; flex-wrap: wrap; gap: 0 10px; padding: 0 10px; width: 100%; }",
        customCssUrl: CSS_URL,
    })
);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);

        app.listen(port, () => {
            console.log(`Server is listening on http://localhost:${port}/`);
            console.log(
                "Swagger docs available at http://localhost:5000/api-docs"
            );
        });
    } catch (error) {
        console.log(error);
    }
};
start();
