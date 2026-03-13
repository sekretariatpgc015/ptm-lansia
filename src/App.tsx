import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  Calendar, 
  MapPin, 
  Activity, 
  Save, 
  RefreshCcw, 
  ChevronDown,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Table as TableIcon,
  Filter,
  Download,
  FileText,
  ExternalLink,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchMasterData, fetchRecapData } from './services/dataService';
import { MasterLansia, LansiaData } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'input' | 'recap';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [masterData, setMasterData] = useState<MasterLansia[]>([]);
  const [recapData, setRecapData] = useState<LansiaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recapLoading, setRecapLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recapSearchTerm, setRecapSearchTerm] = useState('');
  const [recapMonth, setRecapMonth] = useState('');
  const [recapYear, setRecapYear] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const [formData, setFormData] = useState<LansiaData>({
    no: '',
    tanggal: new Date().toISOString().split('T')[0],
    nama: '',
    jenisKelamin: '',
    nik: '',
    tglLahir: '',
    usia: '',
    alamat: '',
    rt: '',
    td: '',
    tb: '',
    bb: '',
    lp: '',
    gds: '',
    chol: '',
    au: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMasterData();
        setMasterData(data);
      } catch (error) {
        console.error('Failed to load master data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.tglLahir && formData.tanggal) {
      // Handle DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD
      const parts = formData.tglLahir.split(/[\/\-\s]/);
      if (parts.length >= 3) {
        let d, m, y;
        
        // Cek jika format YYYY-MM-DD
        if (parts[0].length === 4) {
          y = parseInt(parts[0]);
          m = parseInt(parts[1]) - 1;
          d = parseInt(parts[2]);
        } else {
          // Format DD/MM/YYYY
          d = parseInt(parts[0]);
          m = parseInt(parts[1]) - 1;
          y = parseInt(parts[2]);
        }
        
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          const birthDate = new Date(y, m, d);
          
          // Parse exam date (YYYY-MM-DD) ke local time agar perbandingan akurat
          const examParts = formData.tanggal.split('-').map(Number);
          if (examParts.length === 3) {
            const examDate = new Date(examParts[0], examParts[1] - 1, examParts[2]);
            
            if (!isNaN(birthDate.getTime()) && !isNaN(examDate.getTime())) {
              let age = examDate.getFullYear() - birthDate.getFullYear();
              const monthDiff = examDate.getMonth() - birthDate.getMonth();
              
              if (monthDiff < 0 || (monthDiff === 0 && examDate.getDate() < birthDate.getDate())) {
                age--;
              }
              
              if (age >= 0 && age.toString() !== formData.usia) {
                setFormData(prev => ({ ...prev, usia: age.toString() }));
              }
            }
          }
        }
      }
    }
  }, [formData.tglLahir, formData.tanggal, formData.usia]);

  useEffect(() => {
    if (activeTab === 'recap') {
      loadRecap();
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [recapSearchTerm, recapMonth, recapYear]);

  const loadRecap = async () => {
    setRecapLoading(true);
    try {
      const data = await fetchRecapData();
      setRecapData(data);
    } catch (error) {
      console.error('Failed to load recap data', error);
    } finally {
      setRecapLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return [];
    return masterData.filter(item => 
      (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (String(item.nik || '')).includes(searchTerm)
    ).slice(0, 10);
  }, [searchTerm, masterData]);

  const filteredRecapData = useMemo(() => {
    let data = recapData;
    
    if (recapSearchTerm) {
      const search = recapSearchTerm.toLowerCase();
      data = data.filter(item => 
        (item.nama || '').toLowerCase().includes(search) ||
        (item.nik || '').includes(search) ||
        (item.tanggal || '').toLowerCase().includes(search)
      );
    }
    
    if (recapMonth) {
      data = data.filter(item => (item.tanggal || '').toLowerCase().includes(recapMonth.toLowerCase()));
    }
    
    if (recapYear) {
      data = data.filter(item => (item.tanggal || '').includes(recapYear));
    }
    
    return data;
  }, [recapSearchTerm, recapData, recapMonth, recapYear]);

  const paginatedRecapData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecapData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecapData, currentPage]);

  const totalPages = Math.ceil(filteredRecapData.length / ITEMS_PER_PAGE);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2022; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  const handleSelectLansia = (lansia: MasterLansia) => {
    // Map gender from CSV format to form format
    let gender = '';
    const jk = (lansia.jenisKelamin || '').toUpperCase();
    if (jk.includes('LAKI')) gender = 'L';
    else if (jk.includes('PEREMPUAN')) gender = 'P';
    else if (jk === 'L' || jk === 'P') gender = jk;

    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    let birthDate = lansia.tglLahir || '';
    if (birthDate.includes('/')) {
      const parts = birthDate.split('/');
      if (parts.length === 3) {
        birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    setFormData(prev => ({
      ...prev,
      nama: lansia.nama || '',
      jenisKelamin: gender,
      nik: lansia.nik || '',
      tglLahir: birthDate,
      alamat: lansia.alamat || '',
      rt: lansia.rt || '',
    }));
    setSearchTerm(lansia.nama || '');
    setShowDropdown(false);
    setIsManual(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // If name is changed, check for exact match in master data for auto-fill
    if (name === 'nama' && value.length > 2) {
      const exactMatch = masterData.find(item => item.nama.toLowerCase() === value.toLowerCase());
      if (exactMatch) {
        handleSelectLansia(exactMatch);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // GANTI URL INI dengan URL Web App dari Google Apps Script Anda
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxvRr-SRRxS9oMK2xHZ3ec6OvDGfINji7TP0Gn-u9QnCpLivQeV5kbeWgeAoO_VxlwTig/exec'; 
    
    if (!SCRIPT_URL) {
      console.log('Simulasi pengiriman data (URL Script belum diisi):', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      setSubmitting(false);
      return;
    }
    
    // Format tanggal ke dd/mm/yyyy sebelum dikirim
    const [year, month, day] = formData.tanggal.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    
    // Format jenis kelamin lengkap
    const fullGender = formData.jenisKelamin === 'L' ? 'Laki-laki' : 
                      (formData.jenisKelamin === 'P' ? 'Perempuan' : formData.jenisKelamin);

    // Format tanggal lahir ke DD/MM/YYYY jika dalam format YYYY-MM-DD
    let finalTglLahir = formData.tglLahir;
    if (finalTglLahir.includes('-')) {
      const parts = finalTglLahir.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        finalTglLahir = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    const formattedData = {
      ...formData,
      no: formData.no ? `'${formData.no}` : '',
      rt: formData.rt ? `'${formData.rt}` : '',
      nik: formData.nik ? `'${formData.nik}` : '',
      tanggal: formattedDate,
      tglLahir: finalTglLahir,
      jenisKelamin: fullGender
    };
    
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(formattedData),
      });
      
      setSubmitted(true);
      resetForm();
      setTimeout(() => setSubmitted(false), 5000);
      
      // Beri waktu sedikit untuk Google Sheets memproses data sebelum reload rekap
      if (activeTab === 'recap') {
        setTimeout(() => loadRecap(), 2000);
      }
    } catch (error) {
      console.error('Submission failed', error);
      alert('Gagal mengirim data. Pastikan URL Script sudah benar.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      no: '',
      tanggal: new Date().toISOString().split('T')[0],
      nama: '',
      jenisKelamin: '',
      nik: '',
      tglLahir: '',
      usia: '',
      alamat: '',
      rt: '',
      td: '',
      tb: '',
      bb: '',
      lp: '',
      gds: '',
      chol: '',
      au: '',
    });
    setSearchTerm('');
    setIsManual(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="https://iili.io/qBjaTPf.png" 
            alt="Logo Posbindu" 
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
              PTM Lansia Cendrawasih 1
            </h1>
            <p className="text-stone-500 font-medium">Posbindu RW. 015 Pesona Gading Cibitung</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
          <button
            onClick={() => setActiveTab('input')}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'input' ? "bg-rose-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"
            )}
          >
            <ClipboardList size={18} />
            Input Data
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2",
              activeTab === 'recap' ? "bg-rose-500 text-white shadow-md" : "text-stone-500 hover:bg-stone-50"
            )}
          >
            <TableIcon size={18} />
            Rekapitulasi
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'input' ? (
          <motion.div
            key="input-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Search & Selection Section */}
            <section className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Search size={20} className="text-rose-500" />
                  Cari Data Lansia
                </h2>
                
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik Nama atau NIK..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  </div>

                  <AnimatePresence>
                    {showDropdown && (searchTerm || filteredData.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                      >
                        {filteredData.length > 0 ? (
                          filteredData.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectLansia(item)}
                              className="w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors border-b border-stone-100 last:border-0"
                            >
                              <div className="font-medium text-stone-900">{item.nama}</div>
                              <div className="text-xs text-stone-500 flex items-center gap-2">
                                <span>{item.nik}</span>
                                <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                                <span>{item.rt}</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-stone-500 text-sm">Data tidak ditemukan</div>
                        )}
                        <button
                          onClick={() => {
                            setIsManual(true);
                            setShowDropdown(false);
                            setFormData(prev => ({ ...prev, nama: searchTerm }));
                          }}
                          className="w-full text-left px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-rose-600 font-medium text-sm flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Input Manual: "{searchTerm}"
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {loading && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-stone-500 italic">
                    <RefreshCcw size={14} className="animate-spin" />
                    Memuat data master...
                  </div>
                )}
              </div>

              <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100">
                <h3 className="font-semibold text-rose-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Status Integrasi
                </h3>
                <p className="text-sm text-rose-700 leading-relaxed">
                  Data akan dikirimkan ke database PTM Lansia terpusat setelah Anda menekan tombol Simpan.
                </p>
              </div>

              <button 
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors shadow-sm"
              >
                <RefreshCcw size={16} />
                Kosongkan Form
              </button>
            </section>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <User className="text-rose-500" />
                    Informasi Personal
                  </h2>
                  <div className="text-xs font-mono bg-stone-100 px-2 py-1 rounded text-stone-500">
                    {isManual ? 'MODE MANUAL' : 'MODE AUTO-FILL'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">Tanggal Pemeriksaan</label>
                    <input
                      type="date"
                      name="tanggal"
                      value={formData.tanggal}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">Nama Lengkap</label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">NIK</label>
                    <input
                      type="text"
                      name="nik"
                      value={formData.nik}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">Jenis Kelamin</label>
                    <select
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl appearance-none"
                    >
                      <option value="">Pilih...</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">Tanggal Lahir</label>
                    <input
                      type="date"
                      name="tglLahir"
                      value={formData.tglLahir}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-stone-700">Usia</label>
                    <input
                      type="text"
                      name="usia"
                      value={formData.usia}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-stone-700">Alamat</label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        name="alamat"
                        placeholder="Nama Jalan / Dusun"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                      />
                      <div className="w-24">
                        <input
                          type="text"
                          name="rt"
                          placeholder="RT"
                          value={formData.rt}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Measurements */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <Activity className="text-rose-500" />
                  Hasil Pemeriksaan Klinis
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">TD (mmHg)</label>
                    <input
                      type="text"
                      name="td"
                      placeholder="120/80"
                      value={formData.td}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">TB (cm)</label>
                    <input
                      type="text"
                      name="tb"
                      placeholder="160"
                      value={formData.tb}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">BB (kg)</label>
                    <input
                      type="text"
                      name="bb"
                      placeholder="65"
                      value={formData.bb}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">LP (cm)</label>
                    <input
                      type="text"
                      name="lp"
                      placeholder="85"
                      value={formData.lp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">GDS (mg/dL)</label>
                    <input
                      type="text"
                      name="gds"
                      placeholder="110"
                      value={formData.gds}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">CHOL (mg/dL)</label>
                    <input
                      type="text"
                      name="chol"
                      placeholder="190"
                      value={formData.chol}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">AU (mg/dL)</label>
                    <input
                      type="text"
                      name="au"
                      placeholder="5.5"
                      value={formData.au}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4">
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-2 text-rose-600 font-medium"
                    >
                      <CheckCircle2 size={20} />
                      Data berhasil disimpan!
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "px-8 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    submitting && "animate-pulse"
                  )}
                >
                  {submitting ? (
                    <>
                      <RefreshCcw className="animate-spin" size={20} />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Data PTM
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="recap-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <TableIcon className="text-rose-500" />
                  Rekapitulasi Pemeriksaan
                </h2>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex gap-2">
                    <select
                      value={recapMonth}
                      onChange={(e) => setRecapMonth(e.target.value)}
                      className="px-3 h-10 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white"
                    >
                      <option value="">Semua Bulan</option>
                      {[
                        {v: "/01/", l: "Januari"}, {v: "/02/", l: "Februari"}, {v: "/03/", l: "Maret"},
                        {v: "/04/", l: "April"}, {v: "/05/", l: "Mei"}, {v: "/06/", l: "Juni"},
                        {v: "/07/", l: "Juli"}, {v: "/08/", l: "Agustus"}, {v: "/09/", l: "September"},
                        {v: "/10/", l: "Oktober"}, {v: "/11/", l: "November"}, {v: "/12/", l: "Desember"}
                      ].map(m => (
                        <option key={m.v} value={m.v}>{m.l}</option>
                      ))}
                    </select>
                    <select
                      value={recapYear}
                      onChange={(e) => setRecapYear(e.target.value)}
                      className="px-3 h-10 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white"
                    >
                      <option value="">Semua Tahun</option>
                      {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari Nama atau NIK..."
                      value={recapSearchTerm}
                      onChange={(e) => setRecapSearchTerm(e.target.value)}
                      className="pl-10 pr-4 h-10 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white w-full md:w-48"
                    />
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  </div>
                  <button 
                    onClick={loadRecap}
                    className="flex items-center justify-center gap-2 px-4 h-10 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    <RefreshCcw size={16} className={recapLoading ? "animate-spin" : ""} />
                    Refresh
                  </button>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1O1FcbEEewpca5ROmr1jhIbyRBkvPKfmgBHZQyvlU0gM/edit?gid=0#gid=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 h-10 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <ExternalLink size={16} />
                    Buka Google Sheet
                  </a>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-stone-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 font-bold border-b border-stone-200">No</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">Tanggal</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">Nama</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">JK</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">NIK</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">Tgl Lahir</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">Usia</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">Alamat</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">RT</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">TD</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">TB</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">BB</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">LP</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">GDS</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">CHOL</th>
                      <th className="px-4 py-3 font-bold border-b border-stone-200">AU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recapLoading ? (
                      <tr>
                        <td colSpan={16} className="px-4 py-12 text-center text-stone-400 italic">
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCcw className="animate-spin text-rose-500" size={24} />
                            Memuat data rekapitulasi...
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRecapData.length > 0 ? (
                      paginatedRecapData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/30 transition-colors text-sm">
                          <td className="px-4 py-3 text-stone-400 font-medium">
                            {item.nama ? (currentPage - 1) * ITEMS_PER_PAGE + idx + 1 : ''}
                          </td>
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{item.tanggal}</td>
                          <td className="px-4 py-3 font-medium text-stone-900">{item.nama}</td>
                          <td className="px-4 py-3 text-stone-600">{item.jenisKelamin}</td>
                          <td className="px-4 py-3 text-stone-500 font-mono text-xs">{item.nik}</td>
                          <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{item.tglLahir}</td>
                          <td className="px-4 py-3 text-stone-600">{item.usia}</td>
                          <td className="px-4 py-3 text-stone-600 truncate max-w-[150px]" title={item.alamat}>{item.alamat}</td>
                          <td className="px-4 py-3 text-stone-600">{item.rt}</td>
                          <td className="px-4 py-3 font-semibold text-stone-700">{item.td}</td>
                          <td className="px-4 py-3 text-stone-600">{item.tb}</td>
                          <td className="px-4 py-3 text-stone-600">{item.bb}</td>
                          <td className="px-4 py-3 text-stone-600">{item.lp}</td>
                          <td className="px-4 py-3 text-stone-600">{item.gds}</td>
                          <td className="px-4 py-3 text-stone-600">{item.chol}</td>
                          <td className="px-4 py-3 text-stone-600">{item.au}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={16} className="px-4 py-12 text-center text-stone-400 italic">
                          Belum ada data pemeriksaan yang tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-400 flex items-center gap-4">
                  <p>Menampilkan {paginatedRecapData.length} dari {filteredRecapData.length} data</p>
                  <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>Data diperbarui secara real-time</span>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Show first, last, and pages around current
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                currentPage === page 
                                  ? "bg-rose-500 text-white shadow-sm" 
                                  : "text-stone-600 hover:bg-stone-50 border border-transparent hover:border-stone-200"
                              )}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === 2 && currentPage > 3) || 
                          (page === totalPages - 1 && currentPage < totalPages - 2)
                        ) {
                          return <span key={page} className="text-stone-300 px-1">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-30 hover:bg-stone-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 pt-8 border-t border-stone-200 text-center text-stone-400 text-sm">
        <p>&copy; 2026 PTM Lansia Cendrawasih 1</p>
      </footer>
    </div>
  );
}

