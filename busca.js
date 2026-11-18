(function () {
  const input = document.querySelector('.search-box input');
  if (!input) return;

  const container = input.closest('.header-search-container');
  container.style.position = 'relative';

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
    .busca-tag { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 700;
      color: #fff; background: #E85200; border-radius: 8px; padding: 1px 7px; margin-left: 6px; }
    .busca-info { font-size: 12px; color: #E7E7FA; line-height: 1.3; }
    .busca-vazio { padding: 12px; color: #E7E7FA; font-size: 13px; text-align: center; }
  `;
  document.head.appendChild(css);

  const lista = document.createElement('div');
  lista.className = 'busca-resultados';
  lista.hidden = true;
  container.appendChild(lista);

  const norm = s => String(s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const valido = v => v !== undefined && v !== null && v !== '' &&
                      !String(v).startsWith('Preencha aqui');

  // campos pesquisáveis: [rótulo, valor]
  function campos(item) {
    let c;
    if (item._tipo === 'musica') {
      c = [
        ['Música', item.nome],
        ['Banda', item.banda],
        ['Álbum', item.album],
        ['Ano', item.ano],
        ['Gênero', item.genero],
        ['Descrição', item.descricao]
      ];
    } else {
      c = [
        ['Banda', item.nome],
        ['Gênero', item.genero],
        ['Origem', item.origem],
        ['Formação', item.formacao],
        ['Descrição', item.descricao]
      ];
      (item.albuns || []).forEach(a => c.push(['Álbum', a]));
    }
    return c.filter(([, v]) => valido(v));
  }

  function link(item) {
    return item._tipo === 'musica'
      ? 'resenhas.html?tipo=musica&id=' + encodeURIComponent(item.id)
      : 'resenhas.html?id=' + encodeURIComponent(item.id);
  }

  let itens = [];
  const carregar = (arquivo, tipo) =>
    fetch(arquivo).then(r => r.json())
      .then(d => d.map(x => ({ ...x, _tipo: tipo })))
      .catch(e => { console.error('Erro ao carregar ' + arquivo, e); return []; });

  Promise.all([carregar('bandas.json', 'banda'), carregar('musicas.json', 'musica')])
    .then(([bandas, musicas]) => {
      itens = [...bandas, ...musicas].map(x => ({
        ...x,
        _texto: norm(campos(x).map(([, v]) => v).join(' '))
      }));
    });

  function buscar(q) {
    const termos = norm(q).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];

    return itens
      .filter(x => termos.every(t => x._texto.includes(t)))
      .map(x => {
        const achou = campos(x).find(([, v]) => norm(v).includes(termos[0]));
        const noNome = norm(x.nome).includes(termos[0]);
        return { x, achou, ordem: noNome ? 0 : 1 };
      })
      .sort((a, b) => a.ordem - b.ordem || a.x.nome.localeCompare(b.x.nome))
      .slice(0, 10);
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

    resultados.forEach(({ x, achou }) => {
      const a = document.createElement('a');
      a.className = 'busca-item';
      a.href = link(x);

      const img = document.createElement('img');
      img.src = x.imagem;
      img.alt = x.nome;

      const texto = document.createElement('div');
      const nome = document.createElement('div');
      nome.className = 'busca-nome';
      nome.textContent = x.nome;

      const tag = document.createElement('span');
      tag.className = 'busca-tag';
      tag.textContent = x._tipo === 'musica' ? 'Música' : 'Banda';
      nome.appendChild(tag);

      const info = document.createElement('div');
      info.className = 'busca-info';
      if (x._tipo === 'musica') {
        info.textContent = valido(x.banda) ? x.banda : '';
      } else if (achou && achou[0] !== 'Banda') {
        info.textContent = achou[0] + ': ' + String(achou[1]).slice(0, 60);
      } else {
        info.textContent = valido(x.genero) ? x.genero : '';
      }

      texto.append(nome, info);
      a.append(img, texto);
      lista.appendChild(a);
    });

    lista.hidden = false;
  }

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
    const els = [...lista.querySelectorAll('.busca-item')];
    const atual = lista.querySelector('.busca-item.ativo');
    let i = els.indexOf(atual);

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!els.length) return;
      e.preventDefault();
      if (atual) atual.classList.remove('ativo');
      i = e.key === 'ArrowDown' ? (i + 1) % els.length
                                : (i - 1 + els.length) % els.length;
      els[i].classList.add('ativo');
      els[i].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const alvo = atual || els[0];
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
