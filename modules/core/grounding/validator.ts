import {
  frameworkAliases,
  principleAliases,
  sdgAliases,
  naturePatternAliases,
} from "./aliases";

// --- Types ---

export type ClaimType = "framework" | "principle" | "sdg" | "nature-pattern";

export interface Claim {
  type: ClaimType;
  id: string; // resolved id from aliases (e.g., "sadimet", "5", "7", "water")
  matchedText: string; // the original text that was matched
  position: number; // character index in the source text
}

export interface VerificationResult {
  claim: Claim;
  valid: boolean;
  issue?: string; // description of the mismatch if invalid
}

export interface ValidationResult {
  approved: boolean;
  claims: Claim[];
  issues: VerificationResult[]; // only failed verifications
}

// --- Knowledge context shape ---

interface KnowledgeFramework {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface KnowledgePrinciple {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface KnowledgeSdg {
  id: number;
  title: string;
  [key: string]: unknown;
}

interface KnowledgeNaturePattern {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface KnowledgeContext {
  frameworks?: KnowledgeFramework[];
  principles?: KnowledgePrinciple[];
  sdgs?: KnowledgeSdg[];
  naturePatterns?: KnowledgeNaturePattern[];
}

// --- Inline ref tag regex: [[ref:type:id]] ---
const INLINE_REF_REGEX = /\[\[ref:(framework|principle|sdg|nature-pattern):([^\]]+)\]\]/g;

// --- Helper: build alias lookup sorted by longest-first for greedy matching ---

function buildSortedAliases(
  aliasMap: Record<string, string>,
  type: ClaimType
): { pattern: string; id: string; type: ClaimType }[] {
  return Object.keys(aliasMap)
    .sort((a, b) => b.length - a.length) // longest first to avoid partial matches
    .map((alias) => ({ pattern: alias, id: aliasMap[alias], type }));
}

// --- Validator class ---

export class GroundingValidator {
  private sortedAliases: { pattern: string; id: string; type: ClaimType }[];

  constructor(private knowledgeContext: KnowledgeContext) {
    // Pre-compute sorted aliases for extraction
    this.sortedAliases = [
      ...buildSortedAliases(principleAliases, "principle"),
      ...buildSortedAliases(sdgAliases, "sdg"),
      ...buildSortedAliases(frameworkAliases, "framework"),
      ...buildSortedAliases(naturePatternAliases, "nature-pattern"),
    ];
  }

  /**
   * Extract all claims (mentions of frameworks, principles, SDGs, nature patterns)
   * from the generated text using regex patterns and the alias maps.
   */
  extractClaims(text: string): Claim[] {
    const claims: Claim[] = [];
    const lowerText = text.toLowerCase();

    // Track matched ranges to avoid overlapping claims
    const matchedRanges: { start: number; end: number }[] = [];

    function overlaps(start: number, end: number): boolean {
      return matchedRanges.some(
        (r) => start < r.end && end > r.start
      );
    }

    // 1. Extract inline ref tags: [[ref:type:id]]
    let refMatch: RegExpExecArray | null;
    const refRegex = new RegExp(INLINE_REF_REGEX.source, INLINE_REF_REGEX.flags);
    while ((refMatch = refRegex.exec(text)) !== null) {
      const type = refMatch[1] as ClaimType;
      const id = refMatch[2];
      const position = refMatch.index;
      const end = position + refMatch[0].length;

      if (!overlaps(position, end)) {
        claims.push({
          type,
          id,
          matchedText: refMatch[0],
          position,
        });
        matchedRanges.push({ start: position, end });
      }
    }

    // 2. Extract alias-based mentions (longest-first to prevent partial matches)
    for (const alias of this.sortedAliases) {
      const pattern = alias.pattern;
      let searchFrom = 0;

      while (searchFrom < lowerText.length) {
        const idx = lowerText.indexOf(pattern, searchFrom);
        if (idx === -1) break;

        const end = idx + pattern.length;

        // Check word boundaries to avoid matching inside longer words
        const charBefore = idx > 0 ? lowerText[idx - 1] : " ";
        const charAfter = end < lowerText.length ? lowerText[end] : " ";
        const isWordBoundaryBefore = /[\s,;:.!?()[\]{}"'\-—–/]/.test(charBefore) || idx === 0;
        const isWordBoundaryAfter = /[\s,;:.!?()[\]{}"'\-—–/]/.test(charAfter) || end === lowerText.length;

        if (isWordBoundaryBefore && isWordBoundaryAfter && !overlaps(idx, end)) {
          claims.push({
            type: alias.type,
            id: alias.id,
            matchedText: text.slice(idx, end),
            position: idx,
          });
          matchedRanges.push({ start: idx, end });
        }

        searchFrom = end;
      }
    }

    // Sort by position for consistent ordering
    claims.sort((a, b) => a.position - b.position);

    return claims;
  }

  /**
   * Verify a single claim against the knowledge context.
   * Checks that the mentioned entity actually exists and its attributes match.
   */
  verifyClaim(claim: Claim): VerificationResult {
    switch (claim.type) {
      case "principle":
        return this.verifyPrinciple(claim);
      case "sdg":
        return this.verifySdg(claim);
      case "framework":
        return this.verifyFramework(claim);
      case "nature-pattern":
        return this.verifyNaturePattern(claim);
      default:
        return { claim, valid: false, issue: `Unknown claim type: ${claim.type}` };
    }
  }

  /**
   * Full validation pipeline: extract all claims, verify each one.
   * Returns approved=true if all claims are valid (or if there are no claims).
   */
  validate(text: string): ValidationResult {
    const claims = this.extractClaims(text);
    const issues: VerificationResult[] = [];

    for (const claim of claims) {
      const result = this.verifyClaim(claim);
      if (!result.valid) {
        issues.push(result);
      }
    }

    return {
      approved: issues.length === 0,
      claims,
      issues,
    };
  }

  // --- Private verification methods ---

  private verifyPrinciple(claim: Claim): VerificationResult {
    const principles = this.knowledgeContext.principles;
    if (!principles || principles.length === 0) {
      return { claim, valid: false, issue: "No principles loaded in knowledge context" };
    }

    const numId = parseInt(claim.id, 10);
    if (isNaN(numId) || numId < 1 || numId > 12) {
      return { claim, valid: false, issue: `Principle ID "${claim.id}" is out of range (1-12)` };
    }

    const principle = principles.find((p) => p.id === numId);
    if (!principle) {
      return { claim, valid: false, issue: `Principle ${claim.id} not found in knowledge base` };
    }

    // If the matched text includes a name alongside the number, verify it matches
    const nameIssue = this.verifyNameInText(claim.matchedText, principle.name, "principle");
    if (nameIssue) {
      return { claim, valid: false, issue: nameIssue };
    }

    return { claim, valid: true };
  }

  private verifySdg(claim: Claim): VerificationResult {
    const sdgs = this.knowledgeContext.sdgs;
    if (!sdgs || sdgs.length === 0) {
      return { claim, valid: false, issue: "No SDGs loaded in knowledge context" };
    }

    const numId = parseInt(claim.id, 10);
    if (isNaN(numId) || numId < 1 || numId > 17) {
      return { claim, valid: false, issue: `SDG ID "${claim.id}" is out of range (1-17)` };
    }

    const sdg = sdgs.find((s) => s.id === numId);
    if (!sdg) {
      return { claim, valid: false, issue: `SDG ${claim.id} not found in knowledge base` };
    }

    // If the matched text includes a title alongside the number, verify it matches
    const nameIssue = this.verifyNameInText(claim.matchedText, sdg.title, "SDG");
    if (nameIssue) {
      return { claim, valid: false, issue: nameIssue };
    }

    return { claim, valid: true };
  }

  private verifyFramework(claim: Claim): VerificationResult {
    const frameworks = this.knowledgeContext.frameworks;
    if (!frameworks || frameworks.length === 0) {
      return { claim, valid: false, issue: "No frameworks loaded in knowledge context" };
    }

    const framework = frameworks.find((f) => f.id === claim.id);
    if (!framework) {
      return {
        claim,
        valid: false,
        issue: `Framework "${claim.id}" not found in knowledge base`,
      };
    }

    return { claim, valid: true };
  }

  private verifyNaturePattern(claim: Claim): VerificationResult {
    const patterns = this.knowledgeContext.naturePatterns;
    if (!patterns || patterns.length === 0) {
      return { claim, valid: false, issue: "No nature patterns loaded in knowledge context" };
    }

    const pattern = patterns.find((p) => p.id === claim.id);
    if (!pattern) {
      return {
        claim,
        valid: false,
        issue: `Nature pattern "${claim.id}" not found in knowledge base`,
      };
    }

    return { claim, valid: true };
  }

  /**
   * Checks if the matched text contains a name/title component that doesn't match
   * the knowledge base entry. This catches cases like "Princípio 3 — wrong name".
   */
  private verifyNameInText(
    matchedText: string,
    expectedName: string,
    entityType: string
  ): string | null {
    // Check if the matched text contains a separator (— or -) indicating a name was included
    const separatorMatch = matchedText.match(/\s*[-—–]\s*(.+)$/i);
    if (!separatorMatch) {
      return null; // No name component in the match, nothing to verify
    }

    const mentionedName = separatorMatch[1].trim().toLowerCase();
    const expected = expectedName.toLowerCase();

    if (mentionedName !== expected) {
      return `${entityType} name mismatch: text says "${separatorMatch[1].trim()}" but knowledge base says "${expectedName}"`;
    }

    return null;
  }
}
