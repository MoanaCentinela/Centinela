import { CaseRepository } from "../../../shared/ports/CaseRepository.js";
import { FraudCase, VerificationDocument } from "../../../shared/models/FraudCase.js";

export interface ResolveCaseDTO {
  decision: "CONFIRMED_FRAUD" | "DISCARDED_FALSE_POSITIVE";
  notes?: string;
  analystId?: string;
}

export interface AttachDocumentDTO {
  filename: string;
  documentType?: string;
  extractedData?: Record<string, any>;
}

export class CaseService {
  constructor(private readonly caseRepository: CaseRepository) {}

  async getAllCases(): Promise<FraudCase[]> {
    return await this.caseRepository.findAllCases();
  }

  async getCaseById(id: string): Promise<FraudCase | null> {
    return await this.caseRepository.findCaseById(id);
  }

  async resolveCase(id: string, dto: ResolveCaseDTO): Promise<FraudCase | null> {
    const fraudCase = await this.caseRepository.findCaseById(id);
    if (!fraudCase) {
      return null;
    }

    const updatedCase: FraudCase = {
      ...fraudCase,
      status: "RESOLVED",
      resolution: {
        decision: dto.decision,
        notes: dto.notes ?? "",
        analystId: dto.analystId ?? "ANALYST-SYSTEM",
        resolvedAt: new Date().toISOString(),
      },
    };

    await this.caseRepository.saveCase(updatedCase);
    return updatedCase;
  }

  async attachDocument(id: string, dto: AttachDocumentDTO): Promise<FraudCase | null> {
    const fraudCase = await this.caseRepository.findCaseById(id);
    if (!fraudCase) {
      return null;
    }

    const existingDocs = fraudCase.documents ?? [];
    const newDoc: VerificationDocument = {
      id: `DOC-${Date.now()}`,
      filename: dto.filename,
      documentType: dto.documentType ?? "VERIFICATION_DOCUMENT",
      extractedData: dto.extractedData,
      uploadedAt: new Date().toISOString(),
    };

    const updatedCase: FraudCase = {
      ...fraudCase,
      documents: [...existingDocs, newDoc],
    };

    await this.caseRepository.saveCase(updatedCase);
    return updatedCase;
  }
}
