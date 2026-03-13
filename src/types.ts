export interface LansiaData {
  no?: string;
  tanggal: string;
  nama: string;
  jenisKelamin: string;
  nik: string;
  tglLahir: string;
  usia: string;
  alamat: string;
  rt: string;
  td: string; // Blood Pressure
  tb: string; // Height
  bb: string; // Weight
  lp: string; // Waist Circumference
  gds: string; // Blood Sugar
  chol: string; // Cholesterol
  au: string; // Uric Acid
}

export interface MasterLansia {
  nama: string;
  jenisKelamin: string;
  nik: string;
  tglLahir: string;
  usia: string;
  alamat: string;
  rt: string;
}
