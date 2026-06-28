document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const loginBtn = document.getElementById("loginBtn");
    const cartBtn = document.getElementById("cartBtn");

    if (loginBtn) {
        enhanceAuthControl(loginBtn, role);
    }

    document.querySelectorAll('a[href$="admin.html"], a[href$="dashboard.html"]').forEach((navLink) => {
        navLink.addEventListener("click", (event) => {
            const currentRole = localStorage.getItem("role");

            if (!currentRole) {
                event.preventDefault();
                window.location.href = getAuthUrlFromLink(navLink, "login");
            }
        });
    });

    if (cartBtn) {
        cartBtn.addEventListener("click", function (e) {
            const currentRole = localStorage.getItem("role");

            if (!currentRole) {
                e.preventDefault();
                window.location.href = getAuthUrlFromLink(cartBtn, "login");
            }
        });
    }
});

function enhanceAuthControl(loginBtn, role) {
    injectAuthStyles();

    const authBase = new URL(loginBtn.getAttribute("href"), window.location.href);
    const authDir = new URL("./", authBase);
    const authLoginUrl = new URL("auth.html?mode=login", authDir).href;
    const authRegisterUrl = new URL("auth.html?mode=register", authDir).href;
    const dashboardUrl = new URL("dashboard.html", authDir).href;
    const adminUrl = new URL("admin.html", authDir).href;
    const logoutUrl = authLoginUrl;

    const label = role === "admin" ? "Admin" : role === "user" ? "User" : "Login";
    const primaryHref = role === "admin" ? adminUrl : role === "user" ? dashboardUrl : authLoginUrl;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "loginBtn";
    trigger.className = loginBtn.className;
    trigger.innerHTML = `<span class="auth-trigger-label">${label}</span><span class="auth-trigger-caret">▾</span>`;
    trigger.setAttribute("aria-expanded", "false");
    trigger.dataset.primaryHref = primaryHref;

    const wrapper = document.createElement("div");
    wrapper.className = "auth-switcher";

    const menu = document.createElement("div");
    menu.className = "auth-menu";

    const menuItems = role
        ? [
            { text: role === "admin" ? "User" : "Admin", href: authLoginUrl, primary: true },
            { text: "Logout", href: logoutUrl, action: "logout" },
        ]
        : [
            { text: "Login", href: authLoginUrl, primary: true },
            { text: "Sign Up", href: authRegisterUrl },
            { text: "Admin Login", href: authLoginUrl },
        ];

    menu.innerHTML = menuItems.map(item => {
        if (item.action === "logout") {
            return `<button type="button" class="auth-menu-item" data-action="logout">${item.text}</button>`;
        }

        return `<a class="auth-menu-item ${item.primary ? "is-primary" : ""}" href="${item.href}">${item.text}</a>`;
    }).join("");

    loginBtn.replaceWith(wrapper);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = wrapper.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(isOpen));
    });

    menu.addEventListener("click", (event) => {
        const logoutButton = event.target.closest('[data-action="logout"]');

        if (logoutButton) {
            localStorage.removeItem("role");
            window.location.href = new URL("../index.html", authDir).href;
        }
    });

    document.addEventListener("click", (event) => {
        if (!wrapper.contains(event.target)) {
            wrapper.classList.remove("is-open");
            trigger.setAttribute("aria-expanded", "false");
        }
    });
}

function injectAuthStyles() {
    if (document.getElementById("auth-switcher-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "auth-switcher-styles";
    style.textContent = `
        .auth-switcher {
            position: relative;
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
        }

        .auth-switcher .auth-trigger {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            cursor: pointer;
            line-height: 1;
        }

        .auth-trigger-caret {
            font-size: 0.72em;
            line-height: 1;
            transform: translateY(-1px);
        }

        .auth-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 180px;
            padding: 8px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
            display: none;
            z-index: 2000;
        }

        .auth-switcher.is-open .auth-menu {
            display: grid;
            gap: 6px;
        }

        .auth-menu-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding: 10px 12px;
            border-radius: 10px;
            border: 0;
            background: transparent;
            color: #232323;
            text-decoration: none;
            font-size: 0.92rem;
            cursor: pointer;
            white-space: nowrap;
        }

        .auth-menu-item:hover,
        .auth-menu-item.is-primary {
            background: rgba(0, 0, 0, 0.04);
        }
    `;

    document.head.appendChild(style);
}

function getAuthUrlFromCartLink(cartBtn) {
    const cartUrl = new URL(cartBtn.getAttribute("href"), window.location.href);
    return new URL("auth.html?mode=login", new URL("./", cartUrl)).href;
}

function getAuthUrlFromLink(linkElement, mode) {
    const targetUrl = new URL(linkElement.getAttribute("href"), window.location.href);
    return new URL(`auth.html?mode=${mode}`, new URL("./", targetUrl)).href;
}