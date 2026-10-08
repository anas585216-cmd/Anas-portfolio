import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";

const allowedArticleTags = new Set([
    "P", "BR", "STRONG", "EM", "B", "I", "U", "S", "UL", "OL", "LI",
    "BLOCKQUOTE", "H2", "H3", "H4", "A", "CODE", "PRE", "HR"
]);

function setMessage(element, text, success = false) {
    if (!element) return;
    element.textContent = text;
    element.classList.toggle("is-success", success);
    element.classList.toggle("is-error", !success);
}

function formattedDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "Recently published";
    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(timestamp.toDate());
}

function safeImageUrl(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function appendSafeArticleNode(sourceNode, targetParent) {
    if (sourceNode.nodeType === Node.TEXT_NODE) {
        targetParent.append(document.createTextNode(sourceNode.textContent));
        return;
    }
    if (sourceNode.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = sourceNode.tagName;
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG"].includes(tagName)) return;
    if (!allowedArticleTags.has(tagName)) {
        sourceNode.childNodes.forEach((child) => appendSafeArticleNode(child, targetParent));
        return;
    }

    const safeElement = document.createElement(tagName.toLowerCase());
    if (tagName === "A") {
        const href = sourceNode.getAttribute("href") || "";
        try {
            const url = new URL(href, window.location.origin);
            if (["http:", "https:", "mailto:"].includes(url.protocol)) {
                safeElement.href = url.href;
                safeElement.rel = "noopener noreferrer";
            }
        } catch {
            safeElement.removeAttribute("href");
        }
    }
    sourceNode.childNodes.forEach((child) => appendSafeArticleNode(child, safeElement));
    targetParent.append(safeElement);
}

function renderArticleText(element, value) {
    const text = String(value || "");
    if (!/<\/?[a-z][^>]*>/i.test(text)) {
        element.textContent = text;
        return;
    }
    const parsed = new DOMParser().parseFromString(text, "text/html");
    parsed.body.childNodes.forEach((node) => appendSafeArticleNode(node, element));
}

function createPostCard(post) {
    const article = document.createElement("article");
    article.className = "card";

    const image = document.createElement("div");
    image.className = "card-image";
    const imageUrl = safeImageUrl(post.imageUrl)
        || "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80";
    image.style.backgroundImage = `url("${imageUrl}")`;
    article.append(image);

    const body = document.createElement("div");
    body.className = "card-body";
    const category = document.createElement("span");
    category.className = "card-tag";
    category.textContent = post.category || "Article";
    const title = document.createElement("h3");
    title.textContent = post.title || "Untitled post";

    const meta = document.createElement("div");
    meta.className = "meta";
    const author = document.createElement("div");
    author.className = "author-wrap";
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    const authorIcon = document.createElement("i");
    authorIcon.className = "fa-solid fa-user";
    avatar.append(authorIcon);
    const authorName = document.createElement("span");
    authorName.textContent = "Anas";
    author.append(avatar, authorName);

    const date = document.createElement("time");
    date.className = "card-date";
    const dateIcon = document.createElement("i");
    dateIcon.className = "fa-solid fa-calendar-days";
    const publishedDate = formattedDate(post.createdAt);
    date.append(dateIcon, document.createTextNode(` Posted ${publishedDate}`));
    if (post.createdAt && typeof post.createdAt.toDate === "function") {
        date.dateTime = post.createdAt.toDate().toISOString();
    }
    meta.append(author, date);
    body.append(category, title, meta);

    if (post.excerpt) {
        const excerpt = document.createElement("div");
        excerpt.className = "post-excerpt";
        renderArticleText(excerpt, post.excerpt);
        body.append(excerpt);
    }

    if (post.content) {
        const details = document.createElement("details");
        details.className = "post-details";
        const summary = document.createElement("summary");
        summary.className = "read-more";
        summary.textContent = "Read article ";
        const arrow = document.createElement("i");
        arrow.className = "fa-solid fa-arrow-right";
        summary.append(arrow);
        const content = document.createElement("div");
        content.className = "post-content";
        renderArticleText(content, post.content);
        details.append(summary, content);
        body.append(details);
    }

    article.append(body);
    return article;
}

async function renderBlogFeed(container) {
    if (!container) return;
    try {
        const postsQuery = query(
            collection(db, "posts"),
            where("published", "==", true)
        );
        const snapshot = await getDocs(postsQuery);
        const posts = snapshot.docs
            .map((documentSnapshot) => documentSnapshot.data())
            .sort((first, second) => {
                const firstTime = first.createdAt?.toMillis?.() || 0;
                const secondTime = second.createdAt?.toMillis?.() || 0;
                return secondTime - firstTime;
            });

        container.replaceChildren();
        if (posts.length === 0) {
            const empty = document.createElement("p");
            empty.className = "feed-empty";
            empty.textContent = "No published articles yet.";
            container.append(empty);
            return;
        }
        posts.forEach((post) => container.append(createPostCard(post)));
    } catch {
        container.replaceChildren();
        const error = document.createElement("p");
        error.className = "feed-empty";
        error.textContent = "Articles could not be loaded from Firebase. Please try again later.";
        container.append(error);
    }
}

renderBlogFeed(document.getElementById("blogPostPreview"));

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    const notice = document.getElementById("contactNotice");
    const submitButton = contactForm.querySelector('[type="submit"]');

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();
        if (!name || !email || !message) {
            setMessage(notice, "Please complete all fields.");
            return;
        }

        submitButton.disabled = true;
        try {
            await addDoc(collection(db, "contacts"), {
                name,
                email,
                message,
                status: "new",
                createdAt: serverTimestamp()
            });
            contactForm.reset();
            setMessage(notice, "Your message was sent. Thank you!", true);
        } catch {
            setMessage(notice, "Your message could not be sent. Please try again.");
        } finally {
            submitButton.disabled = false;
        }
    });
}
