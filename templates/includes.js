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
    // Ajusta la ruta según dónde esté este archivo HTML
    // Aquí asumo que este archivo está en /screens/equipos/
    const prefix = "../../templates/";

    includeHTML("#navbar", prefix + "navbar.html", () => {
        // Marcar link activo solo después que el navbar está cargado
        const currentPath = window.location.pathname.replace(/\/$/, "");
        const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

        navLinks.forEach(link => {
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