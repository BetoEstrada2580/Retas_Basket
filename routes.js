document.addEventListener("DOMContentLoaded", () => {
    // darle redirección a la página con los ids
    const base = window.location.hostname.includes("github.io")
        ? "/Retas_Basket/"
        : "/";
    const jugadores_link = document.querySelector("#jugadores-link");
    const equipos_link = document.querySelector("#equipos-link");
    const partidos_link = document.querySelector("#partidos-link");

    console.log("Ruta actual:", base);
    jugadores_link.addEventListener("click", () => {
        window.location.href = base + "screens/jugadores/jugadores.html";
    });
});