const menuBtn = document.getElementById("menuBtn");
const navbar = document.getElementById("navbar");

if (menuBtn && navbar) {

    menuBtn.addEventListener("click", function () {

        navbar.classList.toggle("show");

    });

}


/* =========================================
   CLOSE MENU AFTER CLICK
========================================= */

const navLinks = document.querySelectorAll("#navbar a");

navLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        navbar.classList.remove("show");

    });

});


/* =========================================
   ACTIVE NAVIGATION
========================================= */

const sections = document.querySelectorAll("section[id]");


window.addEventListener("scroll", function () {

    let current = "";

    sections.forEach(function (section) {

        const sectionTop =
            section.offsetTop - 120;

        const sectionHeight =
            section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {

            current =
                section.getAttribute("id");

        }

    });


    navLinks.forEach(function (link) {

        link.classList.remove("active");

        const linkTarget =
            link.getAttribute("href");


        if (
            linkTarget === "#" + current
        ) {

            link.classList.add("active");

        }

    });

});


/* =========================================
   PROJECT BUTTONS
========================================= */

const projectButtons =
    document.querySelectorAll(".project-btn");


projectButtons.forEach(function (button, index) {

    button.addEventListener("click", function () {

        if (index === 0) {

            window.location.href =
                "#home";

        }

        else if (index === 1) {

            window.location.href =
                "#contact";

        }

        else if (index === 2) {

            alert(
                "Calculator Project\n\n" +
                "HTML + CSS + JavaScript"
            );

        }

    });

});


/* =========================================
   CONTACT FORM
========================================= */

/* =========================================
   FOOTER YEAR
========================================= */

const year =
    document.getElementById("year");


if (year) {

    year.textContent =
        new Date().getFullYear();

}


/* =========================================
   LOGIN PREVIEW
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginNotice = document.getElementById("loginNotice");
    const rememberMe = document.getElementById("rememberMe");
    const toggleButtons = document.querySelectorAll(".toggle-password");

    if (passwordInput) {
        toggleButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                const field = this.closest(".password-field").querySelector("input");
                const isHidden = field.type === "password";
                field.type = isHidden ? "text" : "password";

                const icon = this.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-eye", !isHidden);
                    icon.classList.toggle("fa-eye-slash", isHidden);
                }

                this.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
            });
        });
    }

}

/* =========================================
   SIGNUP FORM
========================================= */

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    const nameInput = document.getElementById("signupName");
    const emailInput = document.getElementById("signupEmail");
    const passwordInput = document.getElementById("signupPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const termsAgreement = document.getElementById("termsAgreement");
    const signupNotice = document.getElementById("signupNotice");

    document.querySelectorAll(".signup-field .toggle-password").forEach(function (button) {
        button.addEventListener("click", function () {
            const field = this.closest(".password-field").querySelector("input");
            const shouldShow = field.type === "password";
            field.type = shouldShow ? "text" : "password";

            const icon = this.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye", !shouldShow);
                icon.classList.toggle("fa-eye-slash", shouldShow);
            }

            this.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
        });
    });

}


/* =========================================
   SMOOTH SCROLL
========================================= */

document.querySelectorAll(
    'a[href^="#"]'
).forEach(function (link) {

    link.addEventListener(
        "click",
        function (event) {

            const targetId =
                this.getAttribute("href");


            if (targetId === "#") {

                return;

            }


            const target =
                document.querySelector(targetId);


            if (target) {

                event.preventDefault();


                target.scrollIntoView({

                    behavior: "smooth",

                    block: "start"

                });

            }

        }
    );

});


/* =========================================
   ESC KEY CLOSE MENU
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            if (navbar) {

                navbar.classList.remove("show");

            }

        }

    }
);