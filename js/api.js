// File: js/api.js

// PASTIKAN TEMPELKAN URL DEPLOYMENT BARU ANDA YANG BERAKHIRAN /exec DI SINI
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxs0oCUG2OyKuM9tQi4h_IWgqkFPCxe4sdPkPWUv6iH8yfw3hyq-5o3ybijU-sF0cTH/exec"; 

const API = {
    async get(action, params = {}) {
        try {
            const url = new URL(WEB_APP_URL);
            url.searchParams.append('action', action);
            for (const key in params) {
                url.searchParams.append(key, params[key]);
            }
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("API GET Error:", error);
            throw error;
        }
    },

    async post(action, sheetName, rowData) {
        try {
            const payload = {
                action: action,
                sheetName: sheetName,
                rowData: rowData
            };
            
            // Menggunakan Content-Type text/plain agar terhindar dari kriteria CORS Preflight (OPTIONS)
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload),
                redirect: 'follow'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("API POST Error:", error);
            throw error;
        }
    }
};