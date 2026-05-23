const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = 3000;

const ADMIN_PASSWORD = "hitters2026";
const VIEWER_PASSWORD = "ancienthitters2026";

app.use(express.json());
app.use(express.static("public"));

const NOTES_FILE = path.join(__dirname, "notes.json");

function getNotes() {
    return JSON.parse(fs.readFileSync(NOTES_FILE, "utf8"));
}

function saveNotes(notes) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            role: "admin"
        });
    }

    if (password === VIEWER_PASSWORD) {
        return res.json({
            success: true,
            role: "viewer"
        });
    }

    res.json({
        success: false
    });
});

app.get("/notes", (req, res) => {
    res.json(getNotes());
});

app.post("/notes", (req, res) => {

    const { password, title, content } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({
            error: "Unauthorized"
        });
    }

    const notes = getNotes();

    const newNote = {
        title,
        content,
        date: new Date().toLocaleString()
    };

    notes.unshift(newNote);

    saveNotes(notes);

    res.json({
        success: true
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});