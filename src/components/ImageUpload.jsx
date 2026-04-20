
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ImageUpload = ({ onImageCaptured, isLoading }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast.error("Please select an image file");
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)");
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Pass the file to parent component
    onImageCaptured(file);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleCameraCapture = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not supported in your browser");
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video and canvas elements (not attached to DOM)
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set up video
      video.srcObject = stream;
      video.play();
      
      // Take picture after a short delay
      setTimeout(() => {
        // Set dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Stop all video streams
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to file
        canvas.toBlob((blob) => {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          
          // Update preview
          setPreviewImage(URL.createObjectURL(blob));
          
          // Pass to parent
          onImageCaptured(file);
        }, 'image/jpeg', 0.95);
      }, 300);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access the camera. Please check permissions.");
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="w-full max-w-md mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {previewImage ? (
          <motion.div 
            className="relative rounded-2xl overflow-hidden aspect-square bg-black"
            layoutId="imageContainer"
          >
            <motion.img
              src={previewImage}
              alt="Food preview"
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {!isLoading && (
              <motion.div 
                className="absolute bottom-4 right-4 flex space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-full glass"
                  onClick={() => {
                    setPreviewImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Change
                </Button>
              </motion.div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
              isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300'
            } image-upload-area`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-700 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Analyze food photo</h3>
              <p className="text-sm text-gray-800 mb-6">Take a photo or upload an image of your food</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="rounded-full px-6"
                  onClick={handleCameraCapture}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Take Photo
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full px-6" 
                  onClick={triggerFileInput}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  Upload
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageUpload;
