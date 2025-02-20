const fs = require("fs");
const path = require("path");

function handleGenerateServer(jsonConfig) {
    const nodes = jsonConfig.nodes;
    let serverCode = `const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

`;
    
    const middlewares = {
        auth: `const authMiddleware = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
};

`,
        admin: `const adminMiddleware = (req, res, next) => {
    if (req.headers.authorization !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

`
    };

    let routes = "";
    nodes.forEach(node => {
        if (node.properties.type === "middleware") {
            if (node.properties.auth_required) {
                serverCode += middlewares.auth;
            }
            if (node.properties.admin_required) {
                serverCode += middlewares.admin;
            }
        }
        
        if (node.properties.endpoint) {
            let middlewaresToUse = [];
            if (node.properties.auth_required) middlewaresToUse.push("authMiddleware");
            if (node.properties.admin_required) middlewaresToUse.push("adminMiddleware");
            
            routes += `app.${node.properties.method.toLowerCase()}("${node.properties.endpoint}", ${middlewaresToUse.join(", ")} (req, res) => res.json({ message: "${node.name}" }));

`;
        }
    });

    serverCode += routes;
    serverCode += "app.listen(3000, () => console.log(\"Server running on port 3000\"));\n";
    
    return serverCode;
}

function main() {
    const inputFilePath = path.join(__dirname, "config.json"); 
    const outputFilePath = path.join(__dirname, "server.js");
    
    try {
        const rawData = fs.readFileSync(inputFilePath);
        const jsonConfig = JSON.parse(rawData);
        const serverCode = handleGenerateServer(jsonConfig);
        
        fs.writeFileSync(outputFilePath, serverCode);
        console.log("Server file generated successfully: server.js");
    } catch (error) {
        console.error("Error processing the JSON file:", error);
    }
}

main();
