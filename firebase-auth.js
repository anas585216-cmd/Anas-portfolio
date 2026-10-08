import {
    createUserWithEmailAndPassword,
    GithubAuthProvider,
    GoogleAuthProvider,
    getAuth,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    browserLocalPersistence,
    browserSessionPersistence,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { auth } from "./firebase.js";
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const successColor = "#1d7a45";
const errorColor = "#a63b1f";

function showNotice(element, message, isSuccess = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isSuccess ? successColor : errorColor;
    }
}

function errorMessage(error) {
    const messages = {
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Choose a stronger password (at least 6 characters).",
        "auth/user-not-found": "No account was found with that email.",
        "auth/wrong-password": "The password is incorrect.",
        "auth/invalid-credential": "The email or password is incorrect.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/popup-closed-by-user": "The sign-in popup was closed before completing.",
        "auth/unauthorized-domain": "This website domain is not authorized in Firebase.",
        "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
        "auth/network-request-failed": "Network error. Check your connection and try again."
    };
    return messages[error.code] || "Authentication failed. Please try again.";
}

function setBusy(button, busy) {
    if (button) {
        button.disabled = busy;
    }
}

function getNextPage() {
    return new URLSearchParams(window.location.search).get("next") === "admin.html"
        ? "admin.html"
        : "index.html";
}

if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberMe = document.getElementById("rememberMe");
    const notice = document.getElementById("loginNotice");
    const submitButton = loginForm.querySelector('[type="submit"]');
    const savedEmail = localStorage.getItem("rememberedLoginEmail");

    if (savedEmail && emailInput && rememberMe) {
        emailInput.value = savedEmail;
        rememberMe.checked = true;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showNotice(notice, "Please enter both your email and password.");
            return;
        }

        setBusy(submitButton, true);
        try {
            const persistence = rememberMe.checked
                ? browserLocalPersistence
                : browserSessionPersistence;
            await setPersistence(auth, persistence);
            await signInWithEmailAndPassword(auth, email, password);

            if (rememberMe.checked) {
                localStorage.setItem("rememberedLoginEmail", email);
            } else {
                localStorage.removeItem("rememberedLoginEmail");
            }

            showNotice(notice, "Signed in successfully. Redirecting...", true);
            window.location.assign(getNextPage());
        } catch (error) {
            showNotice(notice, errorMessage(error));
            setBusy(submitButton, false);
        }
    });

    const forgotPasswordLink = document.querySelector(".text-link");
    forgotPasswordLink?.addEventListener("click", async (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        if (!email) {
            showNotice(notice, "Enter your email address first, then choose Forgot password.");
            emailInput.focus();
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showNotice(notice, "Password reset email sent. Check your inbox.", true);
        } catch (error) {
            showNotice(notice, errorMessage(error));
        }
    });
}

if (signupForm) {
    const nameInput = document.getElementById("signupName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const termsAgreement = document.getElementById("termsAgreement");
    const notice = document.getElementById("signupNotice");
    const submitButton = signupForm.querySelector('[type="submit"]');

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!fullName || !email || !password || !confirmPasswordInput.value) {
            showNotice(notice, "Please complete all required fields.");
            return;
        }
        if (password.length < 8) {
            showNotice(notice, "Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPasswordInput.value) {
            showNotice(notice, "Passwords do not match.");
            return;
        }
        if (!termsAgreement.checked) {
            showNotice(notice, "You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        setBusy(submitButton, true);
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: fullName });
            showNotice(notice, "Account created successfully. Redirecting...", true);
            window.location.assign(getNextPage());
        } catch (error) {
            showNotice(notice, errorMessage(error));
            setBusy(submitButton, false);
        }
    });
}

const socialButtons = document.querySelectorAll(".social-btn");
socialButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        const isSignup = Boolean(signupForm);
        const notice = document.getElementById(isSignup ? "signupNotice" : "loginNotice");
        const termsAgreement = document.getElementById("termsAgreement");
        if (isSignup && !termsAgreement.checked) {
            showNotice(notice, "You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        const provider = button.classList.contains("google-btn")
            ? new GoogleAuthProvider()
            : new GithubAuthProvider();
        setBusy(button, true);
        try {
            await signInWithPopup(auth, provider);
            showNotice(notice, "Signed in successfully. Redirecting...", true);
            window.location.assign("index.html");
        } catch (error) {
            showNotice(notice, errorMessage(error));
            setBusy(button, false);
        }
    });
});
