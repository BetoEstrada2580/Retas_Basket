import { db } from "../../firebase-config.js";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const buscador = document.getElementById("buscador");
const listaSeleccion = document.getElementById("lista-seleccion");
const guardarEquipoBtn = document.getElementById("guardar-equipo");
const nuevoEquipoBtn = document.getElementById("nuevo-equipo");
const listaEquipos = document.getElementById("lista-equipos");

let todosLosJugadores = [];
let seleccionados = {}; // objeto con { id: { id, nombre } }
let equipoEditando = null; // null si estamos creando uno nuevo

const jugadoresQuery = query(collection(db, "Jugadores"), orderBy("nombre"));

onSnapshot(jugadoresQuery, (snapshot) => {
    todosLosJugadores = [];
    snapshot.forEach((docSnap) => {
        todosLosJugadores.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderLista(todosLosJugadores);
});

function renderLista(jugadoresFiltrados) {
    listaSeleccion.innerHTML = "";

    jugadoresFiltrados.forEach((jugador) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "form-check-input me-2";
        checkbox.checked = seleccionados[jugador.id] !== undefined;

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                seleccionados[jugador.id] = {
                    id: jugador.id,
                    nombre: jugador.nombre
                };
            } else {
                delete seleccionados[jugador.id];
            }
            actualizarBotones();
        });

        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(jugador.nombre));
        listaSeleccion.appendChild(li);
    });

    actualizarBotones();
}

buscador.addEventListener("input", () => {
    const filtro = buscador.value.trim().toLowerCase();
    const filtrados = todosLosJugadores.filter(j =>
        j.nombre.toLowerCase().includes(filtro)
    );
    renderLista(filtrados);
});

function actualizarBotones() {
    guardarEquipoBtn.disabled = Object.keys(seleccionados).length < 3;
    nuevoEquipoBtn.classList.toggle("d-none", equipoEditando === null);
}

guardarEquipoBtn.addEventListener("click", async () => {
    const jugadoresArray = Object.values(seleccionados);
    if (jugadoresArray.length < 3) return;

    if (equipoEditando) {
        const equipoRef = doc(db, "Equipos", equipoEditando);
        await updateDoc(equipoRef, { jugadores: jugadoresArray });
        alert("Equipo actualizado");
    } else {
        await addDoc(collection(db, "Equipos"), {
            jugadores: jugadoresArray,
            fechaCreacion: serverTimestamp()
        });
        alert("Equipo guardado");
    }

    limpiarEstado();
});

nuevoEquipoBtn.addEventListener("click", () => {
    limpiarEstado();
});

function limpiarEstado() {
    equipoEditando = null;
    seleccionados = {};
    buscador.value = "";
    renderLista(todosLosJugadores);
    actualizarBotones();
}

// Mostrar lista de equipos
const equiposQuery = query(collection(db, "Equipos"), orderBy("fechaCreacion"));

onSnapshot(equiposQuery, (snapshot) => {
    listaEquipos.innerHTML = "";
    let index = 1;
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const equipoId = docSnap.id;

        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";

        const hora = data.fechaCreacion?.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        }) || "Sin hora";

        const nombres = data.jugadores
        .slice()
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map(j => j.nombre)
        .join(", ");

        li.innerHTML = `
        <div>
            <strong>Equipo ${index}</strong> - ${hora}<br>
            <small>${nombres}</small>
        </div>
        `;

        const editarBtn = document.createElement("button");
        editarBtn.className = "btn btn-sm btn-primary mt-2";
        editarBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editarBtn.addEventListener("click", () => {
            equipoEditando = equipoId;
            seleccionados = {};
            for (const j of data.jugadores) {
                seleccionados[j.id] = { id: j.id, nombre: j.nombre };
            }
            buscador.value = "";
            renderLista(todosLosJugadores);
            document.getElementById("collapseSeleccion").classList.add("show");
        });

        li.appendChild(editarBtn);
        listaEquipos.appendChild(li);
        index++;
    });
});
