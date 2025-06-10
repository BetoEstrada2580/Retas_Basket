import { db } from "../../firebase-config.js";
import {
    collection,
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const equipoASelect = document.getElementById("equipoA");
const equipoBSelect = document.getElementById("equipoB");
const iniciarBtn = document.getElementById("iniciar-partido");
const partidoActual = document.getElementById("partido-actual");
const equipoAInfo = document.getElementById("equipoA-info");
const equipoBInfo = document.getElementById("equipoB-info");
const ganadorABtn = document.getElementById("ganadorA");
const ganadorBBtn = document.getElementById("ganadorB");

let equiposDisponibles = [];
let equipoA = null;
let equipoB = null;

onSnapshot(collection(db, "Equipos"), (snapshot) => {
    equiposDisponibles = [];
    equipoASelect.innerHTML = '<option value="">-- Equipo A --</option>';
    equipoBSelect.innerHTML = '<option value="">-- Equipo B --</option>';

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        equiposDisponibles.push({ id: docSnap.id, ...data });

        const optionA = document.createElement("option");
        optionA.value = docSnap.id;
        optionA.textContent = data.jugadores
            .map((j) => j.nombre)
            .sort()
            .join(", ");
        equipoASelect.appendChild(optionA);

        const optionB = optionA.cloneNode(true);
        equipoBSelect.appendChild(optionB);

        // Autoseleccionar si están activos
        if (data.equipoActivo) {
            if (!equipoASelect.value) equipoASelect.value = docSnap.id;
            else equipoBSelect.value = docSnap.id;
        }
    });

    actualizarBotonIniciar();
});

function actualizarBotonIniciar() {
    iniciarBtn.disabled =
        !equipoASelect.value ||
        !equipoBSelect.value ||
        equipoASelect.value === equipoBSelect.value;
}

equipoASelect.addEventListener("change", actualizarBotonIniciar);
equipoBSelect.addEventListener("change", actualizarBotonIniciar);

iniciarBtn.addEventListener("click", async () => {
    const idA = equipoASelect.value;
    const idB = equipoBSelect.value;

    const snapA = await getDoc(doc(db, "Equipos", idA));
    const snapB = await getDoc(doc(db, "Equipos", idB));

    equipoA = { id: idA, ...snapA.data() };
    equipoB = { id: idB, ...snapB.data() };

    // Marcar como activos
    await updateDoc(doc(db, "Equipos", idA), { equipoActivo: true });
    await updateDoc(doc(db, "Equipos", idB), { equipoActivo: true });

    mostrarPartido();
});

function mostrarPartido() {
    equipoAInfo.innerHTML = `<strong>Equipo A</strong><br>${equipoA.jugadores
        .map((j) => j.nombre)
        .sort()
        .join(", ")}`;
    equipoBInfo.innerHTML = `<strong>Equipo B</strong><br>${equipoB.jugadores
        .map((j) => j.nombre)
        .sort()
        .join(", ")}`;
    partidoActual.classList.remove("d-none");
}

async function declararGanador(ganaA) {
    const ganador = ganaA ? "A" : "B";
    const perdedorId = ganaA ? equipoB.id : equipoA.id;
    const ganadorId = ganaA ? equipoA.id : equipoB.id;

    // Guardar historial
    await addDoc(collection(db, "Partidos"), {
        fecha: serverTimestamp(),
        equipoA: { id: equipoA.id, jugadores: equipoA.jugadores },
        equipoB: { id: equipoB.id, jugadores: equipoB.jugadores },
        ganador,
        ganadorId,
    });

    // Limpiar equipo activo en perdedor
    await updateDoc(doc(db, "Equipos", perdedorId), { equipoActivo: false });

    alert(`¡Ganó el Equipo ${ganador}!`);
    if (ganador === "A") equipoB = null;
    else equipoA = null;

    seleccionarNuevoRetador();
}

ganadorABtn.addEventListener("click", () => declararGanador(true));
ganadorBBtn.addEventListener("click", () => declararGanador(false));

function seleccionarNuevoRetador() {
    // Mostrar solo un equipo como ganador y permitir elegir al retador
    if (equipoA) {
        equipoBSelect.value = "";
        equipoASelect.value = equipoA.id;
    } else if (equipoB) {
        equipoASelect.value = "";
        equipoBSelect.value = equipoB.id;
    }

    equipoAInfo.innerHTML = equipoA
        ? `<strong>Equipo A</strong><br>${equipoA.jugadores
            .map((j) => j.nombre)
            .sort()
            .join(", ")}`
        : "";
    equipoBInfo.innerHTML = equipoB
        ? `<strong>Equipo B</strong><br>${equipoB.jugadores
            .map((j) => j.nombre)
            .sort()
            .join(", ")}`
        : "";

    iniciarBtn.disabled = true;
    partidoActual.classList.add("d-none");

    alert("Selecciona el nuevo equipo retador para continuar el partido.");
}

const historialLista = document.getElementById("historial-partidos");

onSnapshot(collection(db, "Partidos"), (snapshot) => {
    const partidos = [];

    snapshot.forEach((docSnap) => {
        partidos.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Ordenar por fecha de creación (ascendente)
    partidos.sort((a, b) => a.fecha?.seconds - b.fecha?.seconds);

    historialLista.innerHTML = "";

    partidos.forEach((p, index) => {
        const fecha = p.fecha?.toDate();
        const hora = fecha
            ? fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Hora desconocida";

        const jugadoresA = p.equipoA.jugadores
            .map((j) => j.nombre)
            .sort()
            .join(", ");
        const jugadoresB = p.equipoB.jugadores
            .map((j) => j.nombre)
            .sort()
            .join(", ");
        const ganador = p.ganador === "A" ? "Equipo A" : "Equipo B";

        const li = document.createElement("li");
        li.className = "list-group-item";

        li.innerHTML = `
        ${hora}<br>
        <strong>Equipo A:</strong> ${jugadoresA}<br>
        <strong>Equipo B:</strong> ${jugadoresB}<br>
        <strong>Ganador:</strong> ${ganador}
        `;

        historialLista.appendChild(li);
    });
});
