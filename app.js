const API = "http://127.0.0.1:8000";

function mostrarTab(nombre, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + nombre).classList.add('active');
    btn.classList.add('active');
}

function syncNum(sliderId, numId) {
    document.getElementById(numId).value = document.getElementById(sliderId).value;
}
function syncRange(numId, sliderId) {
    document.getElementById(sliderId).value = document.getElementById(numId).value;
}

function obtenerDatos() {
    return {
        age:      parseInt(document.getElementById("age").value),
        sex:      parseInt(document.getElementById("sex").value),
        cp:       parseInt(document.getElementById("cp").value),
        trestbps: parseInt(document.getElementById("trestbps").value),
        chol:     parseInt(document.getElementById("chol").value),
        fbs:      parseInt(document.getElementById("fbs").value),
        restecg:  parseInt(document.getElementById("restecg").value),
        thalach:  parseInt(document.getElementById("thalach").value),
        exang:    parseInt(document.getElementById("exang").value),
        oldpeak:  parseFloat(document.getElementById("oldpeak").value),
        slope:    parseInt(document.getElementById("slope").value),
        ca:       parseInt(document.getElementById("ca").value),
        thal:     parseInt(document.getElementById("thal").value)
    };
}

const iconoRiesgo = `<svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:#fff;fill:none;stroke-width:1.5;"><path d="M10.29 3.86l-8.29 14.14h18l-8.29-14.14a1 1 0 0 0 -1.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const iconoOk    = `<svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:#fff;fill:none;stroke-width:1.5;"><path d="M5 12l5 5l10 -10"/></svg>`;

async function predecir(tipo) {
    const datos = obtenerDatos();
    const endpoint = tipo === 'regresion'
        ? `${API}/predecir_regresion_usuario`
        : `${API}/predecir_red_usuario`;
    const modelo = tipo === 'regresion' ? 'Regresión Logística' : 'Red Neuronal';
    const div = document.getElementById("resultadoIndividual");
    div.style.display = "block";
    div.innerHTML = `<div class="loading">Procesando...</div>`;
    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        const r = await res.json();
        const riesgo = r.prediccion === 1;
        const pct = (r.probabilidad * 100).toFixed(1);
        const barra = Math.round(r.probabilidad * 100);
        const barColor = riesgo ? "#e0e0e0" : "#555";
        div.innerHTML = `
            <div class="resultado-card">
                <div class="resultado-header">
                    <div class="resultado-icono">${riesgo ? iconoRiesgo : iconoOk}</div>
                    <div>
                        <div class="resultado-modelo">${modelo}</div>
                        <div class="resultado-diagnostico" style="color:${riesgo ? '#e0e0e0' : '#888'}">${r.diagnostico}</div>
                    </div>
                </div>
                <div class="barra-wrap">
                    <div class="barra-label">Probabilidad de riesgo cardíaco</div>
                    <div class="barra-bg"><div class="barra-fill" style="width:${barra}%;background:${barColor}"></div></div>
                    <div class="barra-valor">${pct}%</div>
                </div>
            </div>`;
    } catch(e) {
        div.innerHTML = `<div class="error">Error al conectar con la API. Verifique que el servidor esté activo en http://127.0.0.1:8000</div>`;
    }
}

async function predecirLote(tipo) {
    const fileId   = tipo === 'regresion' ? 'archivoRegresion' : 'archivoRed';
    const resultId = tipo === 'regresion' ? 'resultadoRegresionExcel' : 'resultadoRedExcel';
    const endpoint = tipo === 'regresion' ? `${API}/predecir_regresion_excel` : `${API}/predecir_red_excel`;
    const archivo  = document.getElementById(fileId).files[0];
    const div      = document.getElementById(resultId);
    if (!archivo) { div.innerHTML = `<div class="error">Seleccione un archivo primero.</div>`; return; }
    div.innerHTML = `<div class="loading">Procesando ${archivo.name}...</div>`;
    const formData = new FormData();
    formData.append("file", archivo);
    try {
        const res = await fetch(endpoint, { method: "POST", body: formData });
        const registros = await res.json();
        const riesgos = registros.filter(r => r.Prediccion === 1).length;
        const sanos = registros.length - riesgos;
        let tabla = `<table><thead><tr><th>#</th><th>Edad</th><th>Sexo</th><th>Probabilidad</th><th>Diagnóstico</th></tr></thead><tbody>`;
        registros.forEach((r, i) => {
            tabla += `<tr>
                <td>${i+1}</td><td>${r.age}</td>
                <td>${r.sex === 1 ? 'M' : 'F'}</td>
                <td>${(r.Probabilidad*100).toFixed(1)}%</td>
                <td style="color:${r.Prediccion===1?'#e0e0e0':'#666'}">${r.Diagnostico}</td>
            </tr>`;
        });
        tabla += `</tbody></table>`;
        div.innerHTML = `
            <div class="resumen-lote" style="margin-top:16px;">
                <div class="resumen-item riesgo">Con riesgo<br><strong>${riesgos}</strong></div>
                <div class="resumen-item sano">Sin riesgo<br><strong>${sanos}</strong></div>
                <div class="resumen-item">Total<br><strong>${registros.length}</strong></div>
            </div>${tabla}`;
    } catch(e) {
        div.innerHTML = `<div class="error">Error al procesar el archivo.</div>`;
    }
}

