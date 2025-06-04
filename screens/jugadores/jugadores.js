import { db } from "../../firebase-config.js";
import {
    collection,
    onSnapshot,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("form-jugador");
const nombreInput = document.getElementById("nombre");
const listaJugadores = document.getElementById("lista-jugadores");

async function contarParticipacionesHoy() {
    const hoy = getStartOfToday();
    const q = query(collection(db, "Partidos"), where("fecha", ">=", hoy));
    const snapshot = await getDocs(q);

    const contador = {};

    snapshot.forEach((doc) => {
        const partido = doc.data();
        const jugadores = [
            ...partido.equipoA.jugadores,
            ...partido.equipoB.jugadores,
        ];
        jugadores.forEach((j) => {
            if (contador[j.id]) {
                contador[j.id]++;
            } else {
                contador[j.id] = 1;
            }
        });
    });

    return contador; // { jugadorId: vecesJugadas }
}

// Función para obtener la fecha al inicio del día (00:00:00)
function getStartOfToday() {
    const now = new Date();
    return Timestamp.fromDate(
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
    );
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = nombreInput.value.trim();
    if (nombre) {
        await addDoc(collection(db, "Jugadores"), {
            nombre,
            juegos: [],
            fechaCreacion: serverTimestamp(),
        });
        form.reset();
    }
});

const jugadoresQuery = query(collection(db, "Jugadores"), orderBy("nombre"));

onSnapshot(collection(db, "Jugadores"), async (snapshot) => {
    listaJugadores.innerHTML = "";
    const contador = await contarParticipacionesHoy();

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const vecesJugado = contador[docSnap.id] || 0;

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";

        li.innerHTML = `
        <div class="d-flex align-items-center flex-wrap">
            <strong class="me-2">${data.nombre}</strong>
            <span class="badge bg-secondary me-3 mt-1 mt-sm-0">${vecesJugado} jugada(s) hoy</span>
        </div>
        <div class="d-flex mt-2 mt-sm-0">
            <button class="btn btn-sm btn-primary me-2 editar-btn" title="Editar">
            <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger eliminar-btn" title="Eliminar">
            <i class="fas fa-trash"></i>
            </button>
        </div>
        `;

        listaJugadores.appendChild(li);
        //* --- Eventos ---
        const editarBtn = li.querySelector(".editar-btn");
        editarBtn.addEventListener("click", async () => {
            const nuevoNombre = prompt("Nuevo nombre del jugador:", data.nombre);
            if (nuevoNombre && nuevoNombre.trim() !== "") {
                const jugadorRef = doc(db, "Jugadores", docSnap.id);
                await updateDoc(jugadorRef, { nombre: nuevoNombre.trim() });
            }
        });

        const eliminarBtn = li.querySelector(".eliminar-btn");
        eliminarBtn.addEventListener("click", async () => {
            if (confirm(`¿Estás seguro de eliminar a "${data.nombre}"?`)) {
                const jugadorRef = doc(db, "Jugadores", docSnap.id);
                await deleteDoc(jugadorRef);
            }
        });
    });
});

