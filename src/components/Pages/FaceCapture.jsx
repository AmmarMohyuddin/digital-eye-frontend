import React, { useRef, useState, useEffect } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";

const FaceCapture = ({ open, onClose, onCapture }) => {
  const videoRef = useRef();
  const streamRef = useRef();

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    });
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    if (detections.length > 0) {
      const descriptors = detections.map((face) => Array.from(face.descriptor));
      onCapture(descriptors[0]); // Pass the face data to parent component
      toast.success("Face data captured successfully.");
      onClose();
    } else {
      toast.error("No face detected. Please try again.");
    }
  };

  useEffect(() => {
    if (open) {
      loadModels();
      startVideo();
    } else {
      stopVideo();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Capture Face Data</DialogTitle>
      <DialogContent>
        <video ref={videoRef} autoPlay style={{ width: "100%" }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleCapture} color="primary">
          Capture
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FaceCapture;
