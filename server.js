const express = require("express");
const multer = require("multer");
const simpleGit = require("simple-git");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let clonedRepoPath = ""; // To store the cloned repository path

// Function to get directory structure
const getDirectoryStructure = (dirPath) => {
    let result = [];
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                result.push({ name: file, type: "folder", children: getDirectoryStructure(fullPath) });
            } else {
                result.push({ name: file, type: "file" });
            }
        });
    } catch (error) {
        console.error("❌ Error reading directory:", error);
    }
    return result;
};

// API to upload SRS file and clone repository
app.post("/upload", upload.single("srsFile"), async (req, res) => {
    const repoUrl = req.body.repoUrl?.trim();
    const srsFilePath = req.file?.path;

    if (!repoUrl || !srsFilePath) {
        return res.status(400).json({ error: "❌ Please provide both SRS file and GitHub repository URL." });
    }

    clonedRepoPath = path.join(__dirname, "cloned_repo");

    try {
        await simpleGit().clone(repoUrl, clonedRepoPath);
        console.log("✅ Repository cloned successfully!");

        res.json({
            message: "✅ SRS file uploaded & repository cloned successfully!",
            repoPath: clonedRepoPath,
            srsFile: srsFilePath
        });

    } catch (error) {
        console.error("❌ Error cloning repository:", error);
        res.status(500).json({ error: "❌ Error cloning repository", details: error.message });
    }
});

// API to get project navigation
app.get("/navigate", (req, res) => {
    if (!clonedRepoPath || !fs.existsSync(clonedRepoPath)) {
        return res.status(400).json({ error: "❌ No repository found! Please upload an SRS file and repository URL first." });
    }

    const projectStructure = getDirectoryStructure(clonedRepoPath);
    res.json({ structure: projectStructure });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
