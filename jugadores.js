import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("form-jugador");
const nombreInput = document.getElementById("nombre");
const listaJugadores = document.getElementById("lista-jugadores");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = nombreInput.value.trim();
    if (nombre) {
        await addDoc(collection(db, "Jugadores"), {
            nombre,
            juegos: [],
            fechaCreacion: serverTimestamp()
        });
        form.reset();
    }
});

const jugadoresQuery = query(collection(db, "Jugadores"), orderBy("nombre"));

onSnapshot(jugadoresQuery, (snapshot) => {
    listaJugadores.innerHTML = "";
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.innerHTML = `
        ${data.nombre}
        <button class="btn btn-sm btn-outline-secondary float-end editar-btn">Editar</button>`;
        listaJugadores.appendChild(li);

        const editarBtn = li.querySelector(".editar-btn");
        editarBtn.addEventListener("click", async () => {
            const nuevoNombre = prompt("Nuevo nombre:", data.nombre);
            if (nuevoNombre && nuevoNombre.trim() !== "") {
                const jugadorRef = doc(db, "Jugadores", docSnap.id);
                await updateDoc(jugadorRef, { nombre: nuevoNombre.trim() });
            }
        });
    });
});
