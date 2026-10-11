import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const formLogin = document.getElementById("form-login");

if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("email");
        const senhaInput = document.getElementById("senha");

        if (!emailInput || !senhaInput) return;

        const email = emailInput.value.trim();
        const senha = senhaInput.value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;

            let temComercio = false;
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout")), 2500)
                );
                const dbPromise = get(ref(db, `Comercio/${user.uid}/dadosNegocio`));
                const snap = await Promise.race([dbPromise, timeoutPromise]);

                if (snap.exists()) {
                    temComercio = true;
                }
            } catch (err) {
                console.warn("Verificação de comércio ignorada/demorou:", err.message);
            }

            if (temComercio) {
                window.location.href = "painel.html";
            } else {
                window.location.href = "inicio.html";
            }

        } catch (error) {
            console.error("Erro no login:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                alert("E-mail ou senha incorretos.");
            } else {
                alert("Ocorreu um erro ao entrar. Tente novamente.");
            }
        }
    });
}