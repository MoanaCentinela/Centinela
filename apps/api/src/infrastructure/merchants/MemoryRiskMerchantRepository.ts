import { RiskMerchantRepository } from "../../shared/ports/RiskMerchantRepository.js";

export class MemoryRiskMerchantRepository implements RiskMerchantRepository {
  private readonly riskMerchants: Set<string>;
  private readonly riskCategories: Set<string>;

  constructor(
    defaultRiskMerchants: string[] = ["MERCH-999", "CRYPTO-EX-01", "CASINO-VIP"],
    defaultRiskCategories: string[] = ["CASINO", "CRYPTO", "GAMBLING"]
  ) {
    this.riskMerchants = new Set(defaultRiskMerchants.map((id) => id.toUpperCase()));
    this.riskCategories = new Set(defaultRiskCategories.map((category) => category.toUpperCase()));
  }

  async getRiskMerchants(): Promise<string[]> {
    return Array.from(this.riskMerchants);
  }

  async getRiskCategories(): Promise<string[]> {
    return Array.from(this.riskCategories);
  }

  async addRiskMerchant(merchantId: string): Promise<void> {
    this.riskMerchants.add(merchantId.toUpperCase());
  }

  async removeRiskMerchant(merchantId: string): Promise<void> {
    this.riskMerchants.delete(merchantId.toUpperCase());
  }

  async addRiskCategory(category: string): Promise<void> {
    this.riskCategories.add(category.toUpperCase());
  }

  async removeRiskCategory(category: string): Promise<void> {
    this.riskCategories.delete(category.toUpperCase());
  }
}
