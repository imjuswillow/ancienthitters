import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};

const ADMIN_PASSWORD = "hitters2026";
const VIEWER_PASSWORD = "ancienthitters2026";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginCard = document.getElementById("loginCard");
const loginInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const appWrap = document.getElementById("app");
const composerCard = document.getElementById("composerCard");
const roleLabel = document.getElementById("roleLabel");
const logoutBtn = document.getElementById("logoutBtn");

const notesContainer = document.getElementById("notesContainer");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const postBtn = document.getElementById("postBtn");

let currentRole = "";
let unsubscribe = null;

const NEW_NOTE_MS = 30 * 60 * 1000; // 30 minutes

function setLoginError(message) {
  loginError.textContent = message || "";
}

function shakeLogin() {
  loginCard.classList.remove("shake");
  void loginCard.offsetWidth;
  loginCard.classList.add("shake");
  setTimeout(() => loginCard.classList.remove("shake"), 450);
}

function showNotesPlaceholder() {
  notesContainer.innerHTML = `<div class="empty">No notes posted</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getNoteTime(note) {
  if (note.createdAt?.toDate) return note.createdAt.toDate();
  if (note.clientCreatedAt) return new Date(note.clientCreatedAt);
  if (note.date) return new Date(note.date);
  return null;
}

function isLatestNewNote(note, notes) {
  if (!notes.length) return false;
  if (note.id !== notes[0].id) return false;

  const noteTime = getNoteTime(note);
  if (!noteTime) return false;

  return Date.now() - noteTime.getTime() <= NEW_NOTE_MS;
}

function formatTimestamp(note) {
  const noteTime = getNoteTime(note);
  if (!noteTime) return "Just now";
  return noteTime.toLocaleString();
}

function renderNotes(notes) {
  if (!notes.length) {
    showNotesPlaceholder();
    return;
  }

  notesContainer.innerHTML = notes.map((note) => {
    const newFlag = isLatestNewNote(note, notes);
    const badge = newFlag ? `<span class="new-badge">New</span>` : "";
    const noteClass = newFlag ? "note new" : "note";

    return `
      <article class="${noteClass}">
        <div class="note-head">
          <h3 class="note-title">${escapeHtml(note.title || "Untitled")}</h3>
          ${badge}
        </div>
        <div class="meta">${formatTimestamp(note)}</div>
        <div class="content">${escapeHtml(note.content || "")}</div>
      </article>
    `;
  }).join("");
}

function startNotesListener() {
  if (unsubscribe) unsubscribe();

  const notesQuery = query(
    collection(db, "churchNotes"),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(
    notesQuery,
    (snapshot) => {
      const notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      renderNotes(notes);
    },
    () => {
      notesContainer.innerHTML = `<div class="empty">Could not load notes.</div>`;
    }
  );
}

function enterApp(role) {
  currentRole = role;
  loginCard.classList.add("hidden");
  appWrap.classList.remove("hidden");
  roleLabel.textContent = role === "post" ? "Post" : "View";

  if (role === "post") {
    composerCard.classList.remove("hidden");
  } else {
    composerCard.classList.add("hidden");
  }

  startNotesListener();
}

async function handleLogin() {
  const password = loginInput.value.trim();

  if (!password) {
    setLoginError("Enter a password.");
    shakeLogin();
    return;
  }

  if (password === ADMIN_PASSWORD) {
    setLoginError("");
    enterApp("post");
    return;
  }

  if (password === VIEWER_PASSWORD) {
    setLoginError("");
    enterApp("view");
    return;
  }

  setLoginError("Wrong password");
  shakeLogin();
  loginInput.select();
}

async function postNote() {
  const title = noteTitle.value.trim();
  const content = noteBody.value.trim();

  if (!title || !content) {
    alert("Fill out both the title and the note.");
    return;
  }

  postBtn.disabled = true;
  postBtn.textContent = "Posting...";

  try {
    await addDoc(collection(db, "churchNotes"), {
      title,
      content,
      createdAt: serverTimestamp(),
      clientCreatedAt: Date.now(),
      postedBy: currentRole
    });

    noteTitle.value = "";
    noteBody.value = "";
  } catch (err) {
    alert("Could not post the note.");
    console.error(err);
  } finally {
    postBtn.disabled = false;
    postBtn.textContent = "Post Note";
  }
}

loginBtn.addEventListener("click", handleLogin);
loginInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleLogin();
});

postBtn.addEventListener("click", postNote);

logoutBtn.addEventListener("click", () => {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  currentRole = "";
  loginInput.value = "";
  loginError.textContent = "";
  loginCard.classList.remove("hidden");
  appWrap.classList.add("hidden");
  composerCard.classList.add("hidden");
  notesContainer.innerHTML = "";
});
