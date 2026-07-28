import { Transaccion, ResultadoRegla } from '../types/index.js';
import { calcularDistancia } from '../utils/geo.js';

export function evaluarGeoImposible(trxAnterior: Transaccion, trxActual: Transaccion): ResultadoRegla {
    // 1. Calcular distancia
    const distancia = calcularDistancia(trxAnterior.lat, trxAnterior.lon, trxActual.lat, trxActual.lon);
    
    // 2. Calcular tiempo en horas
    const tiempoAnterior = new Date(trxAnterior.timestamp).getTime();
    const tiempoActual = new Date(trxActual.timestamp).getTime();
    
    // Restamos los milisegundos y convertimos a horas
    let diferenciaHoras = (tiempoActual - tiempoAnterior) / (1000 * 60 * 60);
    
    // Protección contra transacciones simultáneas (división por cero)
    if (diferenciaHoras === 0) {
        diferenciaHoras = 0.001; 
    }

    // 3. Calcular velocidad
    const velocidad = distancia / diferenciaHoras;

    // 4. Evaluar contra el umbral físico (900 km/h) y registrar evidencia
    if (velocidad > 900) {
        return {
            activada: true,
            puntos: 50, // Puntos asignados a esta regla
            detalle: `Geo-imposible detectado. Distancia: ${distancia.toFixed(2)} km, Tiempo: ${diferenciaHoras.toFixed(2)} h, Velocidad requerida: ${velocidad.toFixed(2)} km/h`
        };
    }

    return { 
        activada: false, 
        puntos: 0, 
        detalle: "Comportamiento geográfico normal" 
    };
}

export function evaluarComercioRiesgo(merchantId: string): ResultadoRegla {
    // Lista negra simulada de comercios fraudulentos (pueden ser IDs o nombres)
    const comerciosListaNegra = ["MERCH-999", "CRYPTO-EX-01", "CASINO-VIP"];

    if (comerciosListaNegra.includes(merchantId)) {
        return {
            activada: true,
            puntos: 40, // Puntos por comprar en un sitio de alto riesgo
            detalle: `Comercio de riesgo detectado. El ID ${merchantId} se encuentra en la lista negra.`
        };
    }

    return { 
        activada: false, 
        puntos: 0, 
        detalle: "Comercio verificado como seguro" 
    };
}
