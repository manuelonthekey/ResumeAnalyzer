import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Upload as UploadIcon, FileText, ArrowLeft, Loader } from 'lucide-react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Navigate to analysis page of newly created resume
      navigate(`/analysis/${res.data.resume_id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload and parse resume. Please make sure the Affinda API key is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {/* Header (Static/Unscrollable) */}
      <div className="fixed top-0 left-0 right-0 z-50 frosted-header rounded-b-[36px] px-8 py-5 shadow-sm">
        <div className="w-full flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-3 bg-white hover:bg-violet-50 border border-violet-100 rounded-2xl transition-all text-violet-600 flex items-center justify-center btn-interactive shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Upload Resume</h1>
            <p className="text-purple-200 text-sm mt-0.5">We support PDF files up to 10MB</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-28">
        <div className="glass-card rounded-4xl p-8 shadow-md border border-white/60">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${
              dragging 
                ? 'border-primary-400 bg-primary-50/50' 
                : file 
                  ? 'border-emerald-300 bg-emerald-50/10' 
                  : 'border-primary-200 hover:border-primary-300 bg-gray-50/30'
            }`}
          >
            <input
              type="file"
              id="resume-file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />
            
            {file ? (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-emerald-100 text-emerald-500 rounded-3xl mb-4">
                  <FileText size={40} />
                </div>
                <h4 className="font-bold text-gray-800 text-lg text-center max-w-[280px] truncate">{file.name}</h4>
                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                
                <button
                  onClick={() => setFile(null)}
                  className="mt-4 text-xs font-semibold text-primary-500 hover:underline"
                  disabled={loading}
                >
                  Change File
                </button>
              </div>
            ) : (
              <label htmlFor="resume-file" className="cursor-pointer flex flex-col items-center w-full">
                <div className="p-4 bg-primary-100 text-primary-500 rounded-3xl mb-4 transition-transform hover:scale-105">
                  <UploadIcon size={40} />
                </div>
                <h4 className="font-bold text-gray-700 text-lg">Drag & Drop Resume</h4>
                <p className="text-gray-400 text-sm mt-1">or click to browse from files</p>
              </label>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl text-center font-semibold animate-shake">
              {error}
            </div>
          )}

          {/* Action Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full mt-6 gradient-header text-white font-semibold py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 btn-interactive"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Parsing resume structure with AI...
                </>
              ) : (
                'Process Resume'
              )}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
