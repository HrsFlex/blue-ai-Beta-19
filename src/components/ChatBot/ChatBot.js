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

        filename = host + filename;
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
  // End of play
  function playerEnded(e) {
    setAudioSource(null);
    setSpeak(false);
    setPlaying(false);
  }
  const name = JSON.parse(localStorage.getItem("data"))?.name;
  // Player is read
  function playerReady(e) {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);
  }
  const {
    transcript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // useEffect(() => {
  //   if (!recorderControls?.recordingBlob) return;
  //   console.log(recorderControls?.recordingBlob);
  // }, [recorderControls.recordingBlob]);
  const [isRecording, setIsRecording] = useState(false);
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
      // Use custom Sakhi AI instead of backend API
      const aiResponse = await sakhiAI.generateResponse(message, {
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('sessionId')
      });

      console.log("Sakhi AI Response:", aiResponse);
      setText(aiResponse);
      setChats([
        ...chats,
        { role: "User", msg: message },
        { role: "Sakhi", msg: aiResponse },
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
    const imageSrc = imgRef.current.getScreenshot();
    const blob = await fetch(imageSrc).then((res) => res.blob());
    let file = new File([blob], "photo", { type: "image/jpeg" });
    console.log("Screenshot captured:", file);
  }, [imgRef]);

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
              <h1 className="text-center text-xl font-semibold mb-2">
                Chat Window
              </h1>
              {chats?.map((chat, index) => (
                <h1 key={index} className="text-lg">
                  <span className="font-semibold">{chat.role}</span> :{" "}
                  {chat.msg}
                </h1>
              ))}
            </div>
            <div className="mt-4 bg-white flex flex-row p-2 rounded">
              <input
                type="text"
                placeholder="Enter Message"
                className="w-full outline-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                onClick={() => {
                  console.log("Hello");
                  getResponse(inputText);
                }}
              >
                <AiOutlineSend className="ml-4" size={25} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setChat((prev) => !prev)}
            className="bg-teal-200 p-2 rounded text-lg w-[100px] mb-6"
          >
            Chat
          </button>
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
                  height={0}
                  screenshotFormat="image/jpeg"
                  width={0}
                  videoConstraints={videoConstraints}
                  style={{ display: 'none' }}
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
