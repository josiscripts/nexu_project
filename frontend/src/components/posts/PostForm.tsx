'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, X, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import NexuButton from '@/components/ui/NexuButton';
import { cn } from '@/lib/utils';
import { createPost } from '@/services/post.service';

// Categorías UNESCO disponibles
const POST_CATEGORIES = [
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'CIENCIAS_NATURALES', label: 'Ciencias Naturales' },
  { value: 'CIENCIAS_SOCIALES', label: 'Ciencias Sociales' },
  { value: 'CULTURA', label: 'Cultura' },
  { value: 'COMUNICACION', label: 'Comunicación' },
  { value: 'INFORMATICA', label: 'Informática' },
  { value: 'MATEMATICAS', label: 'Matemáticas' },
  { value: 'INGENIERIA', label: 'Ingeniería' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'ARTES', label: 'Artes' },
] as const;

interface PostFormProps {
  onPostCreated?: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuthStore();

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !category || !token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createPost(
        {
          content: content.trim(),
          category,
        },
        token,
        selectedFile || undefined,
      );

      setContent('');
      setCategory('');
      setSelectedFile(null);
      setPreview(null);
      onPostCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-nexu-gray p-4 rounded-xl border border-gray-800">
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="¿Qué estás pensando?"
          rows={3}
          disabled={isSubmitting}
          className={cn(
            'w-full bg-nexu-dark text-white placeholder-gray-500',
            'border border-gray-700 rounded-lg p-3',
            'focus:outline-none focus:ring-2 focus:ring-nexu-cyan/50 focus:border-nexu-cyan',
            'resize-none transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          maxLength={maxLength}
        />
        <div className="flex justify-between items-center mt-2">
          <span
            className={cn(
              'text-xs',
              remainingChars < 20 ? 'text-red-400' : 'text-gray-500'
            )}
          >
            {remainingChars} caracteres restantes
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'text-xs flex items-center gap-1 transition-colors',
              selectedFile ? 'text-nexu-cyan' : 'text-gray-500 hover:text-gray-400'
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            {selectedFile ? selectedFile.name : 'Añadir imagen'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* File preview */}
      {preview && (
        <div className="mb-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-800 max-w-xs">
            <img src={preview} alt="Vista previa" className="w-full h-24 object-cover" />
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isSubmitting}
              className="absolute top-1 right-1 p-1 bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Selector de categoría */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Categoría
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {POST_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              disabled={isSubmitting}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                'border disabled:opacity-50 disabled:cursor-not-allowed',
                category === cat.value
                  ? 'bg-nexu-cyan/20 border-nexu-cyan text-nexu-cyan'
                  : 'bg-nexu-dark border-gray-700 text-gray-400 hover:border-gray-600'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-3 bg-red-500/10 p-2 rounded">{error}</p>
      )}

      <div className="flex justify-end">
        <NexuButton
          type="submit"
          disabled={!content.trim() || !category || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Publicar
            </>
          )}
        </NexuButton>
      </div>
    </form>
  );
}
