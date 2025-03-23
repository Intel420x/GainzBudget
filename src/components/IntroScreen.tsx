'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Tween, update as tweenUpdate, Easing } from 'three/examples/jsm/libs/tween.module.js';

interface IntroScreenProps {
  onComplete: () => void;
  skipIntro?: boolean;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, skipIntro = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);
  
  // IMPORTANT: Always ignore the skipIntro prop - we want to show the intro
  // This ensures the intro always appears regardless of any other settings

  // Check if user has seen the intro before
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro === 'true') {
      setHasSeenBefore(true);
    }
  }, []);

  useEffect(() => {
    // Add error handling to prevent blank screens
    try {
      let scene: THREE.Scene;
      let camera: THREE.PerspectiveCamera;
      let renderer: THREE.WebGLRenderer;
      let sphere: THREE.Mesh;
      let orbitGroup: THREE.Group;
      let particleSystem: THREE.Points;
      let hyperOrbitSpeed = 0.002;
      let hyperParticleSpeed = 0.001;
      let hyperdriveActive = false;
      const clock = new THREE.Clock();
      const nodes: THREE.Mesh[] = [];
      
      // Initialize Three.js Scene
      const init = () => {
        if (!canvasRef.current || !containerRef.current) return;
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        renderer = new THREE.WebGLRenderer({ 
          canvas: canvasRef.current, 
          alpha: true, 
          antialias: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Create main sphere (wireframe)
        const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          wireframe: true,
          transparent: true,
          opacity: 0.0 // Invisible mesh; we'll use edges and points
        });
        sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(sphere);
        
        // Add wireframe edges with neon green color
        const edges = new THREE.EdgesGeometry(sphereGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff66 });
        const wireframe = new THREE.LineSegments(edges, edgeMaterial);
        sphere.add(wireframe);
        
        // Add points to sphere
        const pointsMaterial = new THREE.PointsMaterial({ color: 0x00ff66, size: 0.05 });
        const spherePoints = new THREE.Points(sphereGeometry, pointsMaterial);
        sphere.add(spherePoints);
        
        // Create orbiting nodes group
        orbitGroup = new THREE.Group();
        scene.add(orbitGroup);
        createOrbitingNodes(8, 2.5);
        
        // Create particle system background
        createParticles(500);
        
        // Add dollar sign in the center
        const loader = new THREE.TextureLoader();
        const dollarGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const dollarMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff66,
          transparent: true,
          opacity: 0.8
        });
        const dollarMesh = new THREE.Mesh(dollarGeometry, dollarMaterial);
        dollarMesh.position.z = 0.1;
        sphere.add(dollarMesh);
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
        
        setLoading(false);
      };
      
      // Create orbiting nodes
      const createOrbitingNodes = (count: number, radius: number) => {
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
          const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          
          node.position.set(x, y, 0);
          orbitGroup.add(node);
          nodes.push(node);
          
          // Add connecting lines to center
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(x, y, 0)
          ]);
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff66,
            transparent: true,
            opacity: 0.3
          });
          const line = new THREE.Line(lineGeometry, lineMaterial);
          orbitGroup.add(line);
        }
      };
      
      // Create particle system
      const createParticles = (count: number) => {
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 10;
          positions[i + 1] = (Math.random() - 0.5) * 10;
          positions[i + 2] = (Math.random() - 0.5) * 10;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
          color: 0x00ff66,
          size: 0.05,
          transparent: true,
          opacity: 0.7
        });
        
        particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
      };
      
      // Handle window resize
      const handleResize = () => {
        if (!camera || !renderer) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      // Animate loop
      const animate = () => {
        if (!scene || !camera || !renderer) return;
        
        const animationId = requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        
        // Update Tween animations
        tweenUpdate();
        
        // Pulsate sphere
        const scale = 1 + 0.15 * Math.sin(elapsedTime * 2);
        sphere.scale.set(scale, scale, scale);
        sphere.rotation.y += 0.005;
        
        // Rotate orbit group
        orbitGroup.rotation.z += hyperdriveActive ? hyperOrbitSpeed : 0.002;
        particleSystem.rotation.y += hyperdriveActive ? hyperParticleSpeed : 0.001;
        
        // Animate nodes pulsation
        nodes.forEach(node => {
          const pulse = 1 + 0.2 * Math.sin(elapsedTime * 3 + node.position.x);
          node.scale.set(pulse, pulse, pulse);
        });
        
        renderer.render(scene, camera);
        
        return () => {
          cancelAnimationFrame(animationId);
        };
      };
      
      // Hyperdrive Animation
      const engageHyperdrive = () => {
        if (!camera) return;
        
        hyperdriveActive = true;
        
        // Tween camera position
        new Tween(camera.position)
          .to({ z: 0.5 }, 2000)
          .easing(Easing.Quadratic.Out)
          .start();
        
        // Tween orbit and particle speeds
        const hyperParams = { orbitSpeed: 0.002, particleSpeed: 0.001 };
        new Tween(hyperParams)
          .to({ orbitSpeed: 0.05, particleSpeed: 0.02 }, 2000)
          .easing(Easing.Quadratic.Out)
          .onUpdate(() => {
            hyperOrbitSpeed = hyperParams.orbitSpeed;
            hyperParticleSpeed = hyperParams.particleSpeed;
          })
          .onComplete(() => {
            // After hyperdrive effect, fade out intro and show main content
            fadeOutIntro();
          })
          .start();
      };
      
      // Fade out intro
      const fadeOutIntro = () => {
        if (!containerRef.current) return;
        
        containerRef.current.style.transition = "opacity 1s ease";
        containerRef.current.style.opacity = "0";
        
        setTimeout(() => {
          onComplete();
        }, 1000);
      };
      
      init();
      const animationCleanup = animate();
      
      // Clean up
      return () => {
        try {
          window.removeEventListener('resize', handleResize);
          if (renderer) {
            renderer.dispose();
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
          // If there's an error during cleanup, still call onComplete to avoid getting stuck
          onComplete();
        }
      };
    } catch (error) {
      console.error('Error during initialization:', error);
      // If there's an error during initialization, still call onComplete to avoid getting stuck
      onComplete();
    }
  }, [onComplete]);
  
  const handleEnterClick = () => {
    const engageHyperdrive = () => {
      if (!containerRef.current) return;
      
      // Add hyperdrive class to container
      containerRef.current.classList.add('hyperdrive-active');
      
      // First zoom toward the center of the sphere
      setTimeout(() => {
        if (containerRef.current) {
          // Add the zoom-to-center class
          containerRef.current.classList.add('zoom-to-center');
          
          // Then add the flash effect and fade out
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.classList.add('flash-transition');
              
              // Finally fade out and complete
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.style.opacity = "0";
                  setTimeout(() => onComplete(), 400);
                }
              }, 600);
            }
          }, 1500);
        }
      }, 500);
    };
    
    engageHyperdrive();
  };
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 hyperdrive-container"
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Spaceship cockpit overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent opacity-70"></div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent opacity-70"></div>
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent opacity-70"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent opacity-70"></div>
        
        {/* Cockpit frame corners */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-green-500 opacity-50 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-green-500 opacity-50 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-green-500 opacity-50 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-green-500 opacity-50 rounded-br-lg"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-4 py-6 max-w-full" style={{ marginTop: '-180px' }}>
        <h1 className="text-5xl md:text-6xl font-bold text-white neon-text mb-6" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px #00ff66, 0 0 20px #00ff66, 0 0 30px #00ff66' }}>
          GainzBudget
        </h1>
        <p className="text-xl md:text-2xl text-white max-w-md text-center mb-8" style={{ fontFamily: 'Roboto Mono, monospace', textShadow: '0 0 8px #00ff66, 0 0 15px #00ff66' }}>
          Your secure financial tracking platform
        </p>
        
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="z-10 fixed bottom-0 left-0 right-0 flex justify-center items-center flex-col" style={{ paddingBottom: '50px' }}>
              <button
                onClick={handleEnterClick}
                className="bg-transparent border-2 border-primary-500 text-white px-10 py-4 rounded-full text-xl font-bold hover:bg-primary-500/30 transition-all transform hover:scale-105 focus:outline-none"
                style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px #00ff66, 0 0 20px #00ff66', boxShadow: '0 0 15px rgba(0, 255, 102, 0.5)' }}
              >
                ENTER
              </button>
            </div>
          </div>
        )}
        
        {hasSeenBefore && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onComplete}
              className="bg-transparent text-gray-500 hover:text-white text-xs px-2 py-1"
            >
              {/* Skip text removed */}
            </button>
          </div>
        )}
      </div>
      
      {/* Add stars in the background */}
      <style jsx>{`
        .hyperdrive-container {
          position: relative;
          overflow: hidden;
          transition: transform 2s cubic-bezier(0.19, 1, 0.22, 1);
        }
        
        .hyperdrive-container.zoom-to-center {
          transform: scale(2.5);
        }
        
        .hyperdrive-container.flash-transition:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #00ff66;
          z-index: 20;
          animation: flashEffect 1s forwards;
        }
        
        .hyperdrive-container.hyperdrive-active:after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300vw;
          height: 300vh;
          background: radial-gradient(circle, rgba(0,255,102,0) 0%, rgba(0,255,102,0.3) 50%, rgba(0,255,102,0.8) 100%);
          transform: translate(-50%, -50%) scale(0);
          animation: warpEffect 2s forwards;
          z-index: 5;
          pointer-events: none;
        }
        
        @keyframes warpEffect {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes flashEffect {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
      
      {/* Fallback button in case the intro gets stuck */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onComplete}
          className="bg-transparent text-gray-500 hover:text-white text-xs px-2 py-1"
        >
          {/* Skip text removed */}
        </button>
      </div>
    </div>
  );
};
