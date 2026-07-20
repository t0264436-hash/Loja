# C.G — Cardápio Geral

Site marketplace multi-loja com carrinho, pagamento e finalização via WhatsApp, conectado ao Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar com link (Vercel — grátis)

1. Suba esta pasta inteira pro GitHub (crie um repositório novo e mande TODOS esses arquivos, não só o App.jsx)
2. Entre em https://vercel.com e faça login com sua conta do GitHub
3. Clique em **Add New → Project**
4. Selecione o repositório que você acabou de subir
5. Deixe as configurações no padrão (o Vercel já reconhece projetos Vite automaticamente)
6. Clique em **Deploy**

Em 1 a 2 minutos o Vercel te entrega o link público, tipo `https://cg-site.vercel.app`. Toda vez que você atualizar o código no GitHub, o site atualiza sozinho.

## Publicar com link (Netlify — alternativa)

1. Suba a pasta pro GitHub (mesma coisa acima)
2. Entre em https://netlify.com, **Add new site → Import an existing project**
3. Conecte o GitHub e selecione o repositório
4. Build command: `npm run build` — Publish directory: `dist`
5. Deploy

## Estrutura

- `src/App.jsx` — todo o site (cardápio, carrinho, painel do lojista)
- `src/main.jsx` — ponto de entrada do React
- Credenciais do Supabase já estão dentro do `App.jsx` (URL + chave pública)
