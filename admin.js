import { onAuthStateChanged, sendEmailVerification, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const adminEmailAddress = "anas585216@gmail.com";
const accessGate = document.getElementById("accessGate");
const accessMessage = document.getElementById("accessMessage");
const adminApp = document.getElementById("adminApp");
const adminNotice = document.getElementById("adminNotice");
const verificationButton = document.getElementById("sendVerification");

function setNotice(element, message, success = false) {
    element.textContent = message;
    element.classList.toggle("is-success", success);
}

function formatTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "Just now";
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(timestamp.toDate());
}

function makeActionButton(label, className, handler) {
    const button = document.createElement("button");
    button.className = `small-button ${className || ""}`.trim();
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
}

function createPostRow(postDocument) {
    const post = postDocument.data();
    const row = document.createElement("article");
    row.className = "entry-row";
    const copy = document.createElement("div");
    copy.className = "entry-copy";
    const title = document.createElement("h3");
    title.textContent = post.title || "Untitled article";
    const meta = document.createElement("span");
    meta.className = "entry-meta";
    meta.textContent = `${post.category || "Article"} | ${formatTimestamp(post.createdAt)}`;
    const excerpt = document.createElement("p");
    excerpt.textContent = post.excerpt || "";
    copy.append(title, meta, excerpt);
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.append(makeActionButton("Delete", "danger", async () => {
        if (!window.confirm(`Delete "${post.title}"?`)) return;
        try {
            await deleteDoc(doc(db, "posts", postDocument.id));
            await loadDashboard();
            setNotice(adminNotice, "Article deleted.", true);
        } catch {
            setNotice(adminNotice, "The article could not be deleted.");
        }
    }));
    row.append(copy, actions);
    return row;
}

function createMessageRow(messageDocument, compact = false) {
    const message = messageDocument.data();
    const row = document.createElement("article");
    row.className = "entry-row";
    const copy = document.createElement("div");
    copy.className = "entry-copy";
    const title = document.createElement("h3");
    if (message.status !== "read") {
        const unread = document.createElement("span");
        unread.className = "unread-dot";
        unread.setAttribute("aria-label", "Unread");
        title.append(unread);
    }
    title.append(document.createTextNode(message.name || "Unknown sender"));
    const email = document.createElement("a");
    email.className = "entry-meta";
    email.href = `mailto:${encodeURIComponent(message.email || "")}`;
    email.textContent = message.email || "No email provided";
    const date = document.createElement("p");
    date.className = "entry-meta";
    date.textContent = formatTimestamp(message.createdAt);
    const body = document.createElement("p");
    body.textContent = message.message || "";
    copy.append(title, email, date, body);

    const actions = document.createElement("div");
    actions.className = "entry-actions";
    if (message.status !== "read") {
        actions.append(makeActionButton("Mark read", "", async () => {
            try {
                await updateDoc(doc(db, "contacts", messageDocument.id), { status: "read" });
                await loadDashboard();
            } catch {
                setNotice(adminNotice, "The message could not be updated.");
            }
        }));
    }
    if (!compact) {
        actions.append(makeActionButton("Delete", "danger", async () => {
            if (!window.confirm("Delete this contact message?")) return;
            try {
                await deleteDoc(doc(db, "contacts", messageDocument.id));
                await loadDashboard();
                setNotice(adminNotice, "Message deleted.", true);
            } catch {
                setNotice(adminNotice, "The message could not be deleted.");
            }
        }));
    }
    row.append(copy, actions);
    return row;
}

function fillList(element, documents, createRow, emptyMessage, take = Infinity) {
    element.replaceChildren();
    if (!documents.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = emptyMessage;
        element.append(empty);
        return;
    }
    documents.slice(0, take).forEach((item) => element.append(createRow(item)));
}

async function loadDashboard() {
    try {
        const [postsSnapshot, messagesSnapshot] = await Promise.all([
            getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"))),
            getDocs(query(collection(db, "contacts"), orderBy("createdAt", "desc")))
        ]);
        const posts = postsSnapshot.docs;
        const messages = messagesSnapshot.docs;
        const unreadCount = messages.filter((item) => item.data().status !== "read").length;

        document.getElementById("postCount").textContent = String(posts.length);
        document.getElementById("messageCount").textContent = String(messages.length);
        document.getElementById("unreadCount").textContent = String(unreadCount);
        document.getElementById("unreadBadge").textContent = String(unreadCount);
        fillList(document.getElementById("recentPosts"), posts, createPostRow, "No articles published yet.", 4);
        fillList(document.getElementById("allPosts"), posts, createPostRow, "Publish your first article above.");
        fillList(document.getElementById("recentMessages"), messages, (item) => createMessageRow(item, true), "No messages yet.", 4);
        fillList(document.getElementById("allMessages"), messages, (item) => createMessageRow(item), "Your inbox is empty.");
    } catch {
        setNotice(adminNotice, "Dashboard data could not load. Check Firestore setup and security rules.");
    }
}

function activatePanel(panelId) {
    document.querySelectorAll(".tab").forEach((tab) => {
        const active = tab.dataset.panel === panelId;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".admin-panel").forEach((panel) => {
        const active = panel.id === panelId;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
    });
}

document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activatePanel(tab.dataset.panel));
});
document.querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => activatePanel(button.dataset.openPanel));
});

document.getElementById("postForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    const values = new FormData(form);
    const post = {
        title: String(values.get("title")).trim(),
        category: String(values.get("category")).trim(),
        imageUrl: String(values.get("imageUrl")).trim(),
        excerpt: String(values.get("excerpt")).trim(),
        content: String(values.get("content")).trim(),
        published: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    submitButton.disabled = true;
    try {
        await addDoc(collection(db, "posts"), post);
        form.reset();
        setNotice(document.getElementById("postNotice"), "Article published on your blog.", true);
        await loadDashboard();
    } catch {
        setNotice(document.getElementById("postNotice"), "Could not publish. Check that Firestore is enabled and its rules are deployed.");
    } finally {
        submitButton.disabled = false;
    }
});

document.getElementById("signOutButton").addEventListener("click", () => signOut(auth));
verificationButton.addEventListener("click", async () => {
    try {
        await sendEmailVerification(auth.currentUser);
        accessMessage.textContent = "Verification email sent. Verify your address, then reload this page.";
    } catch {
        accessMessage.textContent = "Could not send the verification email. Sign in again and retry.";
    }
});

onAuthStateChanged(auth, async (user) => {
    adminApp.hidden = true;
    verificationButton.hidden = true;
    if (!user) {
        accessGate.hidden = false;
        accessMessage.textContent = "Sign in with the administrator account to manage articles and messages.";
        return;
    }
    if ((user.email || "").toLowerCase() !== adminEmailAddress) {
        accessGate.hidden = false;
        accessMessage.textContent = "This account does not have administrator access.";
        return;
    }
    if (!user.emailVerified) {
        accessGate.hidden = false;
        accessMessage.textContent = "Verify this email address before opening the dashboard. Check your inbox or resend the verification email.";
        verificationButton.hidden = false;
        return;
    }

    accessGate.hidden = true;
    adminApp.hidden = false;
    document.getElementById("adminEmail").textContent = user.email;
    await loadDashboard();
});
