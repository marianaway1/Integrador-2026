(function () {
  const input = document.querySelector('.search-box input');
  if (!input) return;

  const container = input.closest('.header-search-container');
  container.style.position = 'relative';

  // ---------- estilo da lista ----------
  const css = document.createElement('style');
  css.textContent = `
    .busca-resultados {
      position: absolute; top: calc(100% + 8px); left: 0; right: 0;
      background: #0F0F80; border: 1.5px solid #26BD8A; border-radius: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,.5); max-height: 380px; overflow-y: auto;
      z-index: 200; padding: 6px;
    }
    .busca-resultados[hidden] { display: none; }
    .busca-item {
      display: flex; align-items: center; gap: 12px; padding: 8px 10px;
      border-radius: 10px; text-decoration: none; color: #fff;
    }
    .busca-item:hover, .busca-item.ativo { background: rgba(38,189,138,.25); }
    .busca-item img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .busca-nome { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 14px; color: #26BD8A; }
    .busca-info { font-size: 12px; color: #E7E7FA; line-height: 1.3; }
    .busca-vazio { padding: 12px; color: #E7E7FA; font-size: 13px; text-align: center; }
  `;
  document.head.appendChild(css);

  const lista = document.createElement('div');
  lista.className = 'busca-resultados';
  lista.hidden = true;
  container.appendChild(lista);

  // ---------- dados ----------
  const norm = s => String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const valido = v => v !== undefined && v !== null && v !== '' &&
                      !String(v).startsWith('Preencha aqui');

  // campos pesquisáveis de uma banda: [rótulo, valor]
  function campos(b) {
    const c = [
      ['Banda', b.nome],
      ['Gênero', b.genero],
      ['Origem', b.origem],
      ['Formação', b.formacao],
      ['Descrição', b.descricao]
    ];
    (b.albuns || []).forEach(a => c.push(['Álbum', a]));
    return c.filter(([, v]) => valido(v));
  }

  let bandas = [];
  fetch('bandas.json')
    .then(r => r.json())
    .then(dados => {
      bandas = dados.map(b => ({
        ...b,
        _texto: norm(campos(b).map(([, v]) => v).join(' '))
      }));
    })
    .catch(e => console.error('Erro ao carregar bandas.json', e));

  // ---------- busca ----------
  function buscar(q) {
    const termos = norm(q).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];

    return bandas
      .filter(b => termos.every(t => b._texto.includes(t)))
      .map(b => {
        // descobre em qual campo achou, para mostrar embaixo do nome
        const achou = campos(b).find(([, v]) => norm(v).includes(termos[0]));
        const noNome = norm(b.nome).includes(termos[0]);
        return { b, achou, ordem: noNome ? 0 : 1 };
      })
      .sort((x, y) => x.ordem - y.ordem || x.b.nome.localeCompare(y.b.nome))
      .slice(0, 8);
  }

  function mostrar(resultados) {
    lista.innerHTML = '';

    if (!resultados.length) {
      const vazio = document.createElement('div');
      vazio.className = 'busca-vazio';
      vazio.textContent = 'Nenhum resultado encontrado';
      lista.appendChild(vazio);
      lista.hidden = false;
      return;
    }

    resultados.forEach(({ b, achou }) => {
      const a = document.createElement('a');
      a.className = 'busca-item';
      a.href = 'resenhas.html?id=' + encodeURIComponent(b.id);

      const img = document.createElement('img');
      img.src = b.imagem;
      img.alt = b.nome;

      const texto = document.createElement('div');
      const nome = document.createElement('div');
      nome.className = 'busca-nome';
      nome.textContent = b.nome;

      const info = document.createElement('div');
      info.className = 'busca-info';
      // mostra o campo que bateu (ex.: "Gênero: Rock nacional")
      info.textContent = achou && achou[0] !== 'Banda'
        ? achou[0] + ': ' + String(achou[1]).slice(0, 60)
        : b.genero && valido(b.genero) ? b.genero : '';

      texto.append(nome, info);
      a.append(img, texto);
      lista.appendChild(a);
    });

    lista.hidden = false;
  }

  // ---------- eventos ----------
  input.setAttribute('autocomplete', 'off');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { lista.hidden = true; return; }
    mostrar(buscar(q));
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) mostrar(buscar(input.value));
  });

  input.addEventListener('keydown', e => {
    const itens = [...lista.querySelectorAll('.busca-item')];
    const atual = lista.querySelector('.busca-item.ativo');
    let i = itens.indexOf(atual);

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!itens.length) return;
      e.preventDefault();
      if (atual) atual.classList.remove('ativo');
      i = e.key === 'ArrowDown' ? (i + 1) % itens.length
                                : (i - 1 + itens.length) % itens.length;
      itens[i].classList.add('ativo');
      itens[i].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const alvo = atual || itens[0];
      if (alvo) location.href = alvo.href;
    } else if (e.key === 'Escape') {
      lista.hidden = true;
      input.blur();
    }
  });

  document.addEventListener('click', e => {
    if (!container.contains(e.target)) lista.hidden = true;
  });
})();
