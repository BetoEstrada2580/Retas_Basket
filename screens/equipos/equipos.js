import { db } from "../../firebase-config.js";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
    getDocs,
    updateDoc,
    deleteDoc,
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

// Contar victorias por equipo
async function contarVictoriasPorEquipo() {
    const partidosSnap = await getDocs(collection(db, "Partidos"));
    const conteo = {};
    partidosSnap.forEach(doc => {
        const partido = doc.data();
        const ganadorId = partido.ganadorId;
        if (ganadorId) {
            conteo[ganadorId] = (conteo[ganadorId] || 0) + 1;
        }
    });
    return conteo; // { equipoId1: 2, equipoId2: 5, ... }
}

// Escuchar cambios en la colección de jugadores
onSnapshot(jugadoresQuery, (snapshot) => {
    todosLosJugadores = [];
    snapshot.forEach((docSnap) => {
        todosLosJugadores.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderLista(todosLosJugadores);
});

// Escuchar cambios en la colección de equipos
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

// Filtrar jugadores por nombre
buscador.addEventListener("input", () => {
    const filtro = buscador.value.trim().toLowerCase();
    const filtrados = todosLosJugadores.filter(j =>
        j.nombre.toLowerCase().includes(filtro)
    );
    renderLista(filtrados);
});

// Actualizar botones según la selección
function actualizarBotones() {
    guardarEquipoBtn.disabled = Object.keys(seleccionados).length < 3;
    nuevoEquipoBtn.classList.toggle("d-none", equipoEditando === null);
}

// Guardar o actualizar el equipo
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

// Botón para crear un nuevo equipo
nuevoEquipoBtn.addEventListener("click", () => {
    limpiarEstado();
});

// Limpiar el estado de edición
function limpiarEstado() {
    equipoEditando = null;
    seleccionados = {};
    buscador.value = "";
    renderLista(todosLosJugadores);
    actualizarBotones();
}

// Mostrar lista de equipos
const equiposQuery = query(collection(db, "Equipos"), orderBy("fechaCreacion"));

// Escuchar cambios en la colección de equipos
onSnapshot(equiposQuery, async (snapshot) => {
    listaEquipos.innerHTML = "";
    let index = 1;
    const victoriasPorEquipo = await contarVictoriasPorEquipo();
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const equipoId = docSnap.id;
        const victorias = victoriasPorEquipo[equipoId] || 0;

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
        <div class="d-flex align-items-center flex-wrap">
            <div>
                <strong>Equipo ${index}</strong> - ${hora}<br>
                <small>${nombres}</small>
                <span class="badge bg-success">${victorias} victoria(s)</span>
            </div>
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

        const editarBtn = li.querySelector(".editar-btn");
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

        const eliminarBtn = li.querySelector(".eliminar-btn");
        eliminarBtn.addEventListener("click", async () => {
            if (confirm(`¿Estás seguro de eliminar al equipo?`)) {
                const EquiposRef = doc(db, "Equipos", docSnap.id);
                await deleteDoc(EquiposRef);
            }
        });

        listaEquipos.appendChild(li);
        index++;
    });
});
