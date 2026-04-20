import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const isRateLimitError = (err) => {
  const msg =
    (typeof err?.message === "string" && err.message) ||
    (typeof err === "string" ? err : "");
  return msg.includes("429") || msg.toLowerCase().includes("rate limit");
};


const LiveCameraDetection = ({ onFoodDetected, isActive, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // IMPORTANT: use a ref lock (not state) to avoid concurrent detections
  // due to React state updates being async (can cause double-save).
  const detectingRef = useRef(false);

  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [isLiveDetectionRunning, setIsLiveDetectionRunning] = useState(false);

  const detectionIntervalRef = useRef(null);
  const lastSavedFoodsRef = useRef([]); // Track last saved food names for duplicate detection
  const backoffTimeRef = useRef(5000); // Start with 5 seconds


  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsLiveDetectionRunning(false);
    detectingRef.current = false;
    setCameraReady(false);
    setIsDetecting(false);
    lastSavedFoodsRef.current = [];
  }, []);


  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const detectFood = useCallback(async () => {
    // Guard against overlapping requests (this was causing duplicate saves)
    if (detectingRef.current || rateLimited) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    detectingRef.current = true;
    setIsDetecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("detect-food", {
        body: { imageBase64 },
      });

      if (error) {
        console.error("Detection error:", error);

        if (isRateLimitError(error)) {
          // Stop live loop immediately to avoid hammering
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
          }
          setIsLiveDetectionRunning(false);

          setRateLimited(true);
          backoffTimeRef.current = Math.min(backoffTimeRef.current * 1.5, 30000);
          toast.error(
            `Rate limited. Waiting ${Math.round(backoffTimeRef.current / 1000)}s...`
          );
          setTimeout(() => setRateLimited(false), backoffTimeRef.current);
        }
        return;
      }

      // Reset backoff on success
      backoffTimeRef.current = 5000;

      if (data?.foods && data.foods.length > 0) {
        const detectionData = {
          ...data,
          uploadedImage: imageBase64,
          timestamp: new Date().toISOString(),
        };
        setLastDetection(detectionData);

        // Immediately notify parent after successful detection (with duplicate check)
        const currentFoodNames = data.foods
          .map((f) => f.name.toLowerCase())
          .sort()
          .join(",");
        const lastFoodNames = lastSavedFoodsRef.current
          .map((f) => f.toLowerCase())
          .sort()
          .join(",");
        if (currentFoodNames !== lastFoodNames) {
          lastSavedFoodsRef.current = data.foods.map((f) => f.name);
          onFoodDetected?.({
            foods: data.foods,
            uploadedImage: imageBase64,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        setLastDetection({ foods: [], description: "No food detected" });
      }
    } catch (error) {
      console.error("Error detecting food:", error);
    } finally {
      detectingRef.current = false;
      setIsDetecting(false);
    }
  }, [rateLimited, captureFrame, onFoodDetected]);


  const startLiveDetection = useCallback(() => {
    if (isLiveDetectionRunning || detectionIntervalRef.current || rateLimited) return;

    // Clear previous detection results and reset duplicate tracking
    setLastDetection(null);
    lastSavedFoodsRef.current = [];

    // Initial detection
    detectFood();

    // Set up interval for continuous detection (every 5 seconds to avoid rate limits)
    detectionIntervalRef.current = setInterval(() => {
      detectFood();
    }, 15000); // 15 seconds between detections

    // Use state (not ref) to drive UI/disable capture reliably
    setIsLiveDetectionRunning(true);
  }, [detectFood, rateLimited, isLiveDetectionRunning]);

  const stopLiveDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsLiveDetectionRunning(false);
    setIsDetecting(false);
    lastSavedFoodsRef.current = [];
  }, []);


  useEffect(() => {
    if (isActive) {
      // Clear previous detection data when camera becomes active
      setLastDetection(null);
      lastSavedFoodsRef.current = [];
      startCamera();
    } else {
      stopCamera();
      // Also clear when camera is deactivated
      setLastDetection(null);
      lastSavedFoodsRef.current = [];
    }
    
    return () => {
      stopCamera();
      setLastDetection(null);
      lastSavedFoodsRef.current = [];
    };
  }, [isActive, startCamera, stopCamera]);

  const handleCapture = async () => {
    if (rateLimited) {
      toast.error("Please wait - rate limit in effect");
      return;
    }

    // If live detection is running, don't allow manual capture (prevents double saves)
    if (isLiveDetectionRunning) return;

    // Prevent double clicks / overlap with live loop
    if (detectingRef.current) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      toast.error("Failed to capture image");
      return;
    }

    detectingRef.current = true;
    setIsDetecting(true);

    try {
      const { data, error } = await supabase.functions.invoke("detect-food", {
        body: { imageBase64 },
      });

      if (error) {
        if (error.message?.includes("429") || error.message?.includes("rate")) {
          setRateLimited(true);
          backoffTimeRef.current = Math.min(backoffTimeRef.current * 1.5, 30000);
          toast.error(
            `Rate limited. Please wait ${Math.round(backoffTimeRef.current / 1000)}s and try again.`
          );
          setTimeout(() => setRateLimited(false), backoffTimeRef.current);
          return;
        }
        throw error;
      }

      if (data?.foods && data.foods.length > 0) {
        onFoodDetected?.({
          foods: data.foods,
          uploadedImage: imageBase64,
          timestamp: new Date().toISOString(),
        });
        toast.success(`Detected: ${data.foods.map((f) => f.name).join(", ")}`);
        onClose?.();
      } else {
        toast.error("No food detected. Try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to detect food. Please try again.");
    } finally {
      detectingRef.current = false;
      setIsDetecting(false);
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Video Feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Detection frame */}
          <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
          </div>
          
          {/* Detection status */}
          {rateLimited && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/80 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white text-sm font-medium">Rate limited - please wait</span>
            </div>
          )}
          
          {isDetecting && !rateLimited && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white text-sm font-medium">Analyzing...</span>
              </div>
            </div>
          )}
          
          {/* Last detection results */}
          {lastDetection && lastDetection.foods?.length > 0 && (
            <motion.div
              className="absolute bottom-32 left-4 right-4 bg-black/70 backdrop-blur-md rounded-xl p-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h3 className="text-white font-semibold mb-2">Detected Foods:</h3>
              <div className="space-y-2">
                {lastDetection.foods.map((food, index) => (
                  <div key={index} className="flex justify-between items-center text-white/90">
                    <span className="font-medium">{food.name}</span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                      {food.calories} cal
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={onClose}
            >
              Close
            </Button>

            {isLiveDetectionRunning ? (
              <Button
                size="lg"
                className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600"
                onClick={stopLiveDetection}
              >
                <div className="w-6 h-6 bg-white rounded" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-full w-20 h-20 bg-white hover:bg-gray-100"
                onClick={cameraReady ? startLiveDetection : undefined}
                disabled={!cameraReady || isDetecting}
              >
                <div className="w-6 h-6 bg-primary rounded-full" />
              </Button>
            )}

            <Button
              size="lg"
              className="rounded-full bg-primary hover:bg-primary/90"
              onClick={handleCapture}
              disabled={!cameraReady || isDetecting || isLiveDetectionRunning}
            >
              Capture
            </Button>
          </div>

          <p className="text-center text-white/70 text-sm mt-4">
            {isLiveDetectionRunning
              ? "Live detection active - foods save immediately"
              : "Tap the circle to start live detection"}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveCameraDetection;
