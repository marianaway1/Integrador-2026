// auth.js
function lerDados(chave, padrao = []) {
  try {
    const dados = localStorage.getItem(chave);
    return dados ? JSON.parse(dados) : padrao;
  } catch (e) {
    return padrao;
  }
}

function salvarDados(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

async function hashSenha(senha) {
  const bytes = new TextEncoder().encode(senha);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function usuarioLogado() {
  return lerDados("usuarioLogado", null);
}

function sair() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

// Use no topo de páginas que exigem login
function exigirLogin() {
  if (!usuarioLogado()) window.location.href = "login.html";
}

function paginaInicial(perfil) {
  if (perfil === "gestor") return "Gestor.html";
  if (perfil === "administrador") return "Admnistrador.html";
  return "index.html";
}