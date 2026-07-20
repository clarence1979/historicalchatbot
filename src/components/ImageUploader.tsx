import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle, CheckCircle, Camera, RefreshCw } from 'lucide-react';
import { ImageProcessor, ImageProcessingResult } from '../utils/imageProcessor';

interface ImageUploaderProps {
  label: string;
  description: string;
  onImageProcessed: (result: ImageProcessingResult) => void;
  currentImage?: string;
  onImageRemoved: () => void;
  maxWidth?: number;
  quality?: number;
  aspectRatio?: string;
  allowAIGeneration?: boolean;
  onAIGenerate?: () => void;
  isGenerating?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  description,
  onImageProcessed,
  currentImage,
  onImageRemoved,
  maxWidth = 800,
  quality = 0.8,
  aspectRatio = 'any',
  allowAIGeneration = false,
  onAIGenerate,
  isGenerating = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    const validation = ImageProcessor.validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await ImageProcessor.processImageFile(file, maxWidth, quality);
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      setTimeout(() => {
        onImageProcessed(result);
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const removeImage = () => {
    onImageRemoved();
    setError(null);
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('Failed to capture photo');
        return;
      }

      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      stopCamera();
      await handleFile(file);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-2">{label}</h4>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      </div>

      {!currentImage && !showCamera ? (
        <>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              dragActive
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-300 hover:border-amber-400 bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <ImageIcon className={`mx-auto h-8 w-8 mb-3 ${dragActive ? 'text-amber-600' : 'text-gray-400'}`} />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Drop your image here, or{' '}
                <label className="text-amber-600 hover:text-amber-700 cursor-pointer underline">
                  browse files
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">
                Supports JPEG, PNG, WebP up to 10MB
              </p>
            </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing image...</span>
                <span className="text-sm text-gray-500">{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {processingProgress === 100 && (
            <div className="mt-4 flex items-center justify-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Image processed successfully!</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isGenerating}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload Photo
          </button>
          <button
            onClick={startCamera}
            disabled={isProcessing || isGenerating}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Camera className="h-5 w-5 mr-2" />
            Take Photo
          </button>
        </div>
        {allowAIGeneration && onAIGenerate && (
          <button
            onClick={onAIGenerate}
            disabled={isProcessing || isGenerating}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating AI Portrait...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Generate AI Portrait
              </>
            )}
          </button>
        )}
      </>
      ) : showCamera ? (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : currentImage ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={currentImage}
              alt="Uploaded image"
              className={`w-full h-48 object-cover ${
                aspectRatio === 'square' ? 'aspect-square' : 
                aspectRatio === '16:9' ? 'aspect-video' : ''
              }`}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <button
                onClick={removeImage}
                className="opacity-0 hover:opacity-100 transition-opacity duration-200 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>Image uploaded successfully</span>
            <div className="flex gap-2">
              {allowAIGeneration && onAIGenerate && (
                <button
                  onClick={onAIGenerate}
                  disabled={isGenerating}
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                  title="Regenerate AI Portrait"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-1"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Regenerate
                </button>
              )}
              <button
                onClick={removeImage}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};