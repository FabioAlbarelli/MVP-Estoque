# DRYBRASIL · MVP de etiquetas QR Code

DRY-QR-MVP-001: aplicação independente para gerar, imprimir e ler etiquetas fictícias. Sem backend, banco, autenticação, serviços externos de QR ou integração de produção. Não registra estoque.

## Instalação e execução no Windows

Node.js 22.12+ ou 24 LTS e npm. Validado com Node 24.20.0 e npm 11.19.0.

```powershell
Set-Location C:\Projetos\MPV-Estoque
npm ci
npm run dev
```

Abra http://127.0.0.1:5173 (ou a porta indicada pelo Vite). Pare com Ctrl+C. A pasta local permaneceu MPV-Estoque conforme orientação do usuário; o remoto é MVP-Estoque.

```powershell
npm test
npm run build
npm run preview
```

O build gera `dist/`. Preview e desenvolvimento ficam restritos ao computador por padrão. Instalar dependências exige internet; a aplicação processa os dados localmente, com bibliotecas e worker servidos junto aos arquivos.

## Telas e funcionalidades

O menu inicial contém apenas **Gerar etiqueta** e **Ler etiqueta**. Ambas as telas oferecem **Voltar ao menu**.

**Gerar:** informe matéria-prima (até 60 caracteres) e quantidade inteira positiva segura. Unidade fixa BOBINA. Cada geração válida incrementa o lote TESTE-001, TESTE-002 etc. durante a sessão. Confira a prévia e clique em **Imprimir etiqueta**. Lotes reiniciam ao recarregar e não são identificadores globais. A última etiqueta permanece durante a navegação; não há histórico persistente.

**Ler:** clique em **Iniciar leitura**. A câmera traseira é preferida, com alternativa conforme o dispositivo. Após leitura válida, a câmera encerra e os dados aparecem. Use **Ler novamente**, **Fechar câmera** ou **Voltar ao menu**. Ocultar ou sair da página também encerra a câmera. **Ler imagem** processa um arquivo local, sem upload ou permissão da câmera. Códigos inválidos são rejeitados; na câmera, a busca continua até um código válido ou cancelamento.

## Contrato de dados

```json
{"schema":"drybrasil-mp","version":1,"lote":"TESTE-001","materia_prima":"CELULOSE","quantidade":10,"unidade":"BOBINA"}
```

Geração e interpretação compartilham `src/payload.ts`. Schema/versão desconhecidos, JSON inválido, lote fora do padrão, unidade diferente e quantidade inválida são rejeitados. O QR contém os dados completos, sem consulta a servidor. Não inserir dados pessoais ou segredos. Não há assinatura: qualquer pessoa pode criar um payload de teste equivalente.

## Acesso pelo celular e HTTPS

A câmera exige contexto seguro: HTTPS com certificado confiável no celular ou localhost no próprio computador. HTTP pelo IP do computador não habilita câmera no celular; localhost no telefone aponta para o telefone. Certificado com aviso de segurança não é solução confiável. Fonte: [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Nenhum acesso de rede, certificado, firewall, túnel ou publicação foi configurado. Procedimento para teste futuro autorizado na rede privada:

1. Conecte computador e celular à mesma rede sem isolamento de clientes. Descubra o IPv4 com `ipconfig`.
2. Instale [mkcert pela fonte oficial](https://github.com/FiloSottile/mkcert), execute `mkcert -install` e gere certificado para o IP real. Substitua o IP de exemplo:

```powershell
New-Item -ItemType Directory -Force certs
mkcert -cert-file certs/lan.pem -key-file certs/lan-key.pem 192.168.1.20 localhost 127.0.0.1
$env:QR_HTTPS_CERT = "$PWD\certs\lan.pem"
$env:QR_HTTPS_KEY = "$PWD\certs\lan-key.pem"
npm run dev -- --host 192.168.1.20
```

3. Localize a autoridade com `mkcert -CAROOT`. Transfira **somente rootCA.pem** para o celular e instale como CA confiável. Nunca transfira `rootCA-key.pem` nem a chave do servidor. `certs/` está ignorado no Git.
4. Android: instale o certificado CA nas configurações de segurança (varia conforme fabricante) e teste Chrome atualizado. iPhone: instale o perfil e habilite confiança total em Ajustes → Geral → Sobre → Ajustes de Confiança de Certificados; teste Safari atualizado. Aparelhos gerenciados podem bloquear a instalação. Veja [mkcert em dispositivos móveis](https://github.com/FiloSottile/mkcert#mobile-devices).
5. Se necessário e autorizado, permita a porta indicada pelo Vite somente no firewall da rede privada. Abra `https://IP:5173`, confirme ausência de aviso de certificado e inicie a câmera. A porta pode mudar se estiver ocupada.
6. Ao encerrar, pare o servidor, remova as variáveis com `Remove-Item Env:QR_HTTPS_CERT, Env:QR_HTTPS_KEY`, remova regras temporárias do firewall e a CA dos dispositivos quando não for mais necessária. Não use encaminhamento de portas, rede pública, domínio ou túnel.

O suporte opcional a certificados utiliza [server.https do Vite](https://vite.dev/config/server-options.html#server-https). Esse procedimento não foi executado nesta entrega. Permissão negada deve ser corrigida nas configurações do site. Câmera ocupada/ausente, navegador incompatível e QR inválido têm mensagens. A biblioteca consolida alguns erros como câmera indisponível, sem distinguir permissão de hardware. Prefira navegador direto, evitando navegadores embutidos em aplicativos.

## Impressão e Zebra

Modelo inicial: **100 × 50 mm**. Dimensões em `LABEL_SIZE` no módulo `src/label.ts`; ao alterá-las, revisar também o layout CSS e o tamanho do QR. Geração separada da apresentação. QR preto e branco, quadrado, com margem de quatro módulos. A impressão isola a etiqueta, usa dimensões físicas e margem de página zero.

No diálogo: mídia 100 × 50 mm, escala 100%/tamanho real, margens zero, sem cabeçalhos/rodapés. Confira a prévia. Para A4, preserve tamanho real e meça o resultado. Navegador/driver pode substituir o tamanho solicitado. PDF/papel comum são etapas de validação, sem comprovar compatibilidade física.

Zebra: viável investigar impressão pelo navegador via driver Windows e mídia configurada. Modelo, DPI (203/300), calibração e área imprimível exigem teste real. ZPL futuro pode usar comandos de tamanho, posicionamento e QR (`^PW`, `^LL`, `^FO`, `^BQN`, `^FD`), com conversão mm/pontos e escape de conteúdo. ZPL e comunicação direta não foram implementados. [Zebra Browser Print](https://www.zebra.com/us/en/support-downloads/software/printer-software/browser-print.html) é uma alternativa futura com integração própria, condicionada a autorização. Consulte o [guia oficial](https://www.zebra.com/content/dam/support-dam/en/documentation/unrestricted/guide/software/zebra-browser-print-user-guide-v1-3-2-en-us.pdf).

## Tecnologias e estrutura

TypeScript + Vite, sem framework: três telas simples não exigem camada adicional. `qrcode` gera QR local; `qr-scanner` lê câmera/imagem com worker local. Vitest/jsdom testam contrato, navegação, apresentação e câmera simulada. jsQR decodifica pixels de um QR realmente gerado, sem substituir ensaio do leitor no aparelho. Lockfile fixa as versões resolvidas.

```text
src/payload.ts   Contrato, validação e interpretação
src/label.ts     QR Code e apresentação da etiqueta
src/reader.ts    Ciclo de leitura, cancelamento e duplicatas
src/main.ts      Telas e adaptação da câmera
src/style.css    Responsividade e impressão
tests/          Testes de contrato, leitor e interface
vite.config.ts  HTTPS opcional por certificados locais
docs/entregas/   Relatório de implementação
AGENTS.md       Regras de desenvolvimento
```

## Pendências e próximos passos

- Gerar várias etiquetas e conferir dados, acentos e nomes longos.
- Salvar PDF, imprimir papel, medir 100 × 50 mm e verificar cortes/contraste.
- Abrir câmera em Android/Chrome e iPhone/Safari com HTTPS confiável.
- Ler QR da tela e do papel, repetir leituras e verificar liberação da câmera.
- Negar/conceder permissão, testar câmera indisponível, QR inválido e leitura de imagem.
- Testar Zebra com modelo e DPI conhecidos.

A aprovação final depende desses testes físicos. Não foram executados nesta entrega. Próximos passos: ajustar layout com ensaios reais e avaliar ZPL se necessário. Sem controle real de estoque, persistência ou integração externa.
