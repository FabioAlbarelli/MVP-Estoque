# DRY-QR-MVP-001 — Relatório de implementação

Data: 28/10/2026. Status: código pronto para validação manual; aprovação física pendente.

## Objetivo e base Git

Validar geração, impressão e leitura local de etiquetas fictícias sem alterar sistemas existentes ou integrar produção.

Pasta: `C:\Projetos\MPV-Estoque`, mantida por orientação expressa do usuário após bloqueio de renomeação pelo Windows. Estava vazia, sem Git. Não foi criada outra pasta. Git inicializado, origin configurado como `https://github.com/FabioAlbarelli/MVP-Estoque.git`. O remoto possuía `main` em `7bec8d973b800face85576ad089191b2fd6d918c` (Initial commit), com LICENSE e README. Essa base foi obtida por fetch e preservada, com main acompanhando origin/main. Sem clone, force push, push ou deploy.

## Stack e decisões

- TypeScript 5.9.3 e Vite 8.3.5, sem framework/backend para manter execução simples no Windows.
- qrcode 1.5.4 gera QR local; qr-scanner 1.4.2 lê câmera/imagem com worker empacotado localmente.
- Vitest 5.0.5, jsdom 27.4.0 e jsQR 1.4.0 para testes direcionados.
- Contrato único `drybrasil-mp` versão 1, sem consulta a servidor ou assinatura.
- Unidade inicial BOBINA, matéria-prima limitada a 60 caracteres e quantidade inteira positiva segura para proteger o contrato e o layout.
- Lotes incrementais por sessão, sem persistência ou unicidade global.
- QR e apresentação separados; dimensões de impressão centralizadas em LABEL_SIZE, layout revisto em conjunto quando alterado.
- Rede restrita a loopback por padrão. HTTPS opcional lê certificados fornecidos pelo operador; nenhum certificado, regra de firewall, domínio, túnel ou acesso LAN foi configurado.

## Arquivos

Alterado: README.md.

Criados: .gitignore, AGENTS.md, package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html; src/payload.ts, src/label.ts, src/reader.ts, src/main.ts, src/style.css; tests/payload.test.ts, tests/reader.test.ts, tests/ui.test.ts; docs/entregas/DRY-QR-MVP-001.md.

LICENSE preservada. node_modules, dist e certs ignorados. Nenhum projeto externo foi acessado ou modificado.

## Funcionalidades

Três telas independentes: menu inicial com duas ações, geração e leitura. Formulário validado, lote automático, prévia e impressão de uma etiqueta 100 × 50 mm, texto seguro e legível. Geração de múltiplas etiquetas durante a sessão.

Câmera somente por ação do usuário, preferência traseira, visualização com região de leitura, resultado validado, prevenção de duplicatas e nova leitura. Fechar, navegar, ocultar ou sair libera câmera e recursos. Requisições pendentes não podem atualizar uma sessão cancelada nem iniciar outra câmera simultaneamente. As tracks são encerradas explicitamente para não depender do atraso interno da biblioteca. A alternativa por arquivo usa processamento local e descarta resultados após navegação/cancelamento.

Mensagens para contexto inseguro, API indisponível, câmera inacessível e payload inválido. Alguns erros da biblioteca são consolidados como Camera not found; a mensagem orienta verificar permissão, hardware e câmera ocupada.

## Testes realmente executados

Ambiente: Windows, Node 24.20.0, npm 11.19.0.

| Verificação | Resultado |
| --- | --- |
| npm install e atualização direcionada do Vitest | Concluídos; lockfile gerado |
| npm test — rodada final | 3 arquivos, 22 testes aprovados |
| npm run build — rodada final | TypeScript sem erros; build Vite concluído, 39 módulos |
| npm audit — rodada final | 0 vulnerabilidades reportadas |
| npm run dev -- --port 5173 --strictPort | Servidor iniciado em 127.0.0.1:5173 |
| Requisições HTTP / e /src/main.ts | Ambas responderam 200 |
| git diff --check | Sem erros de whitespace; aviso Windows LF/CRLF no README |

Cobertura direcionada: entradas inválidas, JSON/schema/versão, lote/unidade, round-trip do contrato, QR real gerado e decodificado em pixels (incluindo acento), inicializações simultâneas, duplicatas, payload inválido seguido de válido, cancelamento com início pendente, callback tardio, falha/retry, navegação das três telas, preparação da etiqueta, texto sem injeção HTML e liberação simulada de tracks ao retornar ao menu.

Houve tentativas iniciais bloqueadas por `spawn EPERM` no sandbox Windows (workers do Vitest e carregamento da configuração Vite). Foram repetidas com execução autorizada fora dessa restrição, com sucesso; não foram contabilizadas como testes aprovados. A instalação inicial reportou dois alertas moderados associados ao Vitest 4.1.11; a atualização para 5.0.5 eliminou os alertas da auditoria executada. Não foi aplicado upgrade indiscriminado de dependências.

Os testes de navegação e câmera são simulados em jsdom. A decodificação em pixels usa jsQR e não constitui validação física do qr-scanner no celular. Não houve inspeção visual em navegador real, impressão PDF/manual ou teste de câmera física.

## Limitações, riscos e validação manual

Pendentes: Android/Chrome e iPhone/Safari com HTTPS confiável; leitura da tela e papel; vários códigos consecutivos; câmera ao voltar/ocultar/sair; negar/conceder permissão; leitura por imagem no aparelho; PDF/papel medido; impressora Zebra real.

Impressão depende de navegador, driver, mídia, escala e margens. Modelo Zebra, DPI, calibração e área imprimível precisam ser identificados. README documenta viabilidade via navegador/driver e eventual ZPL; nenhuma compatibilidade física foi declarada ou comunicação direta implementada.

Dados são fictícios, sem assinatura, persistência, autenticação ou unicidade global dos lotes. QR denso, luz, foco, tamanho e qualidade do papel podem limitar leitura. A largura mínima da prévia pode exigir rolagem horizontal em celulares, preservando dimensões físicas. Certificado local requer confiança explícita em cada aparelho; instruções no README não substituem a configuração e validação pelo responsável.

## Execução e próximos passos

Em PowerShell na pasta do projeto: `npm ci`, `npm run dev`; abrir o endereço local indicado. Validar com `npm test` e `npm run build`. Instruções detalhadas de geração, câmera, HTTPS local e impressão estão no README.

Próximos passos: executar checklist manual do README, ajustar dimensões conforme ensaio físico e avaliar ZPL após conhecer equipamento e obter autorização. Nenhum deploy, túnel ou push autorizado nesta entrega.

## Reversão e versionamento

Implementação e documentação preparadas para commit local sobre a base remota preservada. A primeira tentativa foi bloqueada por ausência de user.name/user.email. Após o usuário informar manutencaodrybrasil@gmail.com, a identidade foi definida somente neste repositório, usando manutencaodrybrasil como nome derivado do e-mail. Consultar git log para o identificador do commit da entrega. Sem push. A reversão deve usar revert somente do commit desta entrega, preservando o commit inicial e eventuais alterações posteriores do usuário. Dependências e arquivos gerados são reproduzíveis pelo lockfile e build. Nenhuma alteração de infraestrutura exige reversão.
