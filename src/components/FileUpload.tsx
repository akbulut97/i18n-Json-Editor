import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TranslationFile } from '../types';
import { detectLanguageFromFilename } from '../utils/languageUtils';
import { validateJSON, flattenObject } from '../utils/jsonUtils';

interface FileUploadProps {
  onFilesUploaded: (files: TranslationFile[]) => void;
  onError: (message: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, onError }) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<TranslationFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    const translationFiles: TranslationFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: ${t('fileUpload.fileSizeError')}`);
        continue;
      }

      // Check file type
      if (!file.name.endsWith('.json')) {
        errors.push(`${file.name}: ${t('fileUpload.fileTypeError')}`);
        continue;
      }

      try {
        const content = await file.text();
        const validation = validateJSON(content);
        
        if (!validation.valid) {
          errors.push(`${file.name}: ${t('fileUpload.invalidJson')} - ${validation.error}`);
          continue;
        }

        const languageCode = detectLanguageFromFilename(file.name);
        const flatData = flattenObject(validation.data);

        translationFiles.push({
          filename: file.name,
          languageCode,
          data: flatData,
          size: file.size
        });
      } catch (error) {
        errors.push(`${file.name}: ${t('fileUpload.readError')}`);
      }
    }

    setIsProcessing(false);

    if (errors.length > 0) {
      onError(`${t('fileUpload.uploadErrors')}:\n${errors.join('\n')}`);
    }

    if (translationFiles.length > 0) {
      setUploadedFiles(translationFiles);
      onFilesUploaded(translationFiles);
    }
  }, [onFilesUploaded, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  return (
    <div className="space-y-6">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept=".json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full ${
            isDragOver ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
          }`}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isProcessing ? t('fileUpload.processing') : t('fileUpload.dragDrop')}
            </h3>
            <p className="text-gray-400">
              {t('fileUpload.dragDropSubtitle')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('fileUpload.maxFileSize')}
            </p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">{t('fileUpload.uploadedFiles')}</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">{file.filename}</p>
                  <p className="text-xs text-gray-400">
                    {file.languageCode.toUpperCase()} • {Object.keys(file.data).length} {t('fileUpload.keys')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;