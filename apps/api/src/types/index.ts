// Define la estructura exacta que esperas de la base de datos y la API
export interface Transaccion {
    id: string;
    accountId: string;
    lat: number;
    lon: number;
    timestamp: string | Date; 
}

export interface ResultadoRegla {
    activada: boolean;
    puntos: number;
    detalle: string;
}
