import Papa from 'papaparse';
import { MasterLansia, LansiaData } from '../types';

const MASTER_DATA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh_ePcQk6dlMg-n35ZQEyp_PGDJKFR0Jyf-dVMTKFdVYwZ7MReVZ8xww_1pIMNqUEWE_087gZd26nR/pub?gid=1135930185&single=true&output=csv';
const RECAP_DATA_URL = 'https://docs.google.com/spreadsheets/d/1O1FcbEEewpca5ROmr1jhIbyRBkvPKfmgBHZQyvlU0gM/export?format=csv&gid=0';

export async function fetchMasterData(): Promise<MasterLansia[]> {
  try {
    const response = await fetch(MASTER_DATA_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedData = results.data.map((row: any) => {
            const getValue = (key: string) => {
              const foundKey = Object.keys(row).find(k => k.trim().toUpperCase() === key.toUpperCase());
              return foundKey ? String(row[foundKey]).trim() : '';
            };

            return {
              nama: getValue('NAMA'),
              jenisKelamin: getValue('JENIS KELAMIN'),
              nik: getValue('NIK'),
              tglLahir: getValue('TGL. LAHIR'),
              usia: getValue('USIA'),
              alamat: getValue('ALAMAT'),
              rt: getValue('RT'),
            };
          });
          resolve(mappedData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching master data:', error);
    return [];
  }
}

export async function fetchRecapData(): Promise<LansiaData[]> {
  try {
    const response = await fetch(RECAP_DATA_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mappedData = results.data.map((row: any) => {
            const getValue = (key: string) => {
              const foundKey = Object.keys(row).find(k => k.trim().toUpperCase() === key.toUpperCase());
              return foundKey ? String(row[foundKey]).trim() : '';
            };

            return {
              no: getValue('NO'),
              tanggal: getValue('TANGGAL'),
              nama: getValue('NAMA'),
              jenisKelamin: getValue('JENIS KELAMIN'),
              nik: getValue('NIK'),
              tglLahir: getValue('TGL. LAHIR'),
              usia: getValue('USIA'),
              alamat: getValue('ALAMAT'),
              rt: getValue('RT'),
              td: getValue('TD'),
              tb: getValue('TB'),
              bb: getValue('BB'),
              lp: getValue('LP'),
              gds: getValue('GDS'),
              chol: getValue('CHOL'),
              au: getValue('AU'),
            };
          });
          resolve(mappedData);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching recap data:', error);
    return [];
  }
}
