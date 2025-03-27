const express = require("express");
const multer = require("multer");
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("srsFile"), async (req, res) => {
    try {
        let repoUrl = req.body.repoUrl.trim();  // Trim spaces
        if (!repoUrl.startsWith("https://")) {
            throw new Error("Invalid repository URL. Ensure it starts with 'https://'.");
        }

        console.log("Received repo URL:", repoUrl);
        const repoPath = path.join(__dirname, "cloned_repo");

        // Delete old repo if exists
        if (fs.existsSync(repoPath)) {
            console.log("Deleting existing cloned repository...");
            fs.rmSync(repoPath, { recursive: true, force: true });
        }

        // Clone repository
        console.log("Cloning repository:", repoUrl);
        await simpleGit().clone(repoUrl, repoPath);
        console.log("Repository cloned successfully!");

        const structure = getProjectStructure(repoPath);
        console.log("Project structure analyzed!", structure);

        res.json({ message: "Repository analyzed successfully!", structure });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ message: "Failed to analyze repository", error: error.message });
    }
});

function getProjectStructure(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    return items.map(item => {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            return { type: "folder", name: item.name, children: getProjectStructure(fullPath) };
        } else {
            return { type: "file", name: item.name };
        }
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
