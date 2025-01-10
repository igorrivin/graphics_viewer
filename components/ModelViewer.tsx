'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelViewerProps {
  modelUrl: string;
}

const VIEWER_HEIGHT = 400;
const IS_DEV = process.env.NODE_ENV === 'development';

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const logDebug = (message: string) => {
    if (IS_DEV) {
      console.log(message);
      setDebugInfo(prev => `${prev}\n${message}`);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (containerRef.current) {
      containerRef.current.style.height = `${VIEWER_HEIGHT}px`;
    }
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    container.style.height = `${VIEWER_HEIGHT}px`;
    
    const dims = {
      width: container.clientWidth,
      height: container.clientHeight
    };

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x404040);
    
    const camera = new THREE.PerspectiveCamera(
      75,
      dims.width / VIEWER_HEIGHT,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    
    renderer.setSize(dims.width, VIEWER_HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    
    // Debug cube (only in development)
    let cube: THREE.Mesh | null = null;
    if (IS_DEV) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        specular: 0x009900,
        shininess: 30,
      });
      cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      logDebug('Debug cube added');
    }
    
    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0.5, 1, -1.5);
    scene.add(dirLight);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    
    // Animation
    let animationFrameId: number;
    let mixer: THREE.AnimationMixer | null = null;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      if (IS_DEV && cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }
      if (mixer) mixer.update(0.016);
      controls.update();
      renderer.render(scene, camera);
    }

    animate();
    
    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        scene.add(gltf.scene);
        logDebug('Model loaded');
        
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(gltf.scene);
          mixer.clipAction(gltf.animations[0]).play();
        }

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (IS_DEV && cube) {
          cube.position.set(center.x + maxDim * 1.5, center.y, center.z);
          setTimeout(() => {
            if (cube) scene.remove(cube);
            logDebug('Debug cube removed');
          }, 5000);
        }

        camera.position.z = maxDim * 2;
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();
      },
      (progress) => {
        if (IS_DEV) {
          const percent = (progress.loaded / progress.total * 100).toFixed(1);
          logDebug(`Loading: ${percent}%`);
        }
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      camera.aspect = width / VIEWER_HEIGHT;
      camera.updateProjectionMatrix();
      renderer.setSize(width, VIEWER_HEIGHT);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (mixer) mixer.stopAllAction();
      renderer.dispose();
      controls.dispose();
    };
  }, [modelUrl, mounted]);

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        style={{ height: `${VIEWER_HEIGHT}px` }}
        className="w-full bg-gray-800 rounded-lg overflow-hidden"
      />
      {IS_DEV && debugInfo && (
        <pre className="text-xs text-gray-500 whitespace-pre-wrap">
          {debugInfo}
        </pre>
      )}
    </div>
  );
};

export default ModelViewer;
