const cuerpoTabla = document.getElementById('cuerpo-tabla');
const panelPc = document.getElementById('panel-pc');
const panelMovil = document.getElementById('panel-movil');

document.addEventListener('DOMContentLoaded', () => {
    mostrarInventario();
    detectarDispositivoYConfigurar();
});

function detectarDispositivoYConfigurar() {
    const esCelular = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (esCelular) {
        panelMovil.style.display = 'block';
        panelPc.style.display = 'none';
        configurarEventosMovil();
    } else {
        panelPc.style.display = 'block';
        panelMovil.style.display = 'none';
        configurarEventosPC();
    }
}

// LOGICA PARA PC
function configurarEventosPC() {
    const codigoInput = document.getElementById('codigoInput');
    const nombreInput = document.getElementById('nombreInput');
    const cantidadInput = document.getElementById('cantidadInput');
    const btnGuardar = document.getElementById('btnGuardar');

    btnGuardar.addEventListener('click', () => {
        guardarItem(codigoInput.value.trim(), nombreInput.value.trim(), parseInt(cantidadInput.value));
        codigoInput.value = '';
        nombreInput.value = '';
        cantidadInput.value = '1';
        codigoInput.focus();
    });

    codigoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            nombreInput.focus();
        }
    });
}

// LOGICA MÓVIL REFACTORIZADA (Cámara infinita y tamaño responsivo)
let html5QrCode = null;
let enTransicion = false; // Evita clics dobles rápidos que traban la cámara

function configurarEventosMovil() {
    const btnActivarCamara = document.getElementById('btnActivarCamara');
    const btnGuardarMovil = document.getElementById('btnGuardarMovil');
    const btnEscanearOtro = document.getElementById('btnEscanearOtro');
    const btnCerrarCamara = document.getElementById('btnCerrarCamara');

    btnActivarCamara.onclick = async function() {
        if (enTransicion) return;
        await encenderCamara();
    };

    btnCerrarCamara.onclick = async function() {
        if (enTransicion) return;
        await apagarCamara();
        reiniciarPanelMovil();
    };

    btnEscanearOtro.onclick = async function() {
        if (enTransicion) return;
        reiniciarPanelMovil();
        await encenderCamara();
    };

    btnGuardarMovil.onclick = function() {
        const codigo = document.getElementById('codigoMovil').value;
        const nombre = document.getElementById('nombreMovil').value.trim();
        const cantidad = parseInt(document.getElementById('cantidadMovil').value);

        if (nombre === "") {
            alert("Por favor ingresa el nombre del producto.");
            return;
        }

        guardarItem(codigo, nombre, cantidad);
        reiniciarPanelMovil();
    };
}

async function encenderCamara() {
    enTransicion = true;
    const wrapperCamara = document.getElementById('wrapper-camara');
    const formMovil = document.getElementById('form-movil');
    const btnActivarCamara = document.getElementById('btnActivarCamara');

    btnActivarCamara.style.display = 'none';
    formMovil.style.display = 'none';
    wrapperCamara.style.display = 'block';

    // Limpieza total antes de iniciar de nuevo
    await apagarCamara();

    html5QrCode = new Html5Qrcode("reader");

    // Cálculo dinámico para que el cuadro de escaneo encaje en la pantalla
    const qrboxFunction = function(viewfinderWidth, viewfinderHeight) {
        let minEdgePercentage = 0.75;
        let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
            width: Math.min(qrboxSize, 220),
            height: Math.min(Math.floor(qrboxSize * 0.6), 130)
        };
    };

    const config = { 
        fps: 15, 
        qrbox: qrboxFunction,
        aspectRatio: 1.333333
    };

    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
                // Al leer el código, apaga la cámara limpiamente antes de pedir el nombre
                await apagarCamara();
                wrapperCamara.style.display = 'none';
                formMovil.style.display = 'block';
                document.getElementById('codigoMovil').value = decodedText;
                document.getElementById('nombreMovil').focus();
            },
            (errorMessage) => {}
        );
    } catch (err) {
        alert("No se pudo iniciar la cámara. Recuerda usar GitHub Pages (HTTPS).");
        await apagarCamara();
        reiniciarPanelMovil();
    } finally {
        enTransicion = false;
    }
}

async function apagarCamara() {
    if (html5QrCode) {
        try {
            if (html5QrCode.isScanning) {
                await html5QrCode.stop();
            }
            await html5QrCode.clear();
        } catch (e) {
            console.log("Limpiando cámara:", e);
        }
        html5QrCode = null;
    }
}

function reiniciarPanelMovil() {
    document.getElementById('nombreMovil').value = '';
    document.getElementById('cantidadMovil').value = '1';
    document.getElementById('form-movil').style.display = 'none';
    document.getElementById('wrapper-camara').style.display = 'none';
    document.getElementById('btnActivarCamara').style.display = 'block';
}

// LOGICA DE DATOS LOCALSTORAGE
function guardarItem(codigo, nombre, cantidad) {
    if (codigo === "" || nombre === "") {
        alert("Faltan datos del producto.");
        return;
    }

    let inventario = JSON.parse(localStorage.getItem('inventario')) || {};

    if (inventario[codigo]) {
        inventario[codigo].cantidad += cantidad;
        inventario[codigo].nombre = nombre;
    } else {
        inventario[codigo] = { codigo, nombre, cantidad };
    }

    localStorage.setItem('inventario', JSON.stringify(inventario));
    mostrarInventario();
}

function mostrarInventario() {
    let inventario = JSON.parse(localStorage.getItem('inventario')) || {};
    cuerpoTabla.innerHTML = '';
    const codigos = Object.keys(inventario);

    if (codigos.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Sin productos registrados.</td></tr>`;
        return;
    }

    for (let codigo of codigos) {
        let item = inventario[codigo];
        cuerpoTabla.innerHTML += `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td><strong>${item.cantidad}</strong></td>
                <td>
                    <button class="btn btn-danger btn-sm py-0 px-1" onclick="eliminarProducto('${item.codigo}')">X</button>
                </td>
            </tr>
        `;
    }
}

function eliminarProducto(codigo) {
    if (confirm("¿Eliminar producto del stock?")) {
        let inventario = JSON.parse(localStorage.getItem('inventario')) || {};
        delete inventario[codigo];
        localStorage.setItem('inventario', JSON.stringify(inventario));
        mostrarInventario();
    }
}
