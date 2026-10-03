// File: js/api.js

// PASTE URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI
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
            const response = await fetch(url);
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
                body: JSON.stringify({
                    action: action,
                    sheetName: sheetName,
                    rowData: rowData
                })
            });
            return await response.json();
        } catch (error) {
            console.error("Error Fetching POST:", error);
            throw error;
        }
    }
};