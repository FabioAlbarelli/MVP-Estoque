# Regras de desenvolvimento

- Comunicação e documentação em português brasileiro.
- Código modular, limpo e reutilizável. Mudanças pequenas, rastreáveis e justificadas.
- Confirmar caminho, branch, estado Git e origin antes de alterar arquivos. Repositório exclusivo: https://github.com/FabioAlbarelli/MVP-Estoque.
- Não acessar ou modificar projetos externos, especialmente Drybrasil e Drybrasil-Estoque.
- Não realizar refatorações amplas sem autorização; preservar funcionalidades existentes.
- Analisar dependências e efeitos colaterais antes de modificar código.
- Testes direcionados por funcionalidade e testes de regressão para bugs. Nunca declarar aprovação sem executar.
- Registrar decisões técnicas e resultados reais em docs/entregas.
- Plano de reversão para mudanças relevantes: preservar a base Git; reverter somente commits identificados da mudança, sem reset destrutivo ou perda de trabalho do usuário.
- Sem backend, banco, autenticação ou integração de produção neste MVP.
- Câmera apenas por ação explícita, liberada ao sair; imagens processadas localmente.
- Manter contrato drybrasil-mp versão 1 e geração separada da apresentação.
- Nenhum deploy público, túnel, domínio, comunicação direta com impressora ou push sem autorização explícita.
