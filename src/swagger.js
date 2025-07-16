// src/swagger.js
const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ZareShop API",
      version: "1.0.0",
      description: "API documentation for ZareShop",
    },
    servers: [
      {
        url: "http://localhost:4000", // Change for prod
      },
    ],
  },
  // Scan all .routes.js files for Swagger comments
  apis: [path.join(__dirname, "routes", "*.routes.js")],
};

module.exports = swaggerJSDoc(options);
