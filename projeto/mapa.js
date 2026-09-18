document.addEventListener('DOMContentLoaded', () => { 
    const listaEmpreendedoresEl = document.getElementById('listaEmpreendedores'); 
    let mapaInstancia = null; 

    const empreendedores = [ 
        {
            nome: "Corte & Estilo - Barbearia", 
            categoria: "Beleza", 
            bairro: "Capão Redondo", 
            logo: "https://images.pexels.com/photos/4952618/pexels-photo-4952618.jpeg", 
            lat: -23.6581, 
            lng: -46.7744, 
            linkWhats: "https://wa.me/5511999999999" 
        },
        {
            nome: "Mercadinho do Zé",
            categoria: "Mercado",
            bairro: "Capão Redondo",
            logo: "https://images.pexels.com/photos/19138180/pexels-photo-19138180.jpeg",
            lat: -23.6581, 
            lng: -46.7744,
            linkWhats: "https://wa.me/5511977777777"
        },
        {
            nome: "CT-ad Tatuagem",
            categoria: "Estúdio",
            bairro: "São Miguel Paulista",
            logo: "https://images.pexels.com/photos/12038948/pexels-photo-12038948.jpeg",
            lat: -23.4941, 
            lng: -46.4213,
            linkWhats: "https://wa.me/5511977777777"
        },
        {
            nome: "Sabor da Quebrada - Doces",
            categoria: "Alimentação",
            bairro: "Campo Limpo",
            logo: "https://images.pexels.com/photos/31267002/pexels-photo-31267002.jpeg",
            lat: -23.6489, 
            lng: -46.7582,
            linkWhats: "https://wa.me/5511988888888"
        },
        {
            nome: "EletroFix - Manutenção",
            categoria: "Serviços",
            bairro: "Jardim Ângela",
            logo: "https://images.pexels.com/photos/1597776/pexels-photo-1597776.jpeg",
            lat: -23.6750, 
            lng: -46.7800,
            linkWhats: "https://wa.me/5511977777777"
        }
    ];

    function renderizarListaLateral() { 
    if (!listaEmpreendedoresEl) return; 
    listaEmpreendedoresEl.innerHTML = ''; 

    empreendedores.forEach(emp => { 
        const card = document.createElement('div'); 
        card.className = 'card-empreendedor'; 

        const badgeDistancia = emp.distanciaKm 
            ? `<span class="badge-distancia">📏 a ${emp.distanciaKm} km</span>` 
            : '';

        card.innerHTML = `
            <div class="card-header-estab">
                <img src="${emp.logo}" class="logo-estab-img" alt="Logo ${emp.nome}" onerror="this.src='https://via.placeholder.com/40';">
                <div class="estab-info-titulo">
                    <h5>${emp.nome}</h5>
                    ${badgeDistancia}
                </div>
            </div>
            <p>📍 ${emp.bairro} • <i>${emp.categoria}</i></p>
            <a href="${emp.linkWhats}" target="_blank" class="btn-whats" onclick="event.stopPropagation();">Chamar no WhatsApp</a>
        `; 

        card.addEventListener('click', () => { 
            if (mapaInstancia) {
                mapaInstancia.setView([emp.lat, emp.lng], 15); 
            }
        });

        listaEmpreendedoresEl.appendChild(card); 
    });
}

    function inicializarMapa() { 
        const mapaDiv = document.getElementById('mapa');
        if (!mapaDiv) return;

        mapaInstancia = L.map('mapa').setView([-23.65, -46.75], 13); 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
        }).addTo(mapaInstancia); 

        const gruposPorBairro = {}; 

        empreendedores.forEach(emp => { 
            if (!gruposPorBairro[emp.bairro]) { 
                gruposPorBairro[emp.bairro] = { 
                    bairro: emp.bairro, 
                    lat: emp.lat, 
                    lng: emp.lng, 
                    lista: [] 
                };
            }
            gruposPorBairro[emp.bairro].lista.push(emp); 
        });

        Object.values(gruposPorBairro).forEach(grupo => { 
            const qtd = grupo.lista.length; 

            const circuloBairro = L.circle([grupo.lat, grupo.lng], { 
                color: '#e53935', 
                fillColor: '#ef5350',
                fillOpacity: 0.35, 
                weight: 2, 
                radius: 450 
            }).addTo(mapaInstancia); 

            let htmlConteudo = `
                <div style="text-align:center; font-family: 'Poppins', sans-serif; padding: 4px; max-height: 250px; overflow-y: auto;">
                    <h4 style="margin:0 0 2px 0; color:#1a1a1a; font-size:14px; font-weight:600;">📍 ${grupo.bairro}</h4>
                    <span style="display:inline-block; background:#e53935; color:#fff; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px; margin-bottom:10px;">
                        ${qtd} ${qtd === 1 ? 'Empreendedor nesta região' : 'Empreendedores nesta região'}
                    </span>
                    <hr style="border:0; border-top:1px solid #eee; margin:6px 0 10px 0;">
            `; 

            grupo.lista.forEach((item, index) => { 
                htmlConteudo += `
                    <div style="text-align:left; margin-bottom: 10px; padding-bottom: 8px; ${index < qtd - 1 ? 'border-bottom: 1px dashed #ddd;' : ''}">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <img src="${item.logo}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1px solid #ccc;">
                            <strong style="color:#111; font-size:13px;">${item.nome}</strong>
                        </div>
                        <small style="color:#666;">Categoria: ${item.categoria}</small><br>
                        <a href="${item.linkWhats}" target="_blank" style="display:inline-block; margin-top:4px; background:#25D366; color:#fff; padding:4px 10px; text-decoration:none; border-radius:4px; font-size:11px; font-weight:bold;">Chamar no WhatsApp</a>
                    </div>
                `; 
            });

            htmlConteudo += `</div>`; 
            circuloBairro.bindPopup(htmlConteudo); 
        });

        if ("geolocation" in navigator) { 
            navigator.geolocation.getCurrentPosition( 
                (pos) => { 
                    const lat = pos.coords.latitude; 
                    const lng = pos.coords.longitude;

                    mapaInstancia.setView([lat, lng], 14); 

                    L.marker([lat, lng]).addTo(mapaInstancia) 
                        .bindPopup("📍 <b>Você está aqui!</b>") 
                        .openPopup(); 

                    L.circle([lat, lng], { 
                        color: '#1e88e5', 
                        fillColor: '#2196f3', 
                        fillOpacity: 0.2, 
                        radius: 100 
                    }).addTo(mapaInstancia); 

                    const pontoUsuario = L.latLng(lat, lng); 
                    empreendedores.forEach(emp => { 
                        const pontoLoja = L.latLng(emp.lat, emp.lng); 
                        emp.distanciaKm = (pontoUsuario.distanceTo(pontoLoja) / 1000).toFixed(1); 
                    });
                    empreendedores.sort((a, b) => parseFloat(a.distanciaKm) - parseFloat(b.distanciaKm));
                    renderizarListaLateral();
                },
                (err) => console.warn("Geolocalização indisponível:", err.message), 
                { enableHighAccuracy: true, timeout: 10000 } 
            );
        }

        setTimeout(() => mapaInstancia.invalidateSize(), 300); 
    }

    inicializarMapa(); 
    renderizarListaLateral(); 
});