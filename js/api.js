// File: js/api.js

// PASTE URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
// PASTIKAN INI ADALAH URL DARI HASIL "NEW DEPLOYMENT" TERBARU!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxs0oCUG2OyKuM9tQi4h_IWgqkFPCxe4sdPkPWUv6iH8yfw3hyq-5o3ybijU-sF0cTH/exec';

const API = {
    // Fungsi GET
    get: async (action, params = {}) => {
        let url = new URL(SCRIPT_URL);
        url.searchParams.append('action', action);
        for (let key in params) {
            url.searchParams.append(key, params[key]);
        }
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors', // Menangani CORS
                redirect: 'follow' // Mengikuti pengalihan (redirect) dari Google
            });
            
            // Cek jika response dari server bukan 200 OK
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error Fetching GET:", error);
            throw error;
        }
    },

    // Fungsi POST (Simpan Data)
    post: async (action, sheetName, rowData) => {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    // Sangat Penting untuk GAS: Gunakan text/plain untuk menghindari CORS Preflight (OPTIONS) error
                    'Content-Type': 'text/plain;charset=utf-8', 
                },
                body: JSON.stringify({
                    action: action,
                    sheetName: sheetName,
                    rowData: rowData
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("Error Fetching POST:", error);
            throw error;
        }
    }
};