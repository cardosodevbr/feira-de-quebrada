import { db } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', async () => { 
    const listaEmpreendedoresEl = document.getElementById('listaEmpreendedores'); 
    let mapaInstancia = null; 
    let empreendedores = [];

    async function carregarEmpreendedoresDoBanco() {
        try {
            const snapshot = await get(ref(db, 'Comercio'));
            if (snapshot.exists()) {
                const dadosComercios = snapshot.val();
                empreendedores = [];

                Object.keys(dadosComercios).forEach(uid => {
                    const comercio = dadosComercios[uid];
                    
                    // Procura as coordenadas dentro de dadosNegocio ou diretamente na raiz do comércio
                    let lat = null;
                    let lng = null;
                    let nome = "Comércio sem nome";
                    let categoria = "Geral";
                    let bairro = "Região";
                    let whatsapp = "";

                    if (comercio.dadosNegocio) {
                        lat = comercio.dadosNegocio.lat;
                        lng = comercio.dadosNegocio.lng;
                        nome = comercio.dadosNegocio.nome || nome;
                        categoria = comercio.dadosNegocio.categoria || categoria;
                        bairro = comercio.dadosNegocio.bairro || bairro;
                        whatsapp = comercio.dadosNegocio.whatsapp || "";
                    } else {
                        lat = comercio.lat;
                        lng = comercio.lng;
                        nome = comercio.nomeComercio || comercio.nomeEmpreendedor || nome;
                        categoria = comercio.categoria || categoria;
                        bairro = comercio.bairro || bairro;
                        whatsapp = comercio.whatsapp || comercio["e-mail"] || "";
                    }

                    if (lat && lng) {
                        empreendedores.push({
                            id: uid,
                            nome: nome,
                            categoria: categoria,
                            bairro: bairro,
                            logo: comercio.logo || "https://via.placeholder.com/40",
                            lat: parseFloat(lat),
                            lng: parseFloat(lng),
                            linkWhats: whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, '')}` : "#"
                        });
                    }
                });
            }
        } catch (err) {
            console.error("Erro ao ler Firebase:", err);
        }
    }

    function renderizarListaLateral() { 
        if (!listaEmpreendedoresEl) return; 
        listaEmpreendedoresEl.innerHTML = ''; 

        if (empreendedores.length === 0) {
            listaEmpreendedoresEl.innerHTML = '<p style="padding: 15px; font-size: 13px; color: #666;">Nenhum empreendedor cadastrado nesta área ainda.</p>';
            return;
        }

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
                    mapaInstancia.setView([emp.lat, emp.lng], 16); 
                }
            });

            listaEmpreendedoresEl.appendChild(card); 
        });
    }

    async function inicializarMapa() { 
        const mapaDiv = document.getElementById('mapa');
        if (!mapaDiv) return;

        await carregarEmpreendedoresDoBanco();

        mapaInstancia = L.map('mapa').setView([-23.65, -46.75], 13); 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            attribution: '&copy; OpenStreetMap' 
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
                            <img src="${item.logo}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1px solid #ccc;" onerror="this.src='https://via.placeholder.com/24';">
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
                        radius: 300 
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
        } else {
            renderizarListaLateral();
        }

        setTimeout(() => mapaInstancia.invalidateSize(), 300); 
    }

    inicializarMapa(); 
});