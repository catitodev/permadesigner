/**
 * Política de Privacidade — página pública.
 * Requisito LGPD: informar ao usuário como seus dados são tratados.
 */

export const metadata = {
  title: "Política de Privacidade — PermaDesigner",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">Política de Privacidade</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Última atualização: julho de 2026
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold">1. Dados coletados</h2>
          <p>
            Coletamos apenas os dados necessários para o funcionamento do app:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Email e nome (via login com Google)</li>
            <li>Respostas fornecidas durante o processo de design</li>
            <li>Fotos anexadas aos projetos (armazenadas no Supabase Storage)</li>
            <li>Preferência de tema (claro/escuro)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">2. Como usamos seus dados</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Gerar respostas personalizadas do assistente de IA</li>
            <li>Produzir seu documento de escopo de design</li>
            <li>Permitir retomada de projetos entre sessões</li>
          </ul>
          <p className="mt-2">
            <strong>Não vendemos, compartilhamos ou usamos seus dados para marketing.</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">3. Provedores de IA</h2>
          <p>
            Suas mensagens são enviadas a provedores de IA (Google Gemini, Groq ou
            OpenRouter) para gerar respostas. Dados sensíveis do projeto (endereços,
            coordenadas) são mascarados em logs internos. Os provedores podem reter
            dados conforme suas próprias políticas — consulte-as se necessário.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">4. Seus direitos (LGPD)</h2>
          <p>Você tem direito a:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Acessar todos os dados que temos sobre você</li>
            <li>Corrigir informações incorretas</li>
            <li>Excluir todos os seus dados a qualquer momento</li>
            <li>Exportar seus dados (via documento de escopo gerado)</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, use a opção &quot;Excluir minha conta&quot; nas
            configurações do app, ou entre em contato conosco.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">5. Segurança</h2>
          <p>
            Utilizamos Row Level Security (RLS) no banco de dados, HTTPS em todas as
            comunicações, e as chaves de API são mantidas apenas no servidor —
            nunca expostas ao navegador.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">6. Contato</h2>
          <p>
            Em caso de dúvidas sobre esta política, entre em contato pelo
            repositório do projeto no GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}
