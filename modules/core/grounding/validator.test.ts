import { describe, it, expect } from "vitest";
import { GroundingValidator, KnowledgeContext } from "./validator";

// Minimal knowledge context for tests
const knowledgeContext: KnowledgeContext = {
  frameworks: [
    { id: "sadimet", name: "SADIMET" },
    { id: "obredimet", name: "OBREDIMET" },
    { id: "design_web", name: "Design Web" },
    { id: "dragon_dreaming", name: "Dragon Dreaming" },
    { id: "theory_u", name: "Theory U" },
  ],
  principles: [
    { id: 1, name: "Observar e Interagir" },
    { id: 2, name: "Captar e Armazenar Energia" },
    { id: 3, name: "Obter um Rendimento" },
    { id: 7, name: "Design a Partir de Padrões para Detalhes" },
    { id: 12, name: "Usar e Responder à Mudança de Forma Criativa" },
  ],
  sdgs: [
    { id: 1, title: "Erradicação da Pobreza" },
    { id: 2, title: "Fome Zero e Agricultura Sustentável" },
    { id: 6, title: "Água Potável e Saneamento" },
    { id: 13, title: "Ação Contra a Mudança Global do Clima" },
    { id: 15, title: "Vida Terrestre" },
  ],
  naturePatterns: [
    { id: "sun-shade", name: "Sol e Sombra" },
    { id: "water", name: "Água" },
    { id: "wind", name: "Vento" },
    { id: "topography", name: "Topografia" },
    { id: "soil", name: "Solo" },
    { id: "edges", name: "Bordas e Ecótonos" },
  ],
};

describe("GroundingValidator", () => {
  const validator = new GroundingValidator(knowledgeContext);

  describe("extractClaims", () => {
    it("should extract principle mentions by alias (P1, P2, etc.)", () => {
      const text = "Aplicando P1 e P7 no terreno.";
      const claims = validator.extractClaims(text);

      expect(claims).toHaveLength(2);
      expect(claims[0]).toMatchObject({ type: "principle", id: "1", matchedText: "P1" });
      expect(claims[1]).toMatchObject({ type: "principle", id: "7", matchedText: "P7" });
    });

    it("should extract principle mentions by full name", () => {
      const text = "O princípio 3 orienta o rendimento.";
      const claims = validator.extractClaims(text);

      expect(claims).toHaveLength(1);
      expect(claims[0]).toMatchObject({ type: "principle", id: "3" });
    });

    it("should extract SDG mentions (ODS N)", () => {
      const text = "Este design alinha com ODS 6 e ODS 15.";
      const claims = validator.extractClaims(text);

      const sdgClaims = claims.filter((c) => c.type === "sdg");
      expect(sdgClaims).toHaveLength(2);
      expect(sdgClaims[0]).toMatchObject({ type: "sdg", id: "6" });
      expect(sdgClaims[1]).toMatchObject({ type: "sdg", id: "15" });
    });

    it("should extract framework mentions", () => {
      const text = "Usamos o SADIMET como framework principal.";
      const claims = validator.extractClaims(text);

      expect(claims.some((c) => c.type === "framework" && c.id === "sadimet")).toBe(true);
    });

    it("should extract nature pattern mentions", () => {
      const text = "A análise de sol e sombra e água do terreno revelou...";
      const claims = validator.extractClaims(text);

      const patternClaims = claims.filter((c) => c.type === "nature-pattern");
      expect(patternClaims).toHaveLength(2);
      expect(patternClaims[0]).toMatchObject({ id: "sun-shade" });
      expect(patternClaims[1]).toMatchObject({ id: "water" });
    });

    it("should extract inline ref tags [[ref:type:id]]", () => {
      const text = "Ver [[ref:principle:3]] e [[ref:sdg:6]] para detalhes.";
      const claims = validator.extractClaims(text);

      expect(claims).toHaveLength(2);
      expect(claims[0]).toMatchObject({ type: "principle", id: "3", matchedText: "[[ref:principle:3]]" });
      expect(claims[1]).toMatchObject({ type: "sdg", id: "6", matchedText: "[[ref:sdg:6]]" });
    });

    it("should extract [[ref:framework:id]] and [[ref:nature-pattern:id]]", () => {
      const text = "Usando [[ref:framework:sadimet]] com padrão [[ref:nature-pattern:water]].";
      const claims = validator.extractClaims(text);

      expect(claims).toHaveLength(2);
      expect(claims[0]).toMatchObject({ type: "framework", id: "sadimet" });
      expect(claims[1]).toMatchObject({ type: "nature-pattern", id: "water" });
    });

    it("should return empty array for text with no claims", () => {
      const text = "Este é um texto genérico sem referências a conceitos.";
      const claims = validator.extractClaims(text);

      expect(claims).toHaveLength(0);
    });

    it("should not create duplicate overlapping claims", () => {
      const text = "Princípio 1 - Observar e Interagir é fundamental.";
      const claims = validator.extractClaims(text);

      // Should find the full "princípio 1 - observar e interagir" as one claim, not multiple
      const principleClaims = claims.filter((c) => c.type === "principle");
      // At minimum, we shouldn't have the same position matched twice
      const positions = principleClaims.map((c) => c.position);
      const uniquePositions = new Set(positions);
      expect(positions.length).toBe(uniquePositions.size);
    });

    it("should record correct positions", () => {
      const text = "Início. P1 é bom.";
      const claims = validator.extractClaims(text);

      expect(claims[0].position).toBe(text.toLowerCase().indexOf("p1"));
    });
  });

  describe("verifyClaim", () => {
    it("should validate a correct principle claim", () => {
      const result = validator.verifyClaim({
        type: "principle",
        id: "1",
        matchedText: "P1",
        position: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.issue).toBeUndefined();
    });

    it("should reject a principle with out-of-range ID", () => {
      const result = validator.verifyClaim({
        type: "principle",
        id: "13",
        matchedText: "P13",
        position: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.issue).toContain("out of range");
    });

    it("should validate a correct SDG claim", () => {
      const result = validator.verifyClaim({
        type: "sdg",
        id: "6",
        matchedText: "ODS 6",
        position: 0,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject an SDG with out-of-range ID", () => {
      const result = validator.verifyClaim({
        type: "sdg",
        id: "18",
        matchedText: "ODS 18",
        position: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.issue).toContain("out of range");
    });

    it("should validate a correct framework claim", () => {
      const result = validator.verifyClaim({
        type: "framework",
        id: "sadimet",
        matchedText: "SADIMET",
        position: 0,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject an unknown framework", () => {
      const result = validator.verifyClaim({
        type: "framework",
        id: "unknown_framework",
        matchedText: "unknown_framework",
        position: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.issue).toContain("not found");
    });

    it("should validate a correct nature pattern claim", () => {
      const result = validator.verifyClaim({
        type: "nature-pattern",
        id: "water",
        matchedText: "água",
        position: 0,
      });

      expect(result.valid).toBe(true);
    });

    it("should reject an unknown nature pattern", () => {
      const result = validator.verifyClaim({
        type: "nature-pattern",
        id: "unknown-pattern",
        matchedText: "unknown-pattern",
        position: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.issue).toContain("not found");
    });

    it("should detect name mismatch in principle with separator", () => {
      const result = validator.verifyClaim({
        type: "principle",
        id: "1",
        matchedText: "Princípio 1 — Nome Errado",
        position: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.issue).toContain("mismatch");
    });
  });

  describe("validate", () => {
    it("should approve text with all valid claims", () => {
      const text = "Usamos P1 e ODS 6 no projeto com SADIMET.";
      const result = validator.validate(text);

      expect(result.approved).toBe(true);
      expect(result.claims.length).toBeGreaterThan(0);
      expect(result.issues).toHaveLength(0);
    });

    it("should approve text with no claims", () => {
      const text = "Um texto sem nenhuma referência técnica.";
      const result = validator.validate(text);

      expect(result.approved).toBe(true);
      expect(result.claims).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    it("should reject text with invalid claims via inline ref", () => {
      const text = "Ver [[ref:framework:inexistente]] para mais.";
      const result = validator.validate(text);

      expect(result.approved).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toContain("not found");
    });

    it("should return mixed results with some valid and some invalid claims", () => {
      const text = "P1 é válido mas [[ref:sdg:99]] não existe.";
      const result = validator.validate(text);

      expect(result.approved).toBe(false);
      expect(result.claims.length).toBeGreaterThanOrEqual(2);
      expect(result.issues).toHaveLength(1);
    });
  });
});
