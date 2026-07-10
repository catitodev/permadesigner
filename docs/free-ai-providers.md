# Provedores de IA Gratuitos — Comparativo e Recomendação

> Dados de limites de free tier mudam com frequência. As informações abaixo foram checadas em
> julho de 2026; **confira sempre a documentação oficial do provedor antes de assumir um limite
> como definitivo** — é uma prática comum entre esses provedores reduzir cotas sem aviso prévio.

## Recomendação para este projeto

| Papel | Provedor | Por quê |
|---|---|---|
| **Primário** | **Google Gemini API** (`gemini-2.5-flash`) | Free tier mais generoso para conversas contínuas em 2026 (na ordem de 1.500 requisições/dia, sem cartão de crédito, contexto de até 1M tokens). Login do app já usa conta Google — reduz o número total de contas/serviços que o time precisa gerenciar. |
| **Fallback de velocidade** | **Groq** (`llama-3.3-70b-versatile`) | Hardware dedicado (LPU); latência muito baixa, o que importa para não travar a conversa quando o Gemini estiver limitado. API compatível com o SDK da OpenAI, troca de provedor é só mudar a `baseURL`. |
| **Fallback de variedade (opcional)** | **OpenRouter** (modelos `:free`) | Uma chave só, dezenas de modelos gratuitos por trás — bom plano C se os dois primeiros estiverem indisponíveis ao mesmo tempo. |

Essa combinação cobre o Requisito 8 (resiliência do provedor de IA) sem exigir orçamento.

## Tabela comparativa (visão geral, julho de 2026)

| Provedor | Cartão de crédito? | Cota gratuita aproximada | Pontos fortes | Pontos de atenção |
|---|---|---|---|---|
| Google Gemini API (AI Studio) | Não | ~1.500 req/dia no Gemini 2.5 Flash, contexto até 1M tokens | Modelo frontier, contexto enorme, multimodal (texto, imagem, áudio) | Rate limit por minuto mais baixo que o diário; Google pode usar prompts para treinar modelo fora da UE/Reino Unido |
| Groq | Não | Dezenas de milhares de requisições/dia em modelos abertos (Llama 3.x, Gemma, Mixtral), ~30 req/min | Velocidade extrema (LPU), ótimo para chat em tempo real | Modelos abertos, não modelos proprietários "frontier"; qualidade um degrau abaixo do Gemini Pro em tarefas muito complexas |
| OpenRouter | Não (para modelos `:free`) | Limite por modelo, tipicamente 10–20 req/min | Uma chave para dezenas de modelos gratuitos, fácil trocar de modelo | Depende do provedor por trás de cada modelo; throughput menor que ir direto no provedor |
| Cerebras | Não | Alto volume diário de tokens em modelos abertos | Ótimo para processamento em lote (ex.: reprocessar toda a base de conhecimento) | Não é o foco principal deste app (conversa interativa, não batch) |
| Mistral (Le Chat / La Plateforme) | Depende do tier | Tier gratuito de prototipagem disponível | Modelos europeus, boas opções de custo depois do free tier | Tier mais generoso exige opt-in de uso dos dados para treinamento |

## Como isso se conecta à arquitetura

Ver `design.md` do spec, §5 (`modules/core/ai/`). A interface `AiProvider` é a mesma
independentemente do provedor, então essa tabela pode mudar ao longo do tempo sem exigir
retrabalho de arquitetura — só ajustar `provider-registry.ts`.

## Sinais de que é hora de migrar para camada paga

- Uso diário se aproximando consistentemente do limite do Gemini (~1.500 req/dia) mesmo com
  Groq/OpenRouter absorvendo o excedente.
- Necessidade de SLA (nenhum provedor gratuito garante disponibilidade contratual).
- Necessidade de garantia formal de que os dados do usuário não são usados para treinar modelos
  de terceiros (a maioria dos tiers gratuitos reserva esse direito, exceto para contas na
  UE/Reino Unido/EEE em alguns provedores).

Nesse ponto, a rota mais barata costuma ser manter Gemini/Groq como estava e adicionar
DeepSeek (via API paga) como camada intermediária antes de subir para modelos frontier full
price — mas essa decisão deve ser revisitada com os preços vigentes no momento, não com os
valores deste documento.
