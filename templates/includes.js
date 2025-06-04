async function includeHTML(selector, relativePath, callback) {
    const element = document.querySelector(selector);
    try {
        const res = await fetch(relativePath);
        if (!res.ok) throw new Error(`No se pudo cargar: ${relativePath} (status ${res.status})`);
        const html = await res.text();
        element.innerHTML = html;
        if (callback) callback();
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? '/'
        : '/Retas_Basket/';
    console.log("Base URL:", BASE_URL);

    const prefix = BASE_URL + "templates/";

    includeHTML("#navbar", prefix + "navbar.html", () => {
        // Marcar link activo solo después que el navbar está cargado
        const currentPath = window.location.pathname.replace(/\/$/, "");
        const navLinks = document.querySelectorAll("#navbar .navbar-nav .nav-link");

        navLinks.forEach(link => {
            // Ajustar href relativo con base si es necesario
            let href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('/')) {
                link.href = BASE_URL + href;
            }

            // Comparar rutas para marcar activo
            const linkPath = new URL(link.href).pathname.replace(/\/$/, "");
            if (linkPath === currentPath) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    });

    includeHTML("#footer", prefix + "footer.html");
});
