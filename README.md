# PermaDesigner

Assistente conversacional que guia o planejamento de projetos de permacultura, produzindo um documento de escopo de design.

## Ideia

Transformar os frameworks de design em permacultura (SADIMET, OBREDIMET, Design Web, Dragon Dreaming, GoSADIM, Theory U) em uma experiência interativa e acessível — onde qualquer pessoa, de iniciantes a profissionais, consegue articular um projeto de permacultura completo por meio de uma conversa guiada.

O app conduz o usuário por etapas (objetivos, levantamento do local, leitura dos padrões da natureza, fronteiras/recursos, decisões de design pelos 12 princípios, alinhamento com os ODS) e gera um documento exportável em PDF/DOCX.

## Frameworks conceituais

- 8 frameworks de design em permacultura (PermaBrasilis)
- 12 princípios de David Holmgren
- 17 Objetivos de Desenvolvimento Sustentável (ONU)
- Leitura dos padrões da natureza (sol, água, vento, topografia, solo, vegetação, fauna, bordas, uso humano)

## Stack

- Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui
- Supabase (Auth + Postgres + RLS + Storage)
- Google Gemini / Groq / OpenRouter (IA com fallback)
- @react-pdf/renderer · docx · Resend
- PWA com suporte offline

## Rodar localmente

```bash
npm install
cp .env.example .env.local  # preencher com suas chaves
npm run dev
```

## Licença

CC BY-SA 4.0 — [Creative Commons](https://creativecommons.org/licenses/by-sa/4.0/)
