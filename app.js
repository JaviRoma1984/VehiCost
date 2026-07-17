const STORAGE_KEYS = {
    vehicles: 'vehicost_vehicles',
    repostajes: 'vehicost_repostajes',
    theme: 'vehicost_theme',
    lastVehicleId: 'vehicost_lastVehicleId',
    seeded: 'vehicost_seeded',
    gastosGenerales: 'vehicost_gastosGenerales',
    mantenimientos: 'vehicost_mantenimientos',
};

const PANEL_IDS = [
    'vehicleSelectorPanel',
    'vehicleListPanel',
    'createVehicleFormPanel',
    'repostajeFormPanel',
    'repostajeListPanel',
    'repostajeDetailPanel',
    'gastosGeneralesFormPanel',
    'maintenanceMenuPanel',
    'maintenanceListPanel',
    'maintenanceFormPanel',
    'itvFormPanel',
    'financiacionFormPanel',
    'rentingFormPanel',
    'leasingFormPanel',
];

const FRECUENCIA_MESES = { mensual: 1, trimestral: 3, anual: 12 };

// Paneles junto a los que debe aparecer, debajo, el resumen de consumo del vehículo seleccionado.
const SUMMARY_VISIBLE_WITH = ['vehicleSelectorPanel', 'repostajeFormPanel', 'repostajeListPanel'];

let selectedVehicleId = null;
let editingVehicleId = null; // null = formulario en modo "crear"; si no, id del vehículo que se está editando
let gastosGeneralesReturnPanel = 'vehicleSelectorPanel'; // panel al que volver al salir de "Gastos generales"
let editingMaintenanceId = null; // null = alta de mantenimiento; si no, id del que se está editando
let maintenanceFormReturnPanel = 'gastosGeneralesFormPanel'; // panel al que volver al salir del formulario de mantenimiento
let selectedRepostajeId = null; // id del repostaje que se está viendo/editando en el panel de detalle

// ==========================================
// PERSISTENCIA (localStorage)
// ==========================================

function loadVehicles() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.vehicles) || '[]');
}

function saveVehicles(vehicles) {
    localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(vehicles));
}

function loadRepostajes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.repostajes) || '[]');
}

function saveRepostajes(repostajes) {
    localStorage.setItem(STORAGE_KEYS.repostajes, JSON.stringify(repostajes));
}

function nextId(items) {
    return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function loadGastosGenerales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.gastosGenerales) || '{}');
}

function saveGastosGenerales(all) {
    localStorage.setItem(STORAGE_KEYS.gastosGenerales, JSON.stringify(all));
}

function getGastosGeneralesForVehicle(vehicleId) {
    const all = loadGastosGenerales();
    const raw = all[vehicleId] || {};
    return {
        seguroAnual: raw.seguroAnual || 0,
        ivtmAnual: raw.ivtmAnual || 0,
        itv: raw.itv || { cantidad: 0, fechaCaducidad: '', aviso1Mes: true, aviso15Dias: true },
        financiacion: raw.financiacion || { gastoMensual: 0, mesInicio: '' },
        renting: raw.renting || { frecuencia: 'mensual', cantidad: 0, mesInicio: '' },
        leasing: raw.leasing || { frecuencia: 'mensual', cantidad: 0, mesInicio: '' },
    };
}

function loadMantenimientos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.mantenimientos) || '[]');
}

function saveMantenimientos(list) {
    localStorage.setItem(STORAGE_KEYS.mantenimientos, JSON.stringify(list));
}

function getMantenimientosForVehicle(vehicleId) {
    return loadMantenimientos()
        .filter(m => m.vehicleId === vehicleId)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function seedDataIfEmpty() {
    // Solo precarga los vehículos de ejemplo la primera vez que se usa la app,
    // nunca más (aunque el usuario borre después todos sus vehículos).
    if (localStorage.getItem(STORAGE_KEYS.seeded)) return;
    localStorage.setItem(STORAGE_KEYS.seeded, 'true');

    if (loadVehicles().length > 0) return;
    saveVehicles([
        { id: 1, vehicleType: '🚗 Coche', name: 'Sedán Familiar', licensePlate: '1234ABC', brand: 'Toyota', model: 'Corolla', year: 2020, fuelType: 'Gasolina', description: 'Vehículo familiar, 5 puertas, color blanco' },
        { id: 2, vehicleType: '🏍️ Motocicleta', name: 'Naked Deportiva', licensePlate: '5678DEF', brand: 'Ford', model: 'Focus', year: 2019, fuelType: 'Diésel', description: 'Compacto diésel, bajo consumo' },
        { id: 3, vehicleType: '🚗 Coche', name: 'Eléctrico Premium', licensePlate: '9012GHI', brand: 'Tesla', model: 'Model 3', year: 2022, fuelType: 'Eléctrico', description: '100% eléctrico, autonomía 500km' },
    ]);
}

// ==========================================
// CÁLCULO DE CONSUMO
// ==========================================

function getHistorialConConsumo(vehicleId) {
    const repostajes = loadRepostajes()
        .filter(r => r.vehicleId === vehicleId)
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

    const resultado = [];
    let consumoAnterior = null;

    repostajes.forEach((actual, i) => {
        let consumo = null;

        if (i > 0) {
            const kmRecorridos = actual.kmActuales - repostajes[i - 1].kmActuales;
            if (kmRecorridos > 0) {
                consumo = Math.round((actual.litros / kmRecorridos) * 100 * 100) / 100;
            }
        }

        const esMejor = consumo === null || consumoAnterior === null || consumo <= consumoAnterior;
        resultado.push({ repostaje: actual, consumo, esMejor });

        if (consumo !== null) consumoAnterior = consumo;
    });

    return resultado;
}

function average(values) {
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function getConsumoMedioTotal(vehicleId) {
    const valores = getHistorialConConsumo(vehicleId).filter(h => h.consumo !== null).map(h => h.consumo);
    const avg = average(valores);
    return avg === null ? null : Math.round(avg * 100) / 100;
}

function getConsumoMedioMensual(vehicleId) {
    const haceUnMes = new Date();
    haceUnMes.setDate(haceUnMes.getDate() - 30);

    const valores = getHistorialConConsumo(vehicleId)
        .filter(h => h.consumo !== null && new Date(h.repostaje.fechaHora) >= haceUnMes)
        .map(h => h.consumo);

    const avg = average(valores);
    return avg === null ? null : Math.round(avg * 100) / 100;
}

// Gasto medio mensual: agrupa el coste de los repostajes por mes natural y promedia
// solo entre los meses en los que hubo al menos un repostaje.
function getGastoMedioMensual(vehicleId) {
    const repostajes = loadRepostajes().filter(r => r.vehicleId === vehicleId);
    if (repostajes.length === 0) return null;

    const gastoPorMes = {};
    repostajes.forEach(r => {
        const fecha = new Date(r.fechaHora);
        const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        gastoPorMes[clave] = (gastoPorMes[clave] || 0) + (r.litros * r.precioPorLitro);
    });

    const totalesPorMes = Object.values(gastoPorMes);
    return Math.round((totalesPorMes.reduce((a, b) => a + b, 0) / totalesPorMes.length) * 100) / 100;
}

// Cuenta cuántos pagos han vencido dentro de "anio" para un gasto periódico que empezó en
// "mesInicioStr" (formato "YYYY-MM", de un <input type="month">) con periodicidad de
// "frecuenciaMeses" meses (1 = mensual, 3 = trimestral, 12 = anual), sin contar pagos futuros.
function contarPagosEnAnio(mesInicioStr, frecuenciaMeses, anio) {
    if (!mesInicioStr) return 0;
    const [inicioYear, inicioMonth] = mesInicioStr.split('-').map(Number);
    if (!inicioYear || !inicioMonth) return 0;

    const ahora = new Date();
    const limite = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    let count = 0;
    let cursor = new Date(inicioYear, inicioMonth - 1, 1);
    let guard = 0;
    while (cursor <= limite && guard < 2000) {
        if (cursor.getFullYear() === anio) count++;
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + frecuenciaMeses, 1);
        guard++;
    }
    return count;
}

// Gasto total del año en curso (1 de enero, incluido, hasta hoy) para el vehículo:
// repostajes + gastos de mantenimiento + gastos generales (seguro, IVTM, ITV, financiación,
// renting y leasing, estos tres últimos calculados según su mes de inicio y periodicidad).
function getGastoTotalAnualAcumulado(vehicleId) {
    const ahora = new Date();
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1);
    const anioActual = ahora.getFullYear();

    const totalRepostajes = loadRepostajes()
        .filter(r => r.vehicleId === vehicleId)
        .filter(r => { const d = new Date(r.fechaHora); return d >= inicioAnio && d <= ahora; })
        .reduce((sum, r) => sum + (r.litros * r.precioPorLitro), 0);

    const totalMantenimientos = getMantenimientosForVehicle(vehicleId)
        .filter(m => { const d = new Date(m.fecha); return d >= inicioAnio && d <= ahora; })
        .reduce((sum, m) => sum + m.cantidad, 0);

    const generales = getGastosGeneralesForVehicle(vehicleId);

    const pagosFinanciacion = contarPagosEnAnio(generales.financiacion.mesInicio, 1, anioActual);
    const totalFinanciacion = pagosFinanciacion * (generales.financiacion.gastoMensual || 0);

    const pagosRenting = contarPagosEnAnio(generales.renting.mesInicio, FRECUENCIA_MESES[generales.renting.frecuencia] || 1, anioActual);
    const totalRenting = pagosRenting * (generales.renting.cantidad || 0);

    const pagosLeasing = contarPagosEnAnio(generales.leasing.mesInicio, FRECUENCIA_MESES[generales.leasing.frecuencia] || 1, anioActual);
    const totalLeasing = pagosLeasing * (generales.leasing.cantidad || 0);

    const total = totalRepostajes + totalMantenimientos +
        (generales.seguroAnual || 0) + (generales.ivtmAnual || 0) + (generales.itv.cantidad || 0) +
        totalFinanciacion + totalRenting + totalLeasing;

    return Math.round(total * 100) / 100;
}

// ==========================================
// TEMA CLARO / OSCURO
// ==========================================

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggleButton').textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEYS.theme, theme);

    // Refuerzo: fuerza el repintado del fondo del body (en algunos navegadores
    // no se recalcula solo al cambiar la variable CSS del elemento raíz).
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
    document.body.style.backgroundColor = bg;
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ==========================================
// CAMBIO ENTRE PANELES
// ==========================================

function showOnly(panelId) {
    PANEL_IDS.forEach(id => {
        document.getElementById(id).style.display = (id === panelId) ? '' : 'none';
    });
    updateConsumptionSummary(panelId);
}

function updateConsumptionSummary(activePanelId) {
    const summaryPanel = document.getElementById('consumptionSummaryPanel');
    const expensesPanel = document.getElementById('otherExpensesSummaryPanel');

    if (!selectedVehicleId || !SUMMARY_VISIBLE_WITH.includes(activePanelId)) {
        summaryPanel.style.display = 'none';
        expensesPanel.style.display = 'none';
        return;
    }

    const gastoMensual = getGastoMedioMensual(selectedVehicleId);
    document.getElementById('gastoMedioMensualLabel').textContent = gastoMensual !== null ? `${gastoMensual.toFixed(2)} €` : '—';
    summaryPanel.style.display = '';

    document.getElementById('annualExpensesValue').textContent = `${getGastoTotalAnualAcumulado(selectedVehicleId).toFixed(2)} €`;
    expensesPanel.style.display = '';
}

function createRepostajeRowElement(h) {
    const fecha = new Date(h.repostaje.fechaHora);
    const fechaTexto = fecha.toLocaleDateString('es-ES');
    const horaTexto = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const consumoTexto = h.consumo !== null ? `${h.consumo.toFixed(2)} L/100km` : 'Sin datos';
    const colorClass = h.consumo === null ? 'consumo-neutro' : (h.esMejor ? 'consumo-verde' : 'consumo-rojo');
    const importe = (h.repostaje.litros * h.repostaje.precioPorLitro).toFixed(2);

    const row = document.createElement('div');
    row.className = 'list-item list-item--clickable';
    row.innerHTML = `
        <div class="list-item__info">
            <div class="list-item__title">${fechaTexto} <span class="list-item__time">${horaTexto}</span></div>
            <div class="list-item__subtitle">${h.repostaje.litros.toFixed(2)} L · ${h.repostaje.precioPorLitro.toFixed(3)} €/L</div>
        </div>
        <div class="list-item__stats">
            <div class="list-item__amount">${importe} €</div>
            <div class="list-item__consumo ${colorClass}">${consumoTexto}</div>
        </div>
    `;
    row.addEventListener('click', () => showRepostajeDetail(h.repostaje.id));
    return row;
}

// ==========================================
// SELECTOR DE VEHÍCULO
// ==========================================

// El tipo de vehículo se guarda como "🚗 Coche", "🏍️ Motocicleta", etc.
// En el desplegable solo queremos el icono (el texto ya es redundante con él).
function getVehicleTypeIcon(vehicleType) {
    return (vehicleType || '').split(' ')[0];
}

function renderVehiclePicker() {
    const vehicles = loadVehicles();
    const picker = document.getElementById('vehiclePicker');

    picker.innerHTML = '<option value="" disabled selected>Selecciona tu vehículo</option>';
    vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${getVehicleTypeIcon(v.vehicleType)} ${v.name} - ${v.licensePlate}`;
        picker.appendChild(opt);
    });

    // Selección por defecto: el último vehículo consultado si sigue existiendo,
    // si no el primero de la lista, si no ninguno (placeholder).
    const lastId = Number(localStorage.getItem(STORAGE_KEYS.lastVehicleId));
    const defaultVehicle = vehicles.find(v => v.id === lastId) || vehicles[0] || null;

    if (defaultVehicle) {
        picker.value = defaultVehicle.id;
        applySelectedVehicle(defaultVehicle.id);
    } else {
        selectedVehicleId = null;
        document.getElementById('repostajeActionsPanel').style.display = 'none';
    }
}

function onVehicleSelected() {
    const picker = document.getElementById('vehiclePicker');
    applySelectedVehicle(picker.value ? Number(picker.value) : null);
}

function applySelectedVehicle(vehicleId) {
    selectedVehicleId = vehicleId;

    if (!selectedVehicleId) {
        document.getElementById('repostajeActionsPanel').style.display = 'none';
        updateConsumptionSummary('vehicleSelectorPanel');
        updateItvReminder();
        return;
    }

    localStorage.setItem(STORAGE_KEYS.lastVehicleId, String(selectedVehicleId));
    document.getElementById('repostajeActionsPanel').style.display = '';
    updateConsumoLabels();
    updateConsumptionSummary('vehicleSelectorPanel');
    updateItvReminder();
}

function updateConsumoLabels() {
    const mensual = getConsumoMedioMensual(selectedVehicleId);
    const total = getConsumoMedioTotal(selectedVehicleId);

    document.getElementById('consumoMensual').textContent = mensual !== null ? `${mensual.toFixed(2)} L/100km` : '—';
    document.getElementById('consumoTotal').textContent = total !== null ? `${total.toFixed(2)} L/100km` : '—';
}

// ==========================================
// MENÚ HAMBURGUESA
// ==========================================

function toggleMenu(forceClose) {
    const overlay = document.getElementById('menuOverlay');
    if (forceClose) {
        overlay.classList.remove('open');
    } else {
        overlay.classList.toggle('open');
    }
}

// ==========================================
// LISTA DE VEHÍCULOS / BORRADO
// ==========================================

function renderVehicleList() {
    const vehicles = loadVehicles();
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';

    if (vehicles.length === 0) {
        container.innerHTML = '<p class="empty-text">No hay vehículos registrados.</p>';
        return;
    }

    vehicles.forEach(v => {
        const row = document.createElement('div');
        row.className = 'list-item';
        row.innerHTML = `
            <div class="list-item__info">
                <div class="list-item__title">${v.vehicleType} ${v.name} - ${v.licensePlate}</div>
                <div class="list-item__subtitle">${v.brand} ${v.model} (${v.year})</div>
            </div>
            <div class="list-item__actions">
                <button class="icon-btn icon-btn--edit" data-id="${v.id}" data-action="edit" aria-label="Editar vehículo">✏️</button>
                <button class="icon-btn" data-id="${v.id}" data-action="delete" aria-label="Borrar vehículo">🗑️</button>
            </div>
        `;
        container.appendChild(row);
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => onDeleteVehicle(Number(btn.dataset.id)));
    });
    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => onEditVehicle(Number(btn.dataset.id)));
    });
}

function onDeleteVehicle(vehicleId) {
    const vehicles = loadVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const confirmado = confirm(
        `¿Seguro que quieres borrar el vehículo "${vehicle.name}" (${vehicle.licensePlate})?\n\n` +
        `Se borrarán también todos sus repostajes registrados.`
    );
    if (!confirmado) return;

    saveVehicles(vehicles.filter(v => v.id !== vehicleId));
    saveRepostajes(loadRepostajes().filter(r => r.vehicleId !== vehicleId));

    if (selectedVehicleId === vehicleId) selectedVehicleId = null;

    renderVehiclePicker();
    renderVehicleList();
}

function onEditVehicle(vehicleId) {
    const vehicle = loadVehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    editingVehicleId = vehicle.id;

    document.getElementById('createVehicleFormTitle').textContent = '✏️ Editar Vehículo';
    document.getElementById('vehicleNameInput').value = vehicle.name;
    document.getElementById('licensePlateInput').value = vehicle.licensePlate;
    document.getElementById('brandInput').value = vehicle.brand;
    document.getElementById('modelInput').value = vehicle.model;
    document.getElementById('vehicleTypeSelect').value = vehicle.vehicleType;
    document.getElementById('yearInput').value = vehicle.year;
    document.getElementById('vehicleFuelTypeSelect').value = vehicle.fuelType;
    document.getElementById('descriptionInput').value = vehicle.description || '';
    document.getElementById('createVehicleMessage').style.display = 'none';

    showOnly('createVehicleFormPanel');
}

// ==========================================
// FORMULARIO: CREAR / EDITAR VEHÍCULO
// ==========================================

function clearCreateVehicleForm() {
    editingVehicleId = null;
    document.getElementById('createVehicleFormTitle').textContent = '🚗 Nuevo Vehículo';
    document.getElementById('vehicleNameInput').value = '';
    document.getElementById('licensePlateInput').value = '';
    document.getElementById('brandInput').value = '';
    document.getElementById('modelInput').value = '';
    document.getElementById('vehicleTypeSelect').selectedIndex = 0;
    document.getElementById('yearInput').value = '';
    document.getElementById('vehicleFuelTypeSelect').selectedIndex = 0;
    document.getElementById('descriptionInput').value = '';
    document.getElementById('createVehicleMessage').style.display = 'none';
}

function showCreateVehicleError(message) {
    const el = document.getElementById('createVehicleMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

// Adónde volver al pulsar "Volver"/"Cancelar" en el formulario de vehículo:
// a la lista si veníamos de editar, al panel principal si veníamos de crear.
function exitVehicleForm() {
    const wasEditing = editingVehicleId !== null;
    editingVehicleId = null;

    if (wasEditing) {
        renderVehicleList();
        showOnly('vehicleListPanel');
    } else {
        showOnly('vehicleSelectorPanel');
    }
}

function onSaveVehicle() {
    const name = document.getElementById('vehicleNameInput').value.trim();
    const plate = document.getElementById('licensePlateInput').value.trim().toUpperCase();
    const brand = document.getElementById('brandInput').value.trim();
    const model = document.getElementById('modelInput').value.trim();
    const vehicleType = document.getElementById('vehicleTypeSelect').value;
    const yearStr = document.getElementById('yearInput').value.trim();
    const fuelType = document.getElementById('vehicleFuelTypeSelect').value;
    const description = document.getElementById('descriptionInput').value.trim();

    const currentYear = new Date().getFullYear();
    const year = parseInt(yearStr, 10);

    if (!name) return showCreateVehicleError('El nombre del vehículo es obligatorio.');
    if (!plate) return showCreateVehicleError('La matrícula es obligatoria.');
    if (!brand) return showCreateVehicleError('La marca es obligatoria.');
    if (!model) return showCreateVehicleError('El modelo es obligatorio.');
    if (!vehicleType) return showCreateVehicleError('Debes seleccionar un tipo de vehículo.');
    if (!yearStr || isNaN(year) || year < 1900 || year > currentYear + 1) {
        return showCreateVehicleError(`El año debe ser un número válido entre 1900 y ${currentYear + 1}.`);
    }
    if (!fuelType) return showCreateVehicleError('Debes seleccionar un tipo de combustible.');

    const vehicles = loadVehicles();

    if (editingVehicleId !== null) {
        const existing = vehicles.find(v => v.id === editingVehicleId);
        if (!existing) return;
        Object.assign(existing, { vehicleType, name, licensePlate: plate, brand, model, year, fuelType, description });
        saveVehicles(vehicles);

        renderVehiclePicker();
        alert(`✅ Vehículo "${existing.name}" actualizado correctamente.`);
        exitVehicleForm();
        return;
    }

    const vehicle = { id: nextId(vehicles), vehicleType, name, licensePlate: plate, brand, model, year, fuelType, description };
    vehicles.push(vehicle);
    saveVehicles(vehicles);

    renderVehiclePicker();
    alert(`✅ Vehículo "${vehicle.name}" guardado correctamente.`);
    showOnly('vehicleSelectorPanel');
}

// ==========================================
// FORMULARIO: NUEVO REPOSTAJE
// ==========================================

function parseNumber(text) {
    const value = parseFloat(String(text).replace(',', '.'));
    return isNaN(value) ? 0 : value;
}

function showRepostajeForm() {
    if (!selectedVehicleId) return;
    const vehicle = loadVehicles().find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    document.getElementById('repostajeFormTitle').textContent = `⛽ Nuevo Repostaje — ${vehicle.name}`;
    document.getElementById('kmActualesInput').value = '';
    document.getElementById('litrosInput').value = '';
    document.getElementById('precioPorLitroInput').value = '';
    document.getElementById('costeTotalDisplay').textContent = '0.00 €';
    document.getElementById('repostajeMessage').style.display = 'none';

    // Prerellena con el combustible ya registrado del vehículo (editable).
    const fuelSelect = document.getElementById('repostajeFuelTypeSelect');
    fuelSelect.value = vehicle.fuelType;
    if (fuelSelect.value !== vehicle.fuelType) fuelSelect.selectedIndex = 0;

    const now = new Date();
    document.getElementById('fechaInput').value = now.toISOString().slice(0, 10);
    document.getElementById('horaInput').value = now.toTimeString().slice(0, 5);

    showOnly('repostajeFormPanel');
}

function updateCosteTotal() {
    const litros = parseNumber(document.getElementById('litrosInput').value);
    const precio = parseNumber(document.getElementById('precioPorLitroInput').value);
    document.getElementById('costeTotalDisplay').textContent = `${(litros * precio).toFixed(2)} €`;
}

function showRepostajeError(message) {
    const el = document.getElementById('repostajeMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

function onSaveRepostaje() {
    if (!selectedVehicleId) return;

    const kmStr = document.getElementById('kmActualesInput').value.trim();
    const km = parseInt(kmStr, 10);
    const litros = parseNumber(document.getElementById('litrosInput').value);
    const fuelType = document.getElementById('repostajeFuelTypeSelect').value;
    const precio = parseNumber(document.getElementById('precioPorLitroInput').value);
    const fecha = document.getElementById('fechaInput').value;
    const hora = document.getElementById('horaInput').value;

    if (!kmStr || isNaN(km)) return showRepostajeError('Introduce un valor válido de km actuales.');
    if (!litros || litros <= 0) return showRepostajeError('Introduce una cantidad de litros válida.');
    if (!fuelType) return showRepostajeError('Selecciona el tipo de combustible.');
    if (!precio || precio <= 0) return showRepostajeError('Introduce un precio por litro válido.');
    if (!fecha) return showRepostajeError('Selecciona una fecha.');

    const fechaHora = new Date(`${fecha}T${hora || '00:00'}:00`);

    const repostajes = loadRepostajes();
    const repostaje = {
        id: nextId(repostajes),
        vehicleId: selectedVehicleId,
        fechaHora: fechaHora.toISOString(),
        kmActuales: km,
        litros,
        tipoCombustible: fuelType,
        precioPorLitro: precio,
    };
    repostajes.push(repostaje);
    saveRepostajes(repostajes);

    updateConsumoLabels();
    alert('✅ Repostaje guardado correctamente.');
    showOnly('vehicleSelectorPanel');
}

// ==========================================
// LISTA DE REPOSTAJES
// ==========================================

function showRepostajeList() {
    if (!selectedVehicleId) return;
    const vehicle = loadVehicles().find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    document.getElementById('repostajeListTitle').textContent = `REPOSTAJES — ${vehicle.name}`;

    const historial = getHistorialConConsumo(selectedVehicleId).slice().reverse();
    const container = document.getElementById('repostajesList');
    container.innerHTML = '';

    if (historial.length === 0) {
        container.innerHTML = '<p class="empty-text">Todavía no hay repostajes registrados para este vehículo.</p>';
    } else {
        historial.forEach(h => container.appendChild(createRepostajeRowElement(h)));
    }

    showOnly('repostajeListPanel');
}

// ==========================================
// DETALLE / EDICIÓN / BORRADO DE UN REPOSTAJE
// ==========================================

function showRepostajeDetail(repostajeId) {
    if (!selectedVehicleId) return;

    selectedRepostajeId = repostajeId;

    const h = getHistorialConConsumo(selectedVehicleId).find(item => item.repostaje.id === repostajeId);
    if (!h) return;
    const r = h.repostaje;

    const fecha = new Date(r.fechaHora);
    document.getElementById('detailFechaHora').textContent =
        `${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('detailKm').textContent = `${r.kmActuales} km`;
    document.getElementById('detailFuel').textContent = r.tipoCombustible;
    document.getElementById('detailLitros').textContent = `${r.litros.toFixed(2)} L`;
    document.getElementById('detailPrecio').textContent = `${r.precioPorLitro.toFixed(3)} €/L`;
    document.getElementById('detailCoste').textContent = `${(r.litros * r.precioPorLitro).toFixed(2)} €`;
    document.getElementById('detailConsumo').textContent = h.consumo !== null ? `${h.consumo.toFixed(2)} L/100km` : 'Sin datos';

    document.getElementById('repostajeDetailView').style.display = '';
    document.getElementById('repostajeDetailEdit').style.display = 'none';
    document.getElementById('repostajeDetailEditMessage').style.display = 'none';

    showOnly('repostajeDetailPanel');
}

function enterRepostajeEditMode() {
    const r = loadRepostajes().find(item => item.id === selectedRepostajeId);
    if (!r) return;

    const fecha = new Date(r.fechaHora);
    document.getElementById('editKmActualesInput').value = r.kmActuales;
    document.getElementById('editLitrosInput').value = r.litros;
    document.getElementById('editFuelTypeSelect').value = r.tipoCombustible;
    document.getElementById('editPrecioPorLitroInput').value = r.precioPorLitro;
    document.getElementById('editFechaInput').value = fecha.toISOString().slice(0, 10);
    document.getElementById('editHoraInput').value = fecha.toTimeString().slice(0, 5);
    updateEditCosteTotal();
    document.getElementById('repostajeDetailEditMessage').style.display = 'none';

    document.getElementById('repostajeDetailView').style.display = 'none';
    document.getElementById('repostajeDetailEdit').style.display = '';
}

function updateEditCosteTotal() {
    const litros = parseNumber(document.getElementById('editLitrosInput').value);
    const precio = parseNumber(document.getElementById('editPrecioPorLitroInput').value);
    document.getElementById('editCosteTotalDisplay').textContent = `${(litros * precio).toFixed(2)} €`;
}

function showRepostajeDetailEditError(message) {
    const el = document.getElementById('repostajeDetailEditMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

function onSaveRepostajeEdit() {
    if (selectedRepostajeId === null) return;

    const kmStr = document.getElementById('editKmActualesInput').value.trim();
    const km = parseInt(kmStr, 10);
    const litros = parseNumber(document.getElementById('editLitrosInput').value);
    const fuelType = document.getElementById('editFuelTypeSelect').value;
    const precio = parseNumber(document.getElementById('editPrecioPorLitroInput').value);
    const fecha = document.getElementById('editFechaInput').value;
    const hora = document.getElementById('editHoraInput').value;

    if (!kmStr || isNaN(km)) return showRepostajeDetailEditError('Introduce un valor válido de km actuales.');
    if (!litros || litros <= 0) return showRepostajeDetailEditError('Introduce una cantidad de litros válida.');
    if (!fuelType) return showRepostajeDetailEditError('Selecciona el tipo de combustible.');
    if (!precio || precio <= 0) return showRepostajeDetailEditError('Introduce un precio por litro válido.');
    if (!fecha) return showRepostajeDetailEditError('Selecciona una fecha.');

    const repostajes = loadRepostajes();
    const existing = repostajes.find(r => r.id === selectedRepostajeId);
    if (!existing) return;

    Object.assign(existing, {
        kmActuales: km,
        litros,
        tipoCombustible: fuelType,
        precioPorLitro: precio,
        fechaHora: new Date(`${fecha}T${hora || '00:00'}:00`).toISOString(),
    });
    saveRepostajes(repostajes);

    updateConsumoLabels();
    alert('✅ Repostaje actualizado correctamente.');
    showRepostajeList();
}

function onDeleteRepostajeDetail() {
    if (selectedRepostajeId === null) return;

    const confirmado = confirm('¿Seguro que quieres borrar este repostaje?');
    if (!confirmado) return;

    saveRepostajes(loadRepostajes().filter(r => r.id !== selectedRepostajeId));
    selectedRepostajeId = null;

    updateConsumoLabels();
    showRepostajeList();
}

// ==========================================
// GASTOS GENERALES DEL VEHÍCULO
// ==========================================

function getActivePanelId() {
    return PANEL_IDS.find(id => document.getElementById(id).style.display !== 'none');
}

function showGastosGeneralesForm() {
    if (!selectedVehicleId) return;

    gastosGeneralesReturnPanel = getActivePanelId() || 'vehicleSelectorPanel';

    const generales = getGastosGeneralesForVehicle(selectedVehicleId);
    document.getElementById('seguroAnualInput').value = generales.seguroAnual || '';
    document.getElementById('ivtmAnualInput').value = generales.ivtmAnual || '';
    document.getElementById('gastosGeneralesMessage').style.display = 'none';

    showOnly('gastosGeneralesFormPanel');
}

function onSaveGastosGenerales() {
    if (!selectedVehicleId) return;

    const seguroAnual = parseNumber(document.getElementById('seguroAnualInput').value);
    const ivtmAnual = parseNumber(document.getElementById('ivtmAnualInput').value);

    const all = loadGastosGenerales();
    const existing = all[selectedVehicleId] || {};
    all[selectedVehicleId] = { ...existing, seguroAnual, ivtmAnual };
    saveGastosGenerales(all);

    alert('✅ Gastos generales guardados correctamente.');
    showOnly(gastosGeneralesReturnPanel);
}

// ==========================================
// ITV
// ==========================================

function showItvForm() {
    if (!selectedVehicleId) return;
    const generales = getGastosGeneralesForVehicle(selectedVehicleId);
    document.getElementById('itvCantidadInput').value = generales.itv.cantidad || '';
    document.getElementById('itvFechaCaducidadInput').value = generales.itv.fechaCaducidad || '';
    document.getElementById('itvAviso1MesCheckbox').checked = generales.itv.aviso1Mes;
    document.getElementById('itvAviso15DiasCheckbox').checked = generales.itv.aviso15Dias;
    document.getElementById('itvMessage').style.display = 'none';
    showOnly('itvFormPanel');
}

function onSaveItv() {
    if (!selectedVehicleId) return;

    const cantidad = parseNumber(document.getElementById('itvCantidadInput').value);
    const fechaCaducidad = document.getElementById('itvFechaCaducidadInput').value;
    const aviso1Mes = document.getElementById('itvAviso1MesCheckbox').checked;
    const aviso15Dias = document.getElementById('itvAviso15DiasCheckbox').checked;

    const all = loadGastosGenerales();
    const existing = all[selectedVehicleId] || {};
    all[selectedVehicleId] = { ...existing, itv: { cantidad, fechaCaducidad, aviso1Mes, aviso15Dias } };
    saveGastosGenerales(all);

    alert('✅ ITV guardada correctamente.');
    showOnly('gastosGeneralesFormPanel');
    updateItvReminder();
}

// Comprueba si hay que mostrar un aviso de ITV próxima a caducar para el vehículo seleccionado.
function updateItvReminder() {
    const banner = document.getElementById('itvReminderBanner');
    if (!selectedVehicleId) {
        banner.style.display = 'none';
        return;
    }

    const { itv } = getGastosGeneralesForVehicle(selectedVehicleId);
    if (!itv.fechaCaducidad || (!itv.aviso1Mes && !itv.aviso15Dias)) {
        banner.style.display = 'none';
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCad = new Date(itv.fechaCaducidad + 'T00:00:00');
    const diasRestantes = Math.round((fechaCad - hoy) / (1000 * 60 * 60 * 24));

    const fechaTexto = fechaCad.toLocaleDateString('es-ES');

    if (diasRestantes < 0) {
        banner.textContent = `🔴 La ITV caducó el ${fechaTexto}. ¡Pide cita cuanto antes!`;
        banner.className = 'itv-banner itv-banner--urgent';
        banner.style.display = '';
        return;
    }

    if (itv.aviso15Dias && diasRestantes <= 15) {
        banner.textContent = `🔴 La ITV caduca el ${fechaTexto} (en ${diasRestantes} días). ¡Pide cita cuanto antes!`;
        banner.className = 'itv-banner itv-banner--urgent';
        banner.style.display = '';
        return;
    }

    if (itv.aviso1Mes && diasRestantes <= 30) {
        banner.textContent = `🟡 La ITV caduca el ${fechaTexto} (en ${diasRestantes} días). Es buen momento para pedir cita.`;
        banner.className = 'itv-banner';
        banner.style.display = '';
        return;
    }

    banner.style.display = 'none';
}

// ==========================================
// FINANCIACIÓN / RENTING / LEASING
// ==========================================

function showFinanciacionForm() {
    if (!selectedVehicleId) return;
    const generales = getGastosGeneralesForVehicle(selectedVehicleId);
    document.getElementById('financiacionGastoMensualInput').value = generales.financiacion.gastoMensual || '';
    document.getElementById('financiacionMesInicioInput').value = generales.financiacion.mesInicio || '';
    document.getElementById('financiacionMessage').style.display = 'none';
    showOnly('financiacionFormPanel');
}

function onSaveFinanciacion() {
    if (!selectedVehicleId) return;

    const gastoMensual = parseNumber(document.getElementById('financiacionGastoMensualInput').value);
    const mesInicio = document.getElementById('financiacionMesInicioInput').value;

    const all = loadGastosGenerales();
    const existing = all[selectedVehicleId] || {};
    all[selectedVehicleId] = { ...existing, financiacion: { gastoMensual, mesInicio } };
    saveGastosGenerales(all);

    alert('✅ Financiación guardada correctamente.');
    showOnly('gastosGeneralesFormPanel');
}

function showRentingForm() {
    if (!selectedVehicleId) return;
    const generales = getGastosGeneralesForVehicle(selectedVehicleId);
    document.getElementById('rentingFrecuenciaSelect').value = generales.renting.frecuencia || 'mensual';
    document.getElementById('rentingCantidadInput').value = generales.renting.cantidad || '';
    document.getElementById('rentingMesInicioInput').value = generales.renting.mesInicio || '';
    document.getElementById('rentingMessage').style.display = 'none';
    showOnly('rentingFormPanel');
}

function onSaveRenting() {
    if (!selectedVehicleId) return;

    const frecuencia = document.getElementById('rentingFrecuenciaSelect').value;
    const cantidad = parseNumber(document.getElementById('rentingCantidadInput').value);
    const mesInicio = document.getElementById('rentingMesInicioInput').value;

    const all = loadGastosGenerales();
    const existing = all[selectedVehicleId] || {};
    all[selectedVehicleId] = { ...existing, renting: { frecuencia, cantidad, mesInicio } };
    saveGastosGenerales(all);

    alert('✅ Renting guardado correctamente.');
    showOnly('gastosGeneralesFormPanel');
}

function showLeasingForm() {
    if (!selectedVehicleId) return;
    const generales = getGastosGeneralesForVehicle(selectedVehicleId);
    document.getElementById('leasingFrecuenciaSelect').value = generales.leasing.frecuencia || 'mensual';
    document.getElementById('leasingCantidadInput').value = generales.leasing.cantidad || '';
    document.getElementById('leasingMesInicioInput').value = generales.leasing.mesInicio || '';
    document.getElementById('leasingMessage').style.display = 'none';
    showOnly('leasingFormPanel');
}

function onSaveLeasing() {
    if (!selectedVehicleId) return;

    const frecuencia = document.getElementById('leasingFrecuenciaSelect').value;
    const cantidad = parseNumber(document.getElementById('leasingCantidadInput').value);
    const mesInicio = document.getElementById('leasingMesInicioInput').value;

    const all = loadGastosGenerales();
    const existing = all[selectedVehicleId] || {};
    all[selectedVehicleId] = { ...existing, leasing: { frecuencia, cantidad, mesInicio } };
    saveGastosGenerales(all);

    alert('✅ Leasing guardado correctamente.');
    showOnly('gastosGeneralesFormPanel');
}

// ==========================================
// GASTOS DE MANTENIMIENTO
// ==========================================

function renderMaintenanceList() {
    const container = document.getElementById('maintenanceList');
    container.innerHTML = '';

    const items = getMantenimientosForVehicle(selectedVehicleId);

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-text">Todavía no hay gastos de mantenimiento registrados.</p>';
        return;
    }

    items.forEach(m => {
        const fechaTexto = new Date(m.fecha).toLocaleDateString('es-ES');
        const row = document.createElement('div');
        row.className = 'list-item';
        row.innerHTML = `
            <div class="list-item__info">
                <div class="list-item__title">${m.titulo}</div>
                <div class="list-item__subtitle">${fechaTexto} · ${m.cantidad.toFixed(2)} €</div>
            </div>
            <div class="list-item__actions">
                <button class="icon-btn icon-btn--edit" data-id="${m.id}" data-action="edit" aria-label="Editar gasto de mantenimiento">✏️</button>
                <button class="icon-btn" data-id="${m.id}" data-action="delete" aria-label="Borrar gasto de mantenimiento">🗑️</button>
            </div>
        `;
        container.appendChild(row);
    });

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => onEditMaintenance(Number(btn.dataset.id)));
    });
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => onDeleteMaintenance(Number(btn.dataset.id)));
    });
}

function showMaintenanceMenu() {
    if (!selectedVehicleId) return;
    showOnly('maintenanceMenuPanel');
}

function showMaintenanceList() {
    if (!selectedVehicleId) return;
    renderMaintenanceList();
    showOnly('maintenanceListPanel');
}

function onDeleteMaintenance(id) {
    const items = loadMantenimientos();
    const item = items.find(m => m.id === id);
    if (!item) return;

    const confirmado = confirm(`¿Seguro que quieres borrar el gasto de mantenimiento "${item.titulo}" (${item.cantidad.toFixed(2)} €)?`);
    if (!confirmado) return;

    saveMantenimientos(items.filter(m => m.id !== id));
    renderMaintenanceList();
}

function clearMaintenanceForm() {
    editingMaintenanceId = null;
    document.getElementById('maintenanceFormTitle').textContent = '🔧 Nuevo Mantenimiento';
    document.getElementById('maintenanceTitleInput').value = '';
    document.getElementById('maintenanceAmountInput').value = '';
    document.getElementById('maintenanceFormMessage').style.display = 'none';
}

function onAddMaintenance() {
    if (!selectedVehicleId) return;
    clearMaintenanceForm();
    maintenanceFormReturnPanel = 'maintenanceMenuPanel';
    showOnly('maintenanceFormPanel');
}

function onEditMaintenance(id) {
    const item = getMantenimientosForVehicle(selectedVehicleId).find(m => m.id === id);
    if (!item) return;

    editingMaintenanceId = id;
    document.getElementById('maintenanceFormTitle').textContent = '✏️ Editar Mantenimiento';
    document.getElementById('maintenanceTitleInput').value = item.titulo;
    document.getElementById('maintenanceAmountInput').value = item.cantidad;
    document.getElementById('maintenanceFormMessage').style.display = 'none';
    maintenanceFormReturnPanel = 'maintenanceListPanel';

    showOnly('maintenanceFormPanel');
}

function showMaintenanceError(message) {
    const el = document.getElementById('maintenanceFormMessage');
    el.textContent = '❌ ' + message;
    el.style.display = '';
}

function exitMaintenanceForm() {
    editingMaintenanceId = null;
    if (maintenanceFormReturnPanel === 'maintenanceListPanel') renderMaintenanceList();
    showOnly(maintenanceFormReturnPanel);
}

function onSaveMaintenance() {
    if (!selectedVehicleId) return;

    const titulo = document.getElementById('maintenanceTitleInput').value.trim();
    const cantidad = parseNumber(document.getElementById('maintenanceAmountInput').value);

    if (!titulo) return showMaintenanceError('El título (tipo de mantenimiento) es obligatorio.');
    if (!cantidad || cantidad <= 0) return showMaintenanceError('Introduce una cantidad válida.');

    const items = loadMantenimientos();

    if (editingMaintenanceId !== null) {
        const existing = items.find(m => m.id === editingMaintenanceId);
        if (!existing) return;
        Object.assign(existing, { titulo, cantidad });
    } else {
        items.push({ id: nextId(items), vehicleId: selectedVehicleId, titulo, cantidad, fecha: new Date().toISOString() });
    }

    saveMantenimientos(items);
    editingMaintenanceId = null;

    if (maintenanceFormReturnPanel === 'maintenanceListPanel') renderMaintenanceList();
    showOnly(maintenanceFormReturnPanel);
}

// ==========================================
// INSTALACIÓN COMO APP (PWA)
// ==========================================

let deferredInstallPrompt = null;

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

function setupInstallButton() {
    const installButton = document.getElementById('installButton');

    // Chrome/Edge/Android: se dispara cuando el navegador considera la app instalable.
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installButton.style.display = '';
    });

    installButton.addEventListener('click', () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(() => {
            deferredInstallPrompt = null;
            installButton.style.display = 'none';
        });
    });

    window.addEventListener('appinstalled', () => {
        installButton.style.display = 'none';
        deferredInstallPrompt = null;
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    setupInstallButton();

    applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light');
    document.getElementById('themeToggleButton').addEventListener('click', toggleTheme);

    seedDataIfEmpty();
    renderVehiclePicker();
    showOnly('vehicleSelectorPanel');

    document.getElementById('vehiclePicker').addEventListener('change', onVehicleSelected);

    document.getElementById('menuButton').addEventListener('click', () => toggleMenu(false));
    document.getElementById('menuOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'menuOverlay') toggleMenu(true);
    });
    document.getElementById('menuCrearVehiculo').addEventListener('click', () => {
        toggleMenu(true);
        clearCreateVehicleForm();
        showOnly('createVehicleFormPanel');
    });
    document.getElementById('menuListarVehiculos').addEventListener('click', () => {
        toggleMenu(true);
        renderVehicleList();
        showOnly('vehicleListPanel');
    });

    document.getElementById('btnCancelCreateVehicle').addEventListener('click', exitVehicleForm);
    document.getElementById('btnSaveVehicle').addEventListener('click', onSaveVehicle);

    document.getElementById('btnNewRepostaje').addEventListener('click', showRepostajeForm);
    document.getElementById('btnListRepostajes').addEventListener('click', showRepostajeList);

    document.getElementById('litrosInput').addEventListener('input', updateCosteTotal);
    document.getElementById('precioPorLitroInput').addEventListener('input', updateCosteTotal);
    document.getElementById('btnCancelRepostaje').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnSaveRepostaje').addEventListener('click', onSaveRepostaje);

    document.getElementById('btnBackFromVehicleList').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromRepostajeList').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromRepostajeDetail').addEventListener('click', () => showOnly('repostajeListPanel'));
    document.getElementById('btnEditRepostaje').addEventListener('click', enterRepostajeEditMode);
    document.getElementById('btnDeleteRepostaje').addEventListener('click', onDeleteRepostajeDetail);
    document.getElementById('btnSaveRepostajeEdit').addEventListener('click', onSaveRepostajeEdit);
    document.getElementById('editLitrosInput').addEventListener('input', updateEditCosteTotal);
    document.getElementById('editPrecioPorLitroInput').addEventListener('input', updateEditCosteTotal);
    document.getElementById('btnBackFromRepostajeForm').addEventListener('click', () => showOnly('vehicleSelectorPanel'));
    document.getElementById('btnBackFromCreateVehicle').addEventListener('click', exitVehicleForm);

    document.getElementById('btnOtherExpenses').addEventListener('click', showGastosGeneralesForm);
    document.getElementById('btnSaveGastosGenerales').addEventListener('click', onSaveGastosGenerales);
    document.getElementById('btnBackFromGastosGenerales').addEventListener('click', () => showOnly(gastosGeneralesReturnPanel));

    document.getElementById('btnOpenMantenimientos').addEventListener('click', showMaintenanceMenu);
    document.getElementById('btnBackFromMaintenanceMenu').addEventListener('click', () => showOnly('gastosGeneralesFormPanel'));

    document.getElementById('btnListMantenimientos').addEventListener('click', showMaintenanceList);
    document.getElementById('btnAddMantenimiento').addEventListener('click', onAddMaintenance);
    document.getElementById('btnBackFromMaintenanceList').addEventListener('click', () => showOnly('maintenanceMenuPanel'));

    document.getElementById('btnSaveMaintenance').addEventListener('click', onSaveMaintenance);
    document.getElementById('btnBackFromMaintenanceForm').addEventListener('click', exitMaintenanceForm);

    document.getElementById('btnOpenItv').addEventListener('click', showItvForm);
    document.getElementById('btnSaveItv').addEventListener('click', onSaveItv);
    document.getElementById('btnBackFromItv').addEventListener('click', () => showOnly('gastosGeneralesFormPanel'));

    document.getElementById('btnOpenFinanciacion').addEventListener('click', showFinanciacionForm);
    document.getElementById('btnSaveFinanciacion').addEventListener('click', onSaveFinanciacion);
    document.getElementById('btnBackFromFinanciacion').addEventListener('click', () => showOnly('gastosGeneralesFormPanel'));

    document.getElementById('btnOpenRenting').addEventListener('click', showRentingForm);
    document.getElementById('btnSaveRenting').addEventListener('click', onSaveRenting);
    document.getElementById('btnBackFromRenting').addEventListener('click', () => showOnly('gastosGeneralesFormPanel'));

    document.getElementById('btnOpenLeasing').addEventListener('click', showLeasingForm);
    document.getElementById('btnSaveLeasing').addEventListener('click', onSaveLeasing);
    document.getElementById('btnBackFromLeasing').addEventListener('click', () => showOnly('gastosGeneralesFormPanel'));
});
