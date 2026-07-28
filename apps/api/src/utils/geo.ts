export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const radioTierraKm = 6371.0;

    // Función auxiliar para convertir grados a radianes
    const aRadianes = (grados: number) => grados * (Math.PI / 180);

    const dLat = aRadianes(lat2 - lat1);
    const dLon = aRadianes(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    // atan2 es matemáticamente más estable que asin para distancias cortas
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return radioTierraKm * c;
}
