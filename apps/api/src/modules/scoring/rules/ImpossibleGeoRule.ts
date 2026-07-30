import { FraudRule, FraudRuleResult, RuleContext } from "../../../shared/ports/FraudRule.js";
import { TransactionRequest } from "../../../shared/contracts/index.js";
import { calcularDistancia } from "../../../utils/geo.js";

export class ImpossibleGeoRule implements FraudRule {
  readonly name = "ImpossibleGeoRule";

  constructor(
    private readonly maxSpeedKmH: number = 900,
    private readonly points: number = 50
  ) {}

  evaluate(transaction: TransactionRequest, context: RuleContext): FraudRuleResult {
    const previous = context.recentTransactions[context.recentTransactions.length - 1];

    if (!previous || !previous.location || !transaction.location) {
      return {
        ruleName: this.name,
        triggered: false,
        points: 0,
        explanation: "No hay transacción anterior con ubicación geográfica válida para comparar.",
      };
    }

    const distKm = calcularDistancia(
      previous.location.latitude,
      previous.location.longitude,
      transaction.location.latitude,
      transaction.location.longitude
    );

    const prevTime = new Date(previous.clientTimestamp).getTime();
    const currTime = new Date(transaction.clientTimestamp).getTime();
    let hoursDiff = (currTime - prevTime) / (1000 * 60 * 60);

    if (hoursDiff <= 0) {
      hoursDiff = 0.001; // Evitar división por cero
    }

    const speedKmH = distKm / hoursDiff;

    if (speedKmH > this.maxSpeedKmH) {
      const minutesDiff = hoursDiff * 60;
      return {
        ruleName: this.name,
        triggered: true,
        points: this.points,
        explanation: `La transacción anterior se originó hace ${minutesDiff.toFixed(0)} min; esta se origina a ${distKm.toFixed(0)} km, requiriendo una velocidad de ${speedKmH.toFixed(0)} km/h (+${this.points} puntos).`,
        observedValue: `${speedKmH.toFixed(0)} km/h`,
        threshold: `${this.maxSpeedKmH} km/h`,
      };
    }

    return {
      ruleName: this.name,
      triggered: false,
      points: 0,
      explanation: "Desplazamiento geográfico realizable dentro del tiempo transcurrido.",
      observedValue: `${speedKmH.toFixed(0)} km/h`,
      threshold: `${this.maxSpeedKmH} km/h`,
    };
  }
}
