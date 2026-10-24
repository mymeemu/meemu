# MEEMU

Aplicação Next.js 16 / React 19 com autenticação Supabase e editor de perfil.

## Desenvolvimento

Use Node.js 24 LTS (ver `engines` em `package.json`) e npm 11.

```sh
npm ci
cp .env.example .env.local
# Preencha somente a URL e a chave pública do projeto Supabase.
npm run dev
```

Acesse <http://localhost:3000>. As variáveis `NEXT_PUBLIC_*` são incluídas no
JavaScript do navegador durante o build. Nunca coloque uma chave `service_role`
ou `sb_secret_*` nessas variáveis. A chave pública legada pode ser configurada
com `NEXT_PUBLIC_SUPABASE_ANON_KEY`; a publishable key tem preferência.

Sem configuração, a interface apresenta indisponibilidade ao tentar autenticar.
Não é preciso configurar Supabase para compilar o projeto.

## Verificações e produção

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Os testes usam identidades sintéticas. Os testes de componentes simulam o
cliente Supabase; os testes do SDK usam o SDK real com `fetch` simulado. Não
verificam entrega de email, SMTP, banco remoto nem a configuração do dashboard.
Execute também `npm audit`. O lockfile fixa Next.js 16.4.3, React/React DOM
19.3.1 e Sharp 0.35.5. O App Router foi mantido; desenvolvimento e build usam
Webpack explicitamente. Navegadores mínimos do Next.js 16: Chrome/Edge 111,
Firefox 111 e Safari 16.4. Os testes não cobrem todas essas versões.

O lint usa a CLI do ESLint e sua configuração flat; `next lint` foi removido no
Next.js 16, e `next build` não executa lint. Execute os comandos separadamente.
`typecheck` gera os tipos de rotas antes do TypeScript, inclusive em checkout
limpo. Nenhuma verificação de tipos/lint foi ignorada para compilar.

Tailwind 3 foi preservado. Os overrides de `postcss-selector-parser` 7.1.6 em
Tailwind e `postcss-nested` corrigem GHSA-rj75-hqrm-r3gf. Essa troca cruza uma
versão major do parser; o CSS dos três arquivos da aplicação e uma amostra de
nesting/utilitários foram comparados antes/depois com resultado idêntico. Revise
os overrides ao atualizar esses pacotes. O override de PostCSS no Next corrige
sua dependência transitiva. O lockfile deve permanecer versionado.

O ESLint 9.39.5 está fora de suporte, mas é a versão mais recente aceita pelos
peers de `eslint-plugin-react`, `eslint-plugin-import` e `eslint-plugin-jsx-a11y`
utilizados na configuração atual. Não force ESLint 10 ignorando esses contratos;
acompanhe uma atualização compatível desses plugins. É uma pendência de
manutenção da ferramenta de desenvolvimento, mesmo com o audit sem alertas.

Um build aprovado ou um `npm audit` sem avisos não comprova segurança completa.
As configurações de Vercel/Supabase, SMTP, autorização e infraestrutura precisam
de validação própria antes de publicar.

## Supabase Auth e Vercel

Configure no dashboard do Supabase (Authentication → URL Configuration):

- **Site URL:** a origem canônica do deploy, por exemplo
  `https://meemu-pqi1.vercel.app` enquanto esse for o domínio usado.
- **Redirect URLs:** permita explicitamente
  `https://meemu-pqi1.vercel.app/editor` e
  `https://meemu-pqi1.vercel.app/reset-password`.
- Para outro domínio, adicione os mesmos caminhos nessa origem. Para
  desenvolvimento, adicione `http://localhost:3000/editor` e
  `http://localhost:3000/reset-password`. Libere previews somente nos domínios
  necessários.

Os redirecionamentos usam a origem da janela atual. Ative e verifique a
confirmação de email, a configuração SMTP, os limites de envio e a política de
senha. Se os templates de confirmação/recuperação foram personalizados, confira
se respeitam o destino (`RedirectTo`/`ConfirmationURL`) e não o substituem por
uma URL fixa incorreta. No Vercel, configure as variáveis públicas em cada
ambiente necessário e execute um novo deploy após alterá-las.

A aplicação usa o fluxo implícito padrão do SDK: o Supabase verifica o link e
redireciona com a sessão no fragmento da URL. O SDK consome e remove esse
fragmento. A tela de redefinição exige o evento `PASSWORD_RECOVERY`; uma sessão
normal não habilita esse formulário. O contexto é mantido em memória: se a
página for recarregada depois que o SDK consumiu o link, solicite um novo email.
O login comum persiste pelo mecanismo do SDK.

## Editor e limites atuais

- O editor exige sessão e reage ao logout. Esse controle de interface não
  substitui autorização no servidor nem políticas RLS para futuras APIs/tabelas.
- Os rascunhos são locais ao navegador e separados por usuário. O rascunho
  anterior, na chave compartilhada `meemu-profile-draft`, é preservado e pode
  ser importado explicitamente pelo usuário. Pressione **Guardar** após importar.
- Upload de avatar: falhas de leitura e armazenamento são informadas. A capacidade
  depende do armazenamento do navegador. Remover o avatar marca alterações pendentes.
- **Ver perfil** abre a prévia na própria página; links válidos de HTTP/HTTPS
  na prévia podem ser abertos em outra aba.
- Não existem publicação de perfil público, sincronização de rascunhos com banco,
  player de música, upload de wallpaper ou arrastar widgets implementados neste
  repositório. As opções e prévias existentes foram preservadas.

Nenhuma tabela, política RLS, chave ou configuração remota é alterada por esses
comandos de desenvolvimento/teste.
