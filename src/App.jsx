import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, Minus, X, Store, User, LogOut, Camera, Trash2, Pencil, ArrowLeft, Share2, Check } from "lucide-react";

const SUPABASE_URL = "https://lsxlrxvjctpygyjapfmo.supabase.co";
const ANON_KEY = "sb_publishable_GeVYkrxkE8KMidJkxed9gA_IS568A7U";

const COLORS = {
  bg: "#171310",
  panel: "#231D18",
  panel2: "#2B241E",
  mustard: "#E8B330",
  chili: "#D9432C",
  green: "#4C8C5A",
  cream: "#F3ECDD",
  fade: "#8A8072",
};

function cls(...a) { return a.filter(Boolean).join(" "); }

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "loja";
}

function brl(n) {
  return (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function sb(path, { method = "GET", body, token, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Prefer: "return=representation" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "Erro na operação";
    try { const j = await res.json(); msg = j.msg || j.message || j.error_description || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function uploadFoto(file, token) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${slugify(file.name)}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${path}`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Falha ao enviar imagem");
  return `${SUPABASE_URL}/storage/v1/object/public/fotos/${path}`;
}

function Logo({ size = 44 }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, ${COLORS.chili}, #a82c1c)`,
        border: `2px solid ${COLORS.mustard}`,
        boxShadow: "0 3px 0 rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.4)",
        transform: "rotate(-6deg)",
      }}
    >
      <span style={{ fontFamily: "'Anton', sans-serif", fontSize: size * 0.42, color: COLORS.cream, letterSpacing: -1, lineHeight: 1 }}>C.G</span>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={COLORS.mustard} strokeWidth="1" strokeDasharray="2 3" />
      </svg>
    </div>
  );
}

function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }) {
  const styles = {
    primary: { background: COLORS.chili, color: "#fff", boxShadow: "0 3px 0 #9c2c1c" },
    mustard: { background: COLORS.mustard, color: "#221a0e", boxShadow: "0 3px 0 #a97e1e" },
    ghost: { background: "transparent", color: COLORS.cream, border: `1px solid ${COLORS.fade}` },
    dark: { background: COLORS.panel2, color: COLORS.cream, boxShadow: "0 2px 0 #16110d" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls("px-4 py-2.5 rounded-lg font-bold text-sm transition active:scale-95 active:translate-y-0.5 disabled:opacity-50 disabled:active:scale-100 disabled:active:translate-y-0", className)}
      style={{ ...styles[variant], boxShadow: disabled ? "none" : styles[variant].boxShadow }}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={cls("w-full px-3 py-2.5 rounded-lg outline-none text-sm", props.className)}
      style={{ background: COLORS.panel2, color: COLORS.cream, border: `1px solid #3a322a` }}
    />
  );
}

export default function App() {
  const [view, setView] = useState({ name: "home" });
  const [lojas, setLojas] = useState([]);
  const [loadingLojas, setLoadingLojas] = useState(true);
  const [user, setUser] = useState(null); // {id, email, access_token}
  const [cart, setCart] = useState({}); // { lojaId: { loja, items: {produtoId: {produto, qty}} } }
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const loadLojas = useCallback(async () => {
    setLoadingLojas(true);
    try {
      const data = await sb("/rest/v1/lojas?select=*&order=created_at.desc");
      setLojas(data || []);
    } catch (e) { showToast(e.message); }
    setLoadingLojas(false);
  }, []);

  useEffect(() => { loadLojas(); }, [loadLojas]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("loja");
    if (slug) setView({ name: "store", slug });
  }, []);

  const cartLojaIds = Object.keys(cart);
  const cartCount = cartLojaIds.reduce((sum, lid) => sum + Object.values(cart[lid].items).reduce((s, it) => s + it.qty, 0), 0);

  function addToCart(loja, produto) {
    setCart((prev) => {
      const existing = prev[loja.id] || { loja, items: {} };
      const item = existing.items[produto.id] || { produto, qty: 0 };
      return { ...prev, [loja.id]: { loja, items: { ...existing.items, [produto.id]: { produto, qty: item.qty + 1 } } } };
    });
  }
  function changeQty(lojaId, produtoId, delta) {
    setCart((prev) => {
      const loja = prev[lojaId];
      if (!loja) return prev;
      const item = loja.items[produtoId];
      const newQty = item.qty + delta;
      const newItems = { ...loja.items };
      if (newQty <= 0) delete newItems[produtoId];
      else newItems[produtoId] = { ...item, qty: newQty };
      if (Object.keys(newItems).length === 0) {
        const rest = { ...prev }; delete rest[lojaId]; return rest;
      }
      return { ...prev, [lojaId]: { ...loja, items: newItems } };
    });
  }

  function goHome() {
    window.history.replaceState({}, "", window.location.pathname);
    setView({ name: "home" });
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.cream, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes slideUp { from { transform: translateY(16px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes toastIn { from { transform: translateY(-12px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        .cg-display { font-family: 'Anton', sans-serif; }
        .cg-stripes {
          background-image: repeating-linear-gradient(-45deg, ${COLORS.mustard} 0px, ${COLORS.mustard} 10px, transparent 10px, transparent 20px);
        }
        .cg-card { transition: transform .15s ease, box-shadow .15s ease; box-shadow: 0 2px 0 rgba(0,0,0,0.3); }
        .cg-card:active { transform: translateY(2px) scale(0.98); box-shadow: 0 0 0 rgba(0,0,0,0.3); }
      `}</style>

      <div className="h-1.5 cg-stripes" style={{ opacity: 0.9 }} />
      <header className="sticky top-0 z-30 backdrop-blur border-b" style={{ background: "rgba(23,19,16,0.95)", borderColor: "#332b23" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-2.5 active:scale-95 transition">
            <Logo />
            <span className="cg-display text-lg hidden sm:inline" style={{ color: COLORS.cream, letterSpacing: 0.5 }}>CARDÁPIO GERAL</span>
          </button>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="dark" onClick={() => setView({ name: "dashboard" })}><span className="flex items-center gap-1.5"><Store size={15}/> Painel</span></Button>
                <Button variant="ghost" onClick={() => { setUser(null); goHome(); }}><LogOut size={15}/></Button>
              </>
            ) : (
              <Button variant="dark" onClick={() => setView({ name: "auth" })}><span className="flex items-center gap-1.5"><User size={15}/> Sou lojista</span></Button>
            )}
            <button onClick={() => setCartOpen(true)} className="relative p-2.5 rounded-lg active:scale-95 transition" style={{ background: COLORS.panel2, boxShadow: "0 2px 0 rgba(0,0,0,0.3)" }}>
              <ShoppingCart size={18} color={COLORS.cream} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ background: COLORS.chili, color: "#fff", border: `2px solid ${COLORS.bg}` }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view.name === "home" && <Home lojas={lojas} loading={loadingLojas} onOpenLoja={(l) => setView({ name: "store", slug: l.slug })} />}
        {view.name === "store" && (
          <StoreView
            slug={view.slug}
            lojas={lojas}
            loadingLojas={loadingLojas}
            onAdd={addToCart}
            onBack={goHome}
            showToast={showToast}
          />
        )}
        {view.name === "auth" && <AuthView onLoggedIn={(u) => { setUser(u); setView({ name: "dashboard" }); }} showToast={showToast} />}
        {view.name === "dashboard" && user && (
          <Dashboard user={user} showToast={showToast} onLojasChanged={loadLojas} />
        )}
      </main>

      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onChangeQty={changeQty}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg" style={{ background: COLORS.panel2, color: COLORS.cream, animation: "toastIn .2s ease-out", border: `1px solid #3a322a` }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function Home({ lojas, loading, onOpenLoja }) {
  const [q, setQ] = useState("");
  const filtered = lojas.filter((l) => l.nome_loja.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl mb-6 px-5 py-8 sm:py-10"
        style={{
          background: `linear-gradient(160deg, #241a12, ${COLORS.bg} 60%)`,
          border: "1px solid #332b23",
        }}
      >
        <div className="cg-stripes absolute top-0 left-0 right-0 h-2" style={{ opacity: 0.85 }} />
        <div className="relative flex items-center gap-4">
          <div className="hidden xs:block"><Logo size={64} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: COLORS.mustard }}>Bem-vindo ao</p>
            <h1 className="cg-display text-4xl sm:text-5xl leading-none mb-2" style={{ color: COLORS.cream }}>CARDÁPIO&nbsp;GERAL</h1>
            <p style={{ color: COLORS.fade }} className="text-sm max-w-sm">Escolha a loja, monte o pedido e finalize direto no WhatsApp de quem vende. Sem enrolação.</p>
          </div>
        </div>
      </div>

      <Input placeholder="Buscar loja..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-5" />
      {loading && <p style={{ color: COLORS.fade }}>Carregando lojas...</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: COLORS.fade }}>
          <Store size={32} className="mx-auto mb-2" />
          <p>Nenhuma loja por aqui ainda. Seja o primeiro a cadastrar a sua!</p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((l) => (
          <button
            key={l.id}
            onClick={() => onOpenLoja(l)}
            className="cg-card text-left rounded-xl overflow-hidden"
            style={{ background: COLORS.panel, border: `1px solid #3a322a`, borderBottom: `3px solid ${COLORS.mustard}` }}
          >
            <div className="aspect-square w-full relative" style={{ background: COLORS.panel2 }}>
              {l.foto_perfil ? (
                <img src={l.foto_perfil} alt={l.nome_loja} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Store size={28} color={COLORS.fade} /></div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }} />
            </div>
            <div className="p-2.5">
              <p className="font-bold text-sm truncate">{l.nome_loja}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: COLORS.mustard }}>Ver cardápio →</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoreView({ slug, lojas, loadingLojas, onAdd, onBack, showToast }) {
  const loja = lojas.find((l) => l.slug === slug);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loja) return;
    (async () => {
      setLoading(true);
      try {
        const data = await sb(`/rest/v1/produtos?select=*&loja_id=eq.${loja.id}&order=categoria.asc`);
        setProdutos(data || []);
      } catch (e) { showToast(e.message); }
      setLoading(false);
    })();
  }, [loja]);

  if (loadingLojas) return <p style={{ color: COLORS.fade }}>Carregando...</p>;
  if (!loja) return (
    <div className="text-center py-16" style={{ color: COLORS.fade }}>
      <p className="mb-3">Loja não encontrada.</p>
      <Button variant="dark" onClick={onBack}>Voltar ao cardápio geral</Button>
    </div>
  );

  const groups = produtos.reduce((acc, p) => {
    const cat = p.categoria || "Outros";
    acc[cat] = acc[cat] || [];
    acc[cat].push(p);
    return acc;
  }, {});

  function shareLink() {
    const url = `${window.location.origin}${window.location.pathname}?loja=${loja.slug}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4 active:scale-95 transition" style={{ color: COLORS.fade }}>
        <ArrowLeft size={16} /> Cardápio geral
      </button>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ background: COLORS.panel2 }}>
          {loja.foto_perfil ? <img src={loja.foto_perfil} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store size={22} color={COLORS.fade} /></div>}
        </div>
        <div className="flex-1">
          <h1 className="cg-display text-3xl leading-none" style={{ color: COLORS.cream }}>{loja.nome_loja}</h1>
        </div>
        <button onClick={shareLink} className="p-2.5 rounded-lg active:scale-95 transition" style={{ background: COLORS.panel2 }} title="Copiar link do cardápio">
          {copied ? <Check size={17} color={COLORS.green} /> : <Share2 size={17} />}
        </button>
      </div>

      {loading && <p style={{ color: COLORS.fade }}>Carregando cardápio...</p>}
      {!loading && produtos.length === 0 && <p style={{ color: COLORS.fade }} className="text-center py-10">Essa loja ainda não cadastrou produtos.</p>}

      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat} className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="cg-display text-base" style={{ color: COLORS.mustard, letterSpacing: 0.5 }}>{cat.toUpperCase()}</span>
            <div className="flex-1 h-px" style={{ background: "#3a322a" }} />
          </div>
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="cg-card flex items-center gap-3 p-2.5 rounded-xl" style={{ background: COLORS.panel, border: "1px solid #3a322a" }}>
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: COLORS.panel2 }}>
                  {p.foto ? <img src={p.foto} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.nome}</p>
                  {p.descricao && <p className="text-xs truncate" style={{ color: COLORS.fade }}>{p.descricao}</p>}
                  <span className="inline-block text-xs font-black mt-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(232,179,48,0.15)", color: COLORS.mustard }}>{brl(p.valor)}</span>
                </div>
                <button onClick={() => { onAdd(loja, p); showToast(`${p.nome} adicionado`); }} className="p-2.5 rounded-lg active:scale-90 transition shrink-0" style={{ background: COLORS.chili, boxShadow: "0 2px 0 #9c2c1c" }}>
                  <Plus size={16} color="#fff" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CartDrawer({ cart, onClose, onChangeQty, showToast }) {
  const lojaIds = Object.keys(cart);
  const [checkoutLoja, setCheckoutLoja] = useState(null);

  if (checkoutLoja && cart[checkoutLoja]) {
    return <Checkout entry={cart[checkoutLoja]} onClose={onClose} onBack={() => setCheckoutLoja(null)} />;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div className="relative w-full max-w-sm h-full overflow-y-auto p-4" style={{ background: COLORS.bg, animation: "slideUp .2s ease-out", borderLeft: `1px solid #332b23` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="cg-display text-2xl">Seu carrinho</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: COLORS.panel2 }}><X size={18} /></button>
        </div>
        {lojaIds.length === 0 && <p style={{ color: COLORS.fade }} className="text-center py-10">Carrinho vazio. Escolha uma loja no cardápio!</p>}
        <div className="space-y-4">
          {lojaIds.map((lid) => {
            const entry = cart[lid];
            const items = Object.values(entry.items);
            const total = items.reduce((s, it) => s + it.qty * Number(it.produto.valor), 0);
            return (
              <div key={lid} className="rounded-xl p-3" style={{ background: COLORS.panel, border: "1px solid #332b23" }}>
                <p className="font-bold text-sm mb-2" style={{ color: COLORS.mustard }}>{entry.loja.nome_loja}</p>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.produto.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{it.produto.nome}</span>
                      <button onClick={() => onChangeQty(lid, it.produto.id, -1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: COLORS.panel2 }}><Minus size={12} /></button>
                      <span className="w-5 text-center">{it.qty}</span>
                      <button onClick={() => onChangeQty(lid, it.produto.id, 1)} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: COLORS.panel2 }}><Plus size={12} /></button>
                      <span className="w-16 text-right font-semibold">{brl(it.qty * it.produto.valor)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #3a322a" }}>
                  <span className="font-bold">{brl(total)}</span>
                  <Button variant="primary" onClick={() => setCheckoutLoja(lid)}>Finalizar pedido</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Checkout({ entry, onClose, onBack }) {
  const [pagamento, setPagamento] = useState("Pix");
  const [trocoPara, setTrocoPara] = useState("");
  const items = Object.values(entry.items);
  const total = items.reduce((s, it) => s + it.qty * Number(it.produto.valor), 0);
  const trocoValido = pagamento === "Dinheiro" ? Number(trocoPara) >= total && trocoPara !== "" : true;

  function enviarWhatsapp() {
    let phone = (entry.loja.whatsapp || "").replace(/\D/g, "");
    if (phone.length <= 11) phone = "55" + phone;
    let msg = `Olá! Vim pelo *C.G* e quero fazer um pedido na *${entry.loja.nome_loja}*:\n\n`;
    items.forEach((it) => { msg += `• ${it.qty}x ${it.produto.nome} - ${brl(it.qty * it.produto.valor)}\n`; });
    msg += `\n*Total: ${brl(total)}*\n`;
    msg += `Forma de pagamento: *${pagamento}*\n`;
    if (pagamento === "Dinheiro") {
      const troco = Number(trocoPara) - total;
      msg += `Vou pagar com: ${brl(Number(trocoPara))}\n`;
      msg += `Troco: ${brl(troco)}\n`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div className="relative w-full max-w-sm h-full overflow-y-auto p-4" style={{ background: COLORS.bg, animation: "slideUp .2s ease-out" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: COLORS.fade }}><ArrowLeft size={15} /> Voltar</button>
        <h2 className="cg-display text-2xl mb-1">Finalizar pedido</h2>
        <p className="text-sm mb-4" style={{ color: COLORS.fade }}>{entry.loja.nome_loja} · {brl(total)}</p>

        <p className="text-sm font-bold mb-2">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {["Pix", "Cartão", "Dinheiro"].map((op) => (
            <button key={op} onClick={() => setPagamento(op)} className="py-2.5 rounded-lg text-sm font-semibold transition" style={{ background: pagamento === op ? COLORS.mustard : COLORS.panel2, color: pagamento === op ? "#221a0e" : COLORS.cream }}>
              {op}
            </button>
          ))}
        </div>

        {pagamento === "Dinheiro" && (
          <div className="mb-4">
            <label className="text-sm font-bold mb-1.5 block">Vai pagar com quanto?</label>
            <Input type="number" placeholder="Ex: 50" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value)} />
            {trocoPara !== "" && Number(trocoPara) >= total && (
              <p className="text-sm mt-1.5" style={{ color: COLORS.green }}>Troco: {brl(Number(trocoPara) - total)}</p>
            )}
            {trocoPara !== "" && Number(trocoPara) < total && (
              <p className="text-sm mt-1.5" style={{ color: COLORS.chili }}>Valor menor que o total do pedido.</p>
            )}
          </div>
        )}

        <Button variant="primary" className="w-full py-3" disabled={!trocoValido} onClick={enviarWhatsapp}>
          Enviar pedido no WhatsApp
        </Button>
      </div>
    </div>
  );
}

function AuthView({ onLoggedIn, showToast }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "cadastro") {
        const data = await sb("/auth/v1/signup", { method: "POST", body: { email, password: senha, data: { nome } } });
        if (data.access_token) {
          onLoggedIn({ id: data.user.id, email: data.user.email, access_token: data.access_token });
          showToast("Conta criada!");
        } else {
          showToast("Conta criada! Verifique seu e-mail para confirmar e depois faça login.");
          setMode("login");
        }
      } else {
        const data = await sb("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password: senha } });
        onLoggedIn({ id: data.user.id, email: data.user.email, access_token: data.access_token });
        showToast(`Bem-vindo(a) de volta!`);
      }
    } catch (e) { showToast(e.message); }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto py-6">
      <h1 className="cg-display text-3xl mb-1">{mode === "login" ? "Entrar" : "Criar conta de lojista"}</h1>
      <p className="text-sm mb-5" style={{ color: COLORS.fade }}>Área exclusiva de quem vai vender no C.G.</p>
      <form onSubmit={submit} className="space-y-3">
        {mode === "cadastro" && <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />}
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha (mín. 6 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
        <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <button onClick={() => setMode(mode === "login" ? "cadastro" : "login")} className="text-sm mt-4 block mx-auto" style={{ color: COLORS.mustard }}>
        {mode === "login" ? "Ainda não tem loja? Criar conta" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}

function Dashboard({ user, showToast, onLojasChanged }) {
  const [minhasLojas, setMinhasLojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [criando, setCriando] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sb(`/rest/v1/lojas?select=*&lojista_id=eq.${user.id}&order=created_at.desc`, { token: user.access_token });
      setMinhasLojas(data || []);
    } catch (e) { showToast(e.message); }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (selecionada) {
    return <ProdutosManager loja={selecionada} user={user} showToast={showToast} onBack={() => { setSelecionada(null); load(); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="cg-display text-3xl">Minhas lojas</h1>
        <Button variant="mustard" onClick={() => setCriando(true)}><span className="flex items-center gap-1.5"><Plus size={16} /> Nova loja</span></Button>
      </div>

      {criando && <LojaForm user={user} showToast={showToast} onDone={() => { setCriando(false); load(); onLojasChanged(); }} onCancel={() => setCriando(false)} />}

      {loading && <p style={{ color: COLORS.fade }}>Carregando...</p>}
      {!loading && minhasLojas.length === 0 && !criando && (
        <p style={{ color: COLORS.fade }} className="text-center py-10">Você ainda não tem nenhuma loja. Crie a primeira!</p>
      )}

      <div className="space-y-2">
        {minhasLojas.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: COLORS.panel, border: "1px solid #332b23" }}>
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: COLORS.panel2 }}>
              {l.foto_perfil ? <img src={l.foto_perfil} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Store size={18} color={COLORS.fade} /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{l.nome_loja}</p>
              <p className="text-xs truncate" style={{ color: COLORS.fade }}>c-g.app/?loja={l.slug}</p>
            </div>
            <Button variant="dark" onClick={() => setSelecionada(l)}>Produtos</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LojaForm({ user, showToast, onDone, onCancel, initial }) {
  const [nome, setNome] = useState(initial?.nome_loja || "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || "");
  const [foto, setFoto] = useState(initial?.foto_perfil || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { setFoto(await uploadFoto(file, user.access_token)); }
    catch (err) { showToast(err.message); }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        await sb(`/rest/v1/lojas?id=eq.${initial.id}`, { method: "PATCH", token: user.access_token, body: { nome_loja: nome, whatsapp, foto_perfil: foto } });
      } else {
        await sb("/rest/v1/lojas", { method: "POST", token: user.access_token, body: { lojista_id: user.id, nome_loja: nome, whatsapp, foto_perfil: foto, slug: `${slugify(nome)}-${Math.random().toString(36).slice(2, 6)}` } });
      }
      showToast("Loja salva!");
      onDone();
    } catch (err) { showToast(err.message); }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="p-4 rounded-xl mb-4 space-y-3" style={{ background: COLORS.panel, border: "1px solid #332b23" }}>
      <div className="flex items-center gap-3">
        <label className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center cursor-pointer" style={{ background: COLORS.panel2 }}>
          {foto ? <img src={foto} className="w-full h-full object-cover" /> : <Camera size={20} color={COLORS.fade} />}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <p className="text-xs" style={{ color: COLORS.fade }}>{uploading ? "Enviando foto..." : "Toque para escolher a foto de perfil da loja"}</p>
      </div>
      <Input placeholder="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <Input placeholder="WhatsApp com DDD (ex: 11999998888)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
      <div className="flex gap-2">
        <Button type="submit" variant="mustard" disabled={saving || uploading}>{saving ? "Salvando..." : "Salvar loja"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}

function ProdutosManager({ loja, user, showToast, onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null | {} | produto
  const [editandoLoja, setEditandoLoja] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sb(`/rest/v1/produtos?select=*&loja_id=eq.${loja.id}&order=created_at.desc`, { token: user.access_token });
      setProdutos(data || []);
    } catch (e) { showToast(e.message); }
    setLoading(false);
  }, [loja]);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    try {
      await sb(`/rest/v1/produtos?id=eq.${id}`, { method: "DELETE", token: user.access_token });
      showToast("Produto removido");
      load();
    } catch (e) { showToast(e.message); }
  }

  if (editandoLoja) return <LojaForm user={user} showToast={showToast} initial={loja} onCancel={() => setEditandoLoja(false)} onDone={() => setEditandoLoja(false)} />;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-4" style={{ color: COLORS.fade }}><ArrowLeft size={15} /> Minhas lojas</button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="cg-display text-2xl">{loja.nome_loja}</h1>
        <button onClick={() => setEditandoLoja(true)} className="p-2 rounded-lg" style={{ background: COLORS.panel2 }}><Pencil size={15} /></button>
      </div>
      <p className="text-xs mb-4" style={{ color: COLORS.fade }}>Link do cardápio: c-g.app/?loja={loja.slug}</p>

      <Button variant="mustard" onClick={() => setForm({})} className="mb-4"><span className="flex items-center gap-1.5"><Plus size={16} /> Novo produto</span></Button>

      {form !== null && (
        <ProdutoForm loja={loja} user={user} showToast={showToast} initial={form.id ? form : null} onDone={() => { setForm(null); load(); }} onCancel={() => setForm(null)} />
      )}

      {loading && <p style={{ color: COLORS.fade }}>Carregando...</p>}
      <div className="space-y-2 mt-2">
        {produtos.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: COLORS.panel, border: "1px solid #332b23" }}>
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: COLORS.panel2 }}>
              {p.foto && <img src={p.foto} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{p.nome}</p>
              <p className="text-xs" style={{ color: COLORS.mustard }}>{brl(p.valor)} {p.categoria ? `· ${p.categoria}` : ""}</p>
            </div>
            <button onClick={() => setForm(p)} className="p-2 rounded-lg" style={{ background: COLORS.panel2 }}><Pencil size={14} /></button>
            <button onClick={() => remove(p.id)} className="p-2 rounded-lg" style={{ background: COLORS.panel2 }}><Trash2 size={14} color={COLORS.chili} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProdutoForm({ loja, user, showToast, initial, onDone, onCancel }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [descricao, setDescricao] = useState(initial?.descricao || "");
  const [valor, setValor] = useState(initial?.valor || "");
  const [categoria, setCategoria] = useState(initial?.categoria || "");
  const [foto, setFoto] = useState(initial?.foto || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { setFoto(await uploadFoto(file, user.access_token)); }
    catch (err) { showToast(err.message); }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { nome, descricao, valor: Number(valor), categoria, foto, loja_id: loja.id };
      if (initial) await sb(`/rest/v1/produtos?id=eq.${initial.id}`, { method: "PATCH", token: user.access_token, body });
      else await sb("/rest/v1/produtos", { method: "POST", token: user.access_token, body });
      showToast("Produto salvo!");
      onDone();
    } catch (err) { showToast(err.message); }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="p-4 rounded-xl mb-4 space-y-3" style={{ background: COLORS.panel, border: "1px solid #332b23" }}>
      <div className="flex items-center gap-3">
        <label className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center cursor-pointer" style={{ background: COLORS.panel2 }}>
          {foto ? <img src={foto} className="w-full h-full object-cover" /> : <Camera size={20} color={COLORS.fade} />}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <p className="text-xs" style={{ color: COLORS.fade }}>{uploading ? "Enviando foto..." : "Foto do produto"}</p>
      </div>
      <Input placeholder="Nome do produto" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <div className="flex gap-2">
        <Input type="number" step="0.01" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} required />
        <Input placeholder="Categoria (ex: Lanches)" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="mustard" disabled={saving || uploading}>{saving ? "Salvando..." : "Salvar produto"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
