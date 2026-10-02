export type LegalDocumentType =
  | "national_id"
  | "passport"
  | "residence_permit"
  | "refugee_document"
  | "other";

export interface LegalIdentityInput {
  legalName: string;
  givenNames?: string;
  middleNames?: string;
  familyName?: string;
  dateOfBirth?: string;
  sex?: string;
  nationalityCountryCode?: string;
  birthCountryCode?: string;
  birthPlace?: string;
  residenceCountryCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  documentType: LegalDocumentType;
  issuingCountryCode: string;
  issuingAuthority?: string;
  documentNumber: string;
  nationalIdentifier?: string;
  documentSerialNumber?: string;
  issuePlace?: string;
  issueDate?: string;
  expiryDate?: string;
}

export const normalizeCountryCode = (value: unknown): string => String(value ?? "").trim().toUpperCase();

export const normalizePhoneE164 = (value: unknown): string => {
  const normalized = String(value ?? "").trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error("INVALID_PHONE");
  return normalized;
};

export const normalizeEmail = (value: unknown): string => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("INVALID_EMAIL");
  return normalized;
};

export const validateLegalIdentity = (input: LegalIdentityInput): void => {
  if (input.legalName.trim().length < 2) throw new Error("LEGAL_NAME_REQUIRED");
  if (!input.documentNumber.trim()) throw new Error("DOCUMENT_NUMBER_REQUIRED");
  if (!/^[A-Z]{2}$/.test(normalizeCountryCode(input.issuingCountryCode))) {
    throw new Error("INVALID_ISSUING_COUNTRY");
  }
  if (input.nationalityCountryCode && !/^[A-Z]{2}$/.test(normalizeCountryCode(input.nationalityCountryCode))) {
    throw new Error("INVALID_NATIONALITY_COUNTRY");
  }
  if (input.birthCountryCode && !/^[A-Z]{2}$/.test(normalizeCountryCode(input.birthCountryCode))) {
    throw new Error("INVALID_BIRTH_COUNTRY");
  }
  if (input.residenceCountryCode && !/^[A-Z]{2}$/.test(normalizeCountryCode(input.residenceCountryCode))) {
    throw new Error("INVALID_RESIDENCE_COUNTRY");
  }
};
