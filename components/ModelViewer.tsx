'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelViewerProps {
  modelUrl: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('ModelViewer mounting with URL:', modelUrl);
    if (!containerRef.current) {
      console.error('Container ref not ready');
      return;
    }

    const container = containerRef.current;
    console.log('Container size:', container.clientWidth, container.clientHeight);
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x404040);
    console.log('Scene created');
    
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    console.log('Renderer created');
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0.5, 1, -1.5);
    scene.add(directionalLight);
    console.log('Lights added');

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    console.log('Controls created');

    // Set initial camera position
    camera.position.z = 5;

    // Animation
    let animationFrameId: number;
    let mixer: THREE.AnimationMixer | null = null;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      
      if (mixer) {
        mixer.update(0.016);
      }
      
      controls.update();
      renderer.render(scene, camera);
    }

    // Start animation loop
    animate();
    console.log('Animation loop started');

    // Load model
    console.log('Creating GLTFLoader for:', modelUrl);
    const loader = new GLTFLoader();
    
    loader.load(
      modelUrl,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        scene.add(gltf.scene);

        // Handle animations
        if (gltf.animations && gltf.animations.length) {
          console.log('Found animations:', gltf.animations.length);
          mixer = new THREE.AnimationMixer(gltf.scene);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        // Position camera to view model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        camera.position.z = maxDim * 2;
        camera.lookAt(center);
        controls.target.copy(center);
        controls.update();

        console.log('Camera positioned at z:', camera.position.z);
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100);
        console.log('Loading progress:', percent.toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      console.log('ModelViewer cleanup');
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (mixer) {
        mixer.stopAllAction();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [modelUrl]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-96 bg-gray-800 rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}  // Added explicit minimum height
    />
  );
};

export default ModelViewer;
