import React, { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AiOutlineSend } from "react-icons/ai";
import {
  useGLTF,
  useTexture,
  Loader,
  Environment,
  useFBX,
  useAnimations,
  OrthographicCamera,
} from "@react-three/drei";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";

import { LineBasicMaterial, MeshPhysicalMaterial, Vector2, SRGBColorSpace, NoColorSpace } from "three";
import { OrbitControls } from "@react-three/drei";
import ReactAudioPlayer from "react-audio-player";
import createAnimation from "../../converter";
import blinkData from "../../blendDataBlink.json";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import * as THREE from "three";
import axios from "axios";
import MicRecorderToMp3 from "mic-recorder-to-mp3";
import Webcam from "react-webcam";
import { BiSolidUser } from "react-icons/bi";
import sakhiAI from "../../services/SakhiAI";
const _ = require("lodash");

const host = "/";

const Mp3Recorder = new MicRecorderToMp3({ bitRate: 128 });
function Avatar({
  avatar_url,
  speak,
  setSpeak,
  text,
  setAudioSource,
  playing,
}) {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NO CONDITIONAL HOOK CALLS

  // State hooks
  const [modelError, setModelError] = useState(null);
  const [clips, setClips] = useState([]);
  const [morphTargetDictionaryBody, setMorphTargetDictionaryBody] = useState(null);
  const [morphTargetDictionaryLowerTeeth, setMorphTargetDictionaryLowerTeeth] = useState(null);
  const [isModelReady, setIsModelReady] = useState(false);

  // Resource hooks (always called, never conditionally)
  const gltf = useGLTF(avatar_url);
  const textures = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    // "/images/teeth_specular.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);
  const idleFbx = useFBX("/idle.fbx");
  const { clips: idleClips } = useAnimations(idleFbx.animations);

  // Memo hook
  const mixer = useMemo(() => {
    if (gltf && gltf.scene) {
      return new THREE.AnimationMixer(gltf.scene);
    }
    return null;
  }, [gltf]);

  // Destructure textures
  const [
    bodyTexture,
    eyesTexture,
    teethTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    teethNormalTexture,
    // teethSpecularTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = textures;

  // Effects (always called in the same order)

  // Handle model loading errors
  useEffect(() => {
    if (gltf && gltf.scene) {
      setIsModelReady(true);
      setModelError(null);
    } else {
      setModelError("Failed to load 3D model");
      setIsModelReady(false);
    }
  }, [gltf]);

  // Handle texture loading and setup
  useEffect(() => {
    if (textures && textures.length > 0) {
      _.each(
        [
          bodyTexture,
          eyesTexture,
          teethTexture,
          teethNormalTexture,
          bodySpecularTexture,
          bodyRoughnessTexture,
          bodyNormalTexture,
          tshirtDiffuseTexture,
          tshirtNormalTexture,
          tshirtRoughnessTexture,
          hairAlphaTexture,
          hairNormalTexture,
          hairRoughnessTexture,
        ],
        (t) => {
          if (t) {
            t.colorSpace = SRGBColorSpace;
            t.flipY = false;
          }
        }
      );

      // Normal maps should not have color space encoding
      if (bodyNormalTexture) bodyNormalTexture.colorSpace = NoColorSpace;
      if (tshirtNormalTexture) tshirtNormalTexture.colorSpace = NoColorSpace;
      if (teethNormalTexture) teethNormalTexture.colorSpace = NoColorSpace;
      if (hairNormalTexture) hairNormalTexture.colorSpace = NoColorSpace;
    }
  }, [textures, bodyTexture, eyesTexture, teethTexture, teethNormalTexture,
      bodySpecularTexture, bodyRoughnessTexture, bodyNormalTexture,
      tshirtDiffuseTexture, tshirtNormalTexture, tshirtRoughnessTexture,
      hairAlphaTexture, hairNormalTexture, hairRoughnessTexture]);

  // Setup model materials and morph targets
  useEffect(() => {
    if (!isModelReady || !gltf || !gltf.scene) return;

    let bodyMorphDict = null;
    let teethMorphDict = null;

    gltf.scene.traverse((node) => {
      if (
        node.type === "Mesh" ||
        node.type === "LineSegments" ||
        node.type === "SkinnedMesh"
      ) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;

        if (node?.name.includes("Body")) {
          node.castShadow = true;
          node.receiveShadow = true;

          node.material = new MeshPhysicalMaterial();
          if (bodyTexture) node.material.map = bodyTexture;
          node.material.roughness = 1.7;

          if (bodyRoughnessTexture) node.material.roughnessMap = bodyRoughnessTexture;
          if (bodyNormalTexture) node.material.normalMap = bodyNormalTexture;
          node.material.normalScale = new Vector2(0.6, 0.6);

          bodyMorphDict = node.morphTargetDictionary;
          node.material.envMapIntensity = 0.8;
        }

        if (node?.name.includes("Eyes")) {
          node.material = new MeshStandardMaterial();
          if (eyesTexture) node.material.map = eyesTexture;
          node.material.roughness = 0.1;
          node.material.envMapIntensity = 0.5;
        }

        if (node?.name.includes("Brows")) {
          node.material = new LineBasicMaterial({ color: 0x000000 });
          node.material.linewidth = 1;
          node.material.opacity = 0.5;
          node.material.transparent = true;
          node.visible = false;
        }

        if (node?.name.includes("Teeth")) {
          node.receiveShadow = true;
          node.castShadow = true;
          node.material = new MeshStandardMaterial();
          node.material.roughness = 0.1;
          if (teethTexture) node.material.map = teethTexture;
          if (teethNormalTexture) node.material.normalMap = teethNormalTexture;
          node.material.envMapIntensity = 0.7;
        }

        if (node?.name.includes("Hair")) {
          node.material = new MeshStandardMaterial();
          if (hairTexture) node.material.map = hairTexture;
          if (hairAlphaTexture) node.material.alphaMap = hairAlphaTexture;
          if (hairNormalTexture) node.material.normalMap = hairNormalTexture;
          if (hairRoughnessTexture) node.material.roughnessMap = hairRoughnessTexture;

          node.material.transparent = true;
          node.material.depthWrite = false;
          node.material.side = 2;
          node.material.color.setHex(0x000000);
          node.material.envMapIntensity = 0.3;
        }

        if (node?.name.includes("TSHIRT")) {
          node.material = new MeshStandardMaterial();

          if (tshirtDiffuseTexture) node.material.map = tshirtDiffuseTexture;
          if (tshirtRoughnessTexture) node.material.roughnessMap = tshirtRoughnessTexture;
          if (tshirtNormalTexture) node.material.normalMap = tshirtNormalTexture;
          node.material.color.setHex(0xffffff);
          node.material.envMapIntensity = 0.5;
        }

        if (node?.name.includes("TeethLower")) {
          teethMorphDict = node.morphTargetDictionary;
        }
      }
    });

    setMorphTargetDictionaryBody(bodyMorphDict);
    setMorphTargetDictionaryLowerTeeth(teethMorphDict);
  }, [isModelReady, gltf, bodyTexture, eyesTexture, teethTexture, teethNormalTexture,
      bodyRoughnessTexture, bodyNormalTexture, hairTexture, hairAlphaTexture,
      hairNormalTexture, hairRoughnessTexture, tshirtDiffuseTexture,
      tshirtRoughnessTexture, tshirtNormalTexture]);

  // Setup idle animations
  useEffect(() => {
    if (!idleClips || !idleClips[0] || !mixer) return;

    const filteredTracks = _.filter(idleClips[0].tracks, (track) => {
      return (
        track?.name.includes("Head") ||
        track?.name.includes("Neck") ||
        track?.name.includes("Spine2")
      );
    });

    const mappedTracks = _.map(filteredTracks, (track) => {
      if (track?.name.includes("Head")) {
        track.name = "head.quaternion";
      }

      if (track?.name.includes("Neck")) {
        track.name = "neck.quaternion";
      }

      if (track?.name.includes("Spine")) {
        track.name = "spine2.quaternion";
      }

      return track;
    });

    idleClips[0].tracks = mappedTracks;

    const idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    if (morphTargetDictionaryBody) {
      const blinkClip = createAnimation(
        blinkData,
        morphTargetDictionaryBody,
        "HG_Body"
      );
      const blinkAction = mixer.clipAction(blinkClip);
      blinkAction.play();
    }
  }, [idleClips, mixer, morphTargetDictionaryBody]);

  // Handle speech synthesis
  useEffect(() => {
    if (speak === false || !morphTargetDictionaryBody || !morphTargetDictionaryLowerTeeth) return;

    makeSpeech(text)
      .then((response) => {
        let { blendData, filename } = response.data;
        console.log(response.data);
        let newClips = [
          createAnimation(blendData, morphTargetDictionaryBody, "HG_Body"),
          createAnimation(
            blendData,
            morphTargetDictionaryLowerTeeth,
            "HG_TeethLower"
          ),
        ];

        filename = `http://localhost:5000/${filename}`;
        console.log(filename);
        setClips(newClips);
        setAudioSource(filename);
      })
      .catch((err) => {
        console.error(err);
        setSpeak(false);
      });
  }, [speak, text, morphTargetDictionaryBody, morphTargetDictionaryLowerTeeth, setAudioSource, setSpeak]);

  // Play animation clips when available
  useEffect(() => {
    if (playing === false || !mixer) return;

    _.each(clips, (clip) => {
      let clipAction = mixer.clipAction(clip);
      clipAction.setLoop(THREE.LoopOnce);
      clipAction.play();
    });
  }, [playing, clips, mixer]);

  // Frame update hook
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  // If there's a model error, show a fallback avatar
  if (modelError) {
    return (
      <group name="avatar-fallback">
        <mesh position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#4A90E2" />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#FDBCB4" />
        </mesh>
      </group>
    );
  }

  // If model is not ready yet, return null
  if (!isModelReady || !gltf || !gltf.scene) {
    return null;
  }

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

function makeSpeech(text) {
  return axios.post(host + "talk", { text });
}

const STYLES = {
  area: {
    position: "absolute",
    top: "20px",
    left: "10px",
    zIndex: 500,
    width: "50vw",
  },
  text: {
    margin: "0px",
    width: "300px",
    padding: "5px",
    background: "none",
    color: "#ffffff",
    fontSize: "1.2em",
    border: "none",
  },
  speak: {
    padding: "10px",
    marginTop: "5px",
    display: "block",
    color: "#FFFFFF",
    background: "#222222",
    border: "None",
  },
  area2: { position: "absolute", top: "5px", right: "15px", zIndex: 500 },
  label: { color: "#777777", fontSize: "0.8em" },
};

const ChatBot = () => {
  const [chats, setChats] = useState([]);
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };
  const audioPlayer = useRef();

  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState(
    "My name is Arwen. I'm a virtual human who can speak whatever you type here along with realistic facial movements."
  );
  const [chat, setChat] = useState(false);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [inputText, setInputText] = useState("");

  // RAG-related state
  const [documents, setDocuments] = useState([]);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(false);
  const [ragConnected, setRagConnected] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);
  // End of play
  function playerEnded(e) {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }
  const name = JSON.parse(localStorage.getItem("data"))?.name;
  const userId = localStorage.getItem('sessionId') || 'default';
  // Player is read
  function playerReady(e) {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);
  }

  // Initialize RAG functionality
  useEffect(() => {
    // RAG is always enabled with our backend
    setRagEnabled(true);
    checkRAGConnection();
    loadUserDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check RAG backend connection
  const checkRAGConnection = async () => {
    try {
      const response = await fetch('http://localhost:6000/api/health');
      if (response.ok) {
        setRagConnected(true);
        console.log('✅ RAG Backend connected');
      } else {
        setRagConnected(false);
        console.warn('⚠️ RAG Backend not responding');
      }
    } catch (error) {
      setRagConnected(false);
      console.warn('⚠️ RAG Backend unavailable:', error.message);
    }
  };

  // Load user documents
  const loadUserDocuments = async () => {
    try {
      const userDocs = await sakhiAI.getUserDocuments(userId);
      setDocuments(userDocs);
    } catch (error) {
      console.error('Failed to load user documents:', error);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadingDocument(true);
    setUploadProgress(0);

    try {
      console.log('Uploading document:', file.name);
      const result = await sakhiAI.uploadMedicalDocument(file, userId);

      console.log('Document uploaded successfully:', result);
      await loadUserDocuments(); // Refresh documents list
      setUploadProgress(100);

      // Show success message
      setChats(prev => [...prev, {
        role: "Sakhi",
        msg: `Great! I've successfully processed your medical document "${file.name}". I can now use this information to provide more personalized responses to your health questions.`
      }]);

      // Reset form
      setTimeout(() => {
        setUploadingDocument(false);
        setUploadProgress(null);
        setShowDocumentUpload(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error) {
      console.error('Document upload failed:', error);
      alert(`Failed to upload document: ${error.message}`);
      setUploadingDocument(false);
      setUploadProgress(null);
    }
  };

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  const {
    transcript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // useEffect(() => {
  //   if (!recorderControls?.recordingBlob) return;
  //   console.log(recorderControls?.recordingBlob);
  // }, [recorderControls.recordingBlob]);
  const [isRecording, setIsRecording] = useState(false);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const imgRef = useRef();
  const start = async () => {
    try {
      // Check for microphone support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Microphone access not supported in this browser');
        alert('Microphone access is not supported in this browser. Please try a different browser.');
        return;
      }

      // Check if speech recognition is supported
      if (!browserSupportsSpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      await Mp3Recorder.start();
      setIsRecording(true);
      SpeechRecognition.startListening();
      console.log("Recording started successfully");
    } catch (e) {
      console.error('Error starting recording:', e);
      if (e.name === 'NotAllowedError') {
        alert('Microphone access was denied. Please allow microphone access to use speech features.');
      } else if (e.name === 'NotFoundError') {
        alert('No microphone was found. Please connect a microphone to use speech features.');
      } else {
        alert('Unable to start recording. Please check your microphone settings.');
      }
    }
  };
  // useEffect(() => {
  //   getResponse();
  // }, []);
  const getResponse = async (message) => {
    try {
      // Use custom Sakhi AI with RAG capabilities
      const aiResponse = await sakhiAI.generateResponse(message, {
        timestamp: new Date().toISOString(),
        userId: userId
      });

      console.log("Sakhi AI Response:", aiResponse);

      // Extract text from response (handle both RAG and regular responses)
      const responseText = aiResponse.text || aiResponse;
      setText(responseText);

      // Create chat message
      const chatMessage = {
        role: "Sakhi",
        msg: responseText,
        sources: aiResponse.sources || [],
        ragEnabled: aiResponse.ragEnabled || false
      };

      setChats([
        ...chats,
        { role: "User", msg: message },
        chatMessage,
      ]);
      setInputText("");
      setSpeak(true);
    } catch (error) {
      console.error("Sakhi AI Error:", error);
      // Fallback response
      const fallbackResponse = "I'm here to support you. While I'm experiencing some technical difficulties, please remember that taking care of your mental health is important.";
      setText(fallbackResponse);
      setChats([
        ...chats,
        { role: "User", msg: message },
        { role: "Sakhi", msg: fallbackResponse },
      ]);
      setInputText("");
      setSpeak(true);
    }
  };

  const stop = async () => {
    try {
      // First stop the recording
      if (Mp3Recorder && typeof Mp3Recorder.stop === 'function') {
        Mp3Recorder.stop();
      }

      // Wait a moment for the recording to finalize
      await new Promise(resolve => setTimeout(resolve, 100));

      // Then try to get the MP3
      if (Mp3Recorder && typeof Mp3Recorder.getMp3 === 'function') {
        const mp3Blob = await Mp3Recorder.getMp3();
        if (mp3Blob && mp3Blob.size > 0) {
          try {
            const audioURL = URL.createObjectURL(mp3Blob);
            console.log("Audio recorded:", audioURL);
          } catch (urlError) {
            console.warn("Failed to create object URL for audio:", urlError);
          }
        } else {
          console.warn("No audio data recorded");
        }
      } else {
        console.warn("Mp3Recorder not available");
      }

      setIsRecording(false);
      SpeechRecognition.stopListening();
      console.log(transcript);
      // setChats([...chats, { role: "User", msg: transcript }]);
      getResponse(transcript);
      capture();
    } catch (e) {
      console.error("Error stopping recording:", e);
    }
  };

  const capture = React.useCallback(async () => {
    try {
      if (!imgRef.current) {
        console.error("Webcam ref is not available");
        return;
      }

      if (!isWebcamReady) {
        console.error("Webcam is not ready yet");
        return;
      }

      const imageSrc = imgRef.current.getScreenshot();
      if (!imageSrc) {
        console.error("Failed to capture screenshot - empty image source");
        return;
      }

      // Validate that the image source is not empty
      if (imageSrc === "data:,") {
        console.error("Screenshot captured is empty - webcam may not be ready");
        return;
      }

      const blob = await fetch(imageSrc).then((res) => res.blob());
      if (blob.size === 0) {
        console.error("Screenshot blob is empty");
        return;
      }

      let file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      console.log("Screenshot captured successfully:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Optionally, you can do something with the file here
      // For example: upload it, store it, or process it

    } catch (error) {
      console.error("Error capturing screenshot:", error);
    }
  }, [imgRef, isWebcamReady]);

  return (
    <div className="w-full flex">
            <div className="absolute flex items-center right-4 top-4 z-[1000]">
        <h1 className="text-xl text-sky-500 mr-4">{name}</h1>
        <div className="h-12 w-12 rounded-full bg-gray-300/30 flex justify-center items-center text-sky-500">
          <BiSolidUser size={30} />
        </div>
      </div>
      <div className="relative w-[50vw]">
        <div
          style={STYLES.area}
          className="flex flex-col justify-between h-[90vh]"
        >
          <div
            className={`max-w-[350px] ${
              !chat && "invisible"
            } flex flex-col mb-16 min-h-[450px]`}
          >
            <div
              className="bg-sky-50 max-w-[350px] flex flex-col p-4 min-h-[450px] max-h-[450px] overflow-y-auto"
              style={{
                zIndex: 1000,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-center text-xl font-semibold">
                  Chat Window
                </h1>
                <div className="flex items-center gap-2">
                  {/* RAG Connection Status */}
                  <div className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                    ragConnected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      ragConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    RAG {ragConnected ? 'Connected' : 'Offline'}
                  </div>

                  {ragEnabled && (
                    <button
                      onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                      title="Upload medical documents"
                    >
                      📄 Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Document Upload Section */}
              {ragEnabled && showDocumentUpload && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold mb-2 text-blue-800">
                    Upload Medical Documents
                  </h3>
                  <p className="text-xs text-blue-600 mb-3">
                    Upload PDF medical reports for personalized responses
                  </p>

                  {documents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">
                        Your Documents ({documents.length}):
                      </p>
                      <div className="space-y-1">
                        {documents.slice(0, 3).map((doc, idx) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-blue-200">
                            <span className="font-medium">{doc.title || doc.filename}</span>
                            <span className="text-gray-500 ml-1">
                              ({doc.chunks?.length || 0} pages)
                            </span>
                          </div>
                        ))}
                        {documents.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            ... and {documents.length - 3} more documents
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={uploadingDocument}
                  />

                  <button
                    onClick={handleFileSelect}
                    disabled={uploadingDocument}
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                  >
                    {uploadingDocument ? 'Uploading...' : 'Choose PDF File'}
                  </button>

                  {uploadProgress !== null && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        {uploadProgress < 100 ? 'Processing...' : 'Complete!'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {chats?.map((chat, index) => (
                <div key={index} className="mb-3">
                  <h1 className="text-lg">
                    <span className="font-semibold">{chat.role}</span> :{" "}
                    {chat.msg}
                  </h1>
                  {chat.ragEnabled && (
                    <div className="ml-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        📚 Using your medical context
                      </span>
                      {chat.sources && chat.sources.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sources: {chat.sources.map(s => s.title).join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 bg-white flex flex-row p-2 rounded">
              <input
                type="text"
                placeholder="Enter Message"
                className="w-full outline-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    getResponse(inputText);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (inputText.trim()) {
                    getResponse(inputText);
                  }
                }}
                disabled={!inputText.trim()}
                className="ml-2 disabled:opacity-50"
              >
                <AiOutlineSend size={25} />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setChat((prev) => !prev)}
              className="bg-teal-200 p-2 rounded text-lg hover:bg-teal-300 transition-colors"
            >
              Chat
            </button>
            {ragEnabled && (
              <button
                onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                className="bg-blue-200 p-2 rounded text-lg hover:bg-blue-300 transition-colors"
                title="Upload medical documents"
              >
                📄 Documents
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-md text-white mb-2">{transcript || (browserSupportsSpeechRecognition ? "Click 'Start' to begin speaking..." : "Speech recognition not supported in this browser")}</p>
            <div className="flex flex-row items-center">
              <button
                className={`p-2 rounded text-lg w-[100px] transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : browserSupportsSpeechRecognition
                    ? 'bg-teal-200 hover:bg-teal-300'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                onClick={start}
                disabled={isRecording || !browserSupportsSpeechRecognition}
                title={!browserSupportsSpeechRecognition ? "Speech recognition not supported. Please use Chrome, Edge, or Safari." : ""}
              >
                {isRecording ? 'Recording...' : browserSupportsSpeechRecognition ? 'Start' : 'Not Supported'}
              </button>

              <div className="relative ml-4">
                <Webcam
                  ref={imgRef}
                  audio={false}
                  height={videoConstraints.height}
                  screenshotFormat="image/jpeg"
                  width={videoConstraints.width}
                  videoConstraints={videoConstraints}
                  style={{ display: 'none' }}
                  onUserMedia={() => {
                    console.log("Webcam access granted and ready");
                    setIsWebcamReady(true);
                  }}
                  onUserMediaError={(error) => {
                    console.error("Webcam access error:", error);
                    setIsWebcamReady(false);
                  }}
                />
                <button
                  className="bg-red-200 hover:bg-red-300 disabled:bg-gray-300 p-2 rounded text-lg w-[100px] transition-colors"
                  onClick={() => {
                    stop();
                  }}
                  disabled={!isRecording || !browserSupportsSpeechRecognition}
                >
                  Stop
                </button>
              </div>

              {isRecording && browserSupportsSpeechRecognition && (
                <div className="ml-4 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                  <span className="text-white text-sm">Listening...</span>
                </div>
              )}

              {!browserSupportsSpeechRecognition && (
                <div className="ml-4 flex items-center max-w-[200px]">
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2">
                    <p className="text-yellow-200 text-xs">
                      Speech recognition requires Chrome, Edge, or Safari browsers
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-0 h-0">
          <ReactAudioPlayer
            src={audioSource}
            ref={audioPlayer}
            onEnded={playerEnded}
            onCanPlayThrough={playerReady}
          />
        </div>

        {/* <Stats /> */}
        <div className="w-[83vw]">
          <Canvas
            dpr={2}
            onCreated={(ctx) => {
              ctx.gl.physicallyCorrectLights = true;
            }}
          >
            <OrthographicCamera
              makeDefault
              zoom={1700}
              position={[0, 1.65, 1]}
            />

            <OrbitControls
              target={[0, 1.65, 0]}
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={0.5}
              maxDistance={5}
            />

            <Suspense fallback={null}>
              <Environment
                background={false}
                files="/images/photo_studio_loft_hall_1k.hdr"
              />
            </Suspense>

            <Suspense fallback={null}>
              <Bg />
            </Suspense>

            <Suspense fallback={null}>
              <Avatar
                avatar_url="/model.glb"
                speak={speak}
                setSpeak={setSpeak}
                text={text}
                setAudioSource={setAudioSource}
                playing={playing}
              />
            </Suspense>
          </Canvas>
        </div>
        <Loader dataInterpolation={(p) => `Loading... please wait`} />
      </div>
    </div>
  );
};

function Bg() {
  const texture = useTexture("/images/bg.webp");

  return (
    <mesh position={[0, 1.5, -2]} scale={[0.9, 0.8, 0.9]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default ChatBot;
