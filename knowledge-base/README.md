# knowledge-base/

Esta pasta é a **única fonte de verdade factual** sobre frameworks de design, princípios de
permacultura, ODS e padrões da natureza usada pelo app. O assistente de IA nunca deve responder
sobre esses temas a partir da própria memória — sempre a partir destes arquivos. Ver
`.kiro/steering/security-policies.md` para o mecanismo completo.

## Arquivos

| Arquivo | Conteúdo | Origem |
|---|---|---|
| `frameworks.json` | 8 frameworks de design em permacultura (SADIMET, OBREDIMET, Design Web, Dragon Dreaming, Theory U, SADI/BREDIM, Cultural Emergence, GoSADIM) | Extraído do guia PermaBrasilis "Frameworks de Design em Permacultura" (PDF/PPTX) |
| `principles.json` | Os 12 princípios de permacultura de David Holmgren | Extraído do guia PermaBrasilis "ODS + 12 Princípios da Permacultura" (PDF) |
| `sdgs.json` | Os 17 Objetivos de Desenvolvimento Sustentável da ONU (título oficial + cor oficial) | Extraído do mesmo guia; **não inclui os ícones oficiais da ONU** — apenas a cor de referência, respeitando as diretrizes de uso de marca da ONU já documentadas no guia original |
| `nature-patterns.json` | 9 categorias de leitura dos padrões da natureza (sol/sombra, água, vento, topografia, solo, vegetação, fauna, bordas, uso humano) | Conteúdo novo, criado especificamente para este app, alinhado aos Princípios 1 e 7 |

## Regras de atualização

1. Qualquer mudança de conteúdo é uma alteração direta nesses arquivos JSON, revisada como
   qualquer outra mudança de código (pull request).
2. Toda alteração DEVE continuar validando contra o schema correspondente em `schema/`
   (`npm run validate:kb`).
3. Nunca adicionar um framework, princípio ou ODS que não exista nos guias PermaBrasilis
   publicados (ou, no caso de `nature-patterns.json`, que não tenha sido deliberadamente
   revisado como conteúdo pedagogicamente correto) — isso quebraria a garantia de grounding do
   Requisito 7.
4. Se um novo guia PermaBrasilis for publicado, sincronizar aqui antes de expor a nova versão
   no app.
5. Campos `sourceLicense` devem ser mantidos honestos: nem todo framework tem uma licença
   Creative Commons formal (ver detalhamento completo no próprio guia em PDF, seção "Licenças e
   Créditos"). Nunca inventar uma licença que não foi verificada.

## Como o app usa cada campo

- `id` — identificador estável usado em `grounding_refs` (badges de fonte na UI) e nas
  referências dentro do `DesignScopeDocument`.
- `guidingQuestion(s)` — usadas literalmente pelo `conversation-wizard` como ponto de partida
  das perguntas feitas ao usuário (o modelo de IA pode reformular a pergunta, mas o conteúdo
  vem daqui).
- `colorToken` (em `principles.json`) — mapeia para os tokens de cor Tailwind definidos em
  `modules/scope-export/templates/tokens.ts`, garantindo que a cor de cada princípio seja igual
  na UI, no PDF e no DOCX.
