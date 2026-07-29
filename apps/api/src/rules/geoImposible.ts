import { Transaccion, ResultadoRegla } from '../types/index.js';
import { ImpossibleGeoRule } from '../modules/scoring/rules/ImpossibleGeoRule.js';
import { RiskMerchantRule } from '../modules/scoring/rules/RiskMerchantRule.js';
import { TransactionRequest } from '../shared/contracts/index.js';

export function evaluarGeoImposible(trxAnterior: Transaccion, trxActual: Transaccion): ResultadoRegla {
  const rule = new ImpossibleGeoRule(900, 50);
  
  const currentReq: TransactionRequest = {
    transactionId: trxActual.id,
    accountId: trxActual.accountId,
    amount: 0,
    currency: "USD",
    clientTimestamp: typeof trxActual.timestamp === "string" ? trxActual.timestamp : trxActual.timestamp.toISOString(),
    location: { latitude: trxActual.lat, longitude: trxActual.lon },
    merchant: { id: "N/A", category: "N/A" }
  };

  const prevReq: TransactionRequest = {
    transactionId: trxAnterior.id,
    accountId: trxAnterior.accountId,
    amount: 0,
    currency: "USD",
    clientTimestamp: typeof trxAnterior.timestamp === "string" ? trxAnterior.timestamp : trxAnterior.timestamp.toISOString(),
    location: { latitude: trxAnterior.lat, longitude: trxAnterior.lon },
    merchant: { id: "N/A", category: "N/A" }
  };

  const res = rule.evaluate(currentReq, { recentTransactions: [prevReq] });

  return {
    activada: res.triggered,
    puntos: res.points,
    detalle: res.explanation
  };
}

export function evaluarComercioRiesgo(merchantId: string): ResultadoRegla {
  const rule = new RiskMerchantRule(["MERCH-999", "CRYPTO-EX-01", "CASINO-VIP"], [], 40);
  const dummyReq: TransactionRequest = {
    transactionId: "dummy",
    accountId: "dummy",
    amount: 0,
    currency: "USD",
    clientTimestamp: new Date().toISOString(),
    location: { latitude: 0, longitude: 0 },
    merchant: { id: merchantId, category: "N/A" }
  };

  const res = rule.evaluate(dummyReq, { recentTransactions: [] });

  return {
    activada: res.triggered,
    puntos: res.points,
    detalle: res.explanation
  };
}
