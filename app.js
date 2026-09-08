// Obtener elementos comunes
const cuerpoTabla = document.getElementById('cuerpo-tabla');
const panelPc = document.getElementById('panel-pc');
const panelMovil = document.getElementById('panel-movil');

// Cargar inventario al iniciar
document.addEventListener('DOMContentLoaded', () => {
    mostrarInventario();
    detectarDispositivoYConfigurar();
});

// 1. DETECTAR SI ES PC O TELÉFONO MÓVIL AUTOMÁTICAMENTE
function detectarDispositivoYConfigurar() {
    const esCelular = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (esCelular) {
        // Mostrar panel móvil y ocultar PC
        panelMovil.style.display = 'block';
        panelPc.style.display = 'none';
        iniciarCamaraCelular();
    } else {
        // Mostrar panel PC y ocultar móvil
        panelPc.style.display = 'block';
        panelMovil.style.display = 'none';
        configurarEventosPC();
    }
}

// ================= LOGICA PARA PC =================
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

// ================= LOGICA PARA CELULAR (CÁMARA) =================
let html5QrCode;

function iniciarCamaraCelular() {
    html5QrCode = new Html5Qrcode("reader");
    
    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    html5QrCode.start(
        { facingMode: "environment" }, // Usa la cámara trasera del celular
        config,
        (decodedText) => {
            // ¡Código escaneado con éxito!
            // Detenemos temporalmente la cámara para que el usuario registre el nombre
            html5QrCode.stop().then(() => {
                document.getElementById('reader').style.display = 'none';
                document.getElementById('form-movil').style.display = 'block';
                document.getElementById('codigoMovil').value = decodedText;
                document.getElementById('nombreMovil').focus();
            }).catch(err => console.log(err));
        },
        (errorMessage) => {
            // Errores de escaneo en tiempo real (se ignoran para que siga buscando fluido)
        }
    ).catch(err => {
        alert("No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara en tu navegador.");
    });

    // Botón guardar desde el celular
    document.getElementById('btnGuardarMovil').onclick = function() {
        const codigo = document.getElementById('codigoMovil').value;
        const nombre = document.getElementById('nombreMovil').value.trim();
        const cantidad = parseInt(document.getElementById('cantidadMovil').value);

        if (nombre === "") {
            alert("Por favor ingresa el nombre del producto.");
            return;
        }

        guardarItem(codigo, nombre, cantidad);
        reiniciarEscaneoMovil();
    };

    // Botón para escanear otro sin guardar o reiniciar
    document.getElementById('btnEscanearOtro').onclick = function() {
        reiniciarEscaneoMovil();
    };
}

function reiniciarEscaneoMovil() {
    document.getElementById('nombreMovil').value = '';
    document.getElementById('cantidadMovil').value = '1';
    document.getElementById('form-movil').style.display = 'none';
    document.getElementById('reader').style.display = 'block';
    iniciarCamaraCelular();
}

// ================= LÓGICA GENERAL DE DATOS (LOCALSTORAGE) =================
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
        cuerpoTabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay productos registrados.</td></tr>`;
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
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto('${item.codigo}')">Eliminar</button>
                </td>
            </tr>
        `;
    }
}

function eliminarProducto(codigo) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
        let inventario = JSON.parse(localStorage.getItem('inventario')) || {};
        delete inventario[codigo];
        localStorage.setItem('inventario', JSON.stringify(inventario));
        mostrarInventario();
    }
}