const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = "hitters1";
const VIEWER_PASSWORD = "ancienthitters1";

app.use(express.json());
app.use(express.static("public"));

const NOTES_FILE = path.join(__dirname, "notes.json");

function ensureNotesFile() {
    if (!fs.existsSync(NOTES_FILE)) {
        fs.writeFileSync(NOTES_FILE, "[]", "utf8");
    }
}

function getNotes() {
    ensureNotesFile();
    try {
        return JSON.parse(fs.readFileSync(NOTES_FILE, "utf8"));
    } catch {
        return [];
    }
}

function saveNotes(notes) {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), "utf8");
}

app.post("/login", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            role: "post"
        });
    }

    if (password === VIEWER_PASSWORD) {
        return res.json({
            success: true,
            role: "view"
        });
    }

    return res.json({
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

    if (!title || !content) {
        return res.status(400).json({
            error: "Title and content are required"
        });
    }

    const notes = getNotes();

    const newNote = {
        id: Date.now(),
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
    function isNewNote(note, notes) {
  if (!notes.length) return false;
  return note.id === notes[0].id;
}
    const newFlag = isNewNote(note, notes);
    console.log(`Server running on port ${PORT}`);
});
