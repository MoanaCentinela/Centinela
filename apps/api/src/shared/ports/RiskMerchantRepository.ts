export interface RiskMerchantRepository {
  getRiskMerchants(): Promise<string[]>;
  getRiskCategories(): Promise<string[]>;
  addRiskMerchant(merchantId: string): Promise<void>;
  removeRiskMerchant(merchantId: string): Promise<void>;
  addRiskCategory(category: string): Promise<void>;
  removeRiskCategory(category: string): Promise<void>;
}
