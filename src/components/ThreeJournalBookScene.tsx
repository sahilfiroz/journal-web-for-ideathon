import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { JournalEntry } from '../types';

interface ThreeJournalBookSceneProps {
  entries: JournalEntry[];
  currentEntryIndex: number;
  onOpenBook: () => void;
  onSelectEntry?: (index: number) => void;
}

export const ThreeJournalBookScene: React.FC<ThreeJournalBookSceneProps> = ({
  entries,
  currentEntryIndex,
  onOpenBook,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const pagesGroupRef = useRef<THREE.Group | null>(null);
  const reqIdRef = useRef<number | null>(null);

  const activeEntry = entries[currentEntryIndex] || entries[0];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 5.2);
    camera.lookAt(0, 0, 0);

    // Renderer with soft shadows and anti-aliasing
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Warm Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xccdcff, 0.8);
    rimLight.position.set(-5, 3, -3);
    scene.add(rimLight);

    const softFillLight = new THREE.PointLight(0xffecc7, 1.2, 10);
    softFillLight.position.set(0, 2, 3);
    scene.add(softFillLight);

    // Book Group
    const bookGroup = new THREE.Group();
    bookGroupRef.current = bookGroup;
    scene.add(bookGroup);

    // Book dimensions
    const bookWidth = 2.4;
    const bookHeight = 3.2;
    const bookThickness = 0.38;

    // Materials
    const coverMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e3830, // Forest sage leather
      roughness: 0.55,
      metalness: 0.08,
    });

    const spineMaterial = new THREE.MeshStandardMaterial({
      color: 0x232c25,
      roughness: 0.6,
      metalness: 0.1,
    });

    const goldFoilMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold foil embossing
      roughness: 0.25,
      metalness: 0.85,
    });

    const pageEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6f0e6, // Warm deckled paper
      roughness: 0.9,
    });

    // 1. Back Cover
    const backCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, 0.04);
    const backCoverMesh = new THREE.Mesh(backCoverGeo, coverMaterial);
    backCoverMesh.position.set(0, 0, -bookThickness / 2);
    backCoverMesh.castShadow = true;
    backCoverMesh.receiveShadow = true;
    bookGroup.add(backCoverMesh);

    // 2. Front Cover
    const frontCoverGeo = new THREE.BoxGeometry(bookWidth, bookHeight, 0.04);
    const frontCoverMesh = new THREE.Mesh(frontCoverGeo, coverMaterial);
    frontCoverMesh.position.set(0, 0, bookThickness / 2);
    frontCoverMesh.castShadow = true;
    frontCoverMesh.receiveShadow = true;
    bookGroup.add(frontCoverMesh);

    // 3. Pages Block
    const pagesGeo = new THREE.BoxGeometry(bookWidth - 0.08, bookHeight - 0.1, bookThickness - 0.05);
    const pagesMesh = new THREE.Mesh(pagesGeo, pageEdgeMaterial);
    pagesMesh.position.set(0.04, 0, 0);
    pagesMesh.castShadow = true;
    pagesMesh.receiveShadow = true;
    bookGroup.add(pagesMesh);

    // 4. Curved Leather Spine
    const spineGeo = new THREE.CylinderGeometry(bookThickness / 2, bookThickness / 2, bookHeight, 16, 1, false, Math.PI / 2, Math.PI);
    const spineMesh = new THREE.Mesh(spineGeo, spineMaterial);
    spineMesh.rotation.z = Math.PI / 2;
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(-bookWidth / 2, 0, 0);
    spineMesh.castShadow = true;
    bookGroup.add(spineMesh);

    // 5. Gold Foil Emblem on Cover
    const emblemGeo = new THREE.TorusGeometry(0.35, 0.02, 16, 32);
    const emblemMesh = new THREE.Mesh(emblemGeo, goldFoilMaterial);
    emblemMesh.position.set(0, 0.35, bookThickness / 2 + 0.025);
    bookGroup.add(emblemMesh);

    const emblemStarGeo = new THREE.OctahedronGeometry(0.12);
    const emblemStarMesh = new THREE.Mesh(emblemStarGeo, goldFoilMaterial);
    emblemStarMesh.position.set(0, 0.35, bookThickness / 2 + 0.025);
    bookGroup.add(emblemStarMesh);

    // 6. Silk Ribbon Bookmark
    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x9e473e, // Deep terracotta crimson silk
      roughness: 0.4,
    });
    const ribbonGeo = new THREE.BoxGeometry(0.1, 1.2, 0.015);
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMaterial);
    ribbonMesh.position.set(0.2, -bookHeight / 2 - 0.25, 0.05);
    ribbonMesh.rotation.z = -0.15;
    ribbonMesh.rotation.y = 0.1;
    bookGroup.add(ribbonMesh);

    // 7. Ground / Desk subtle shadow receiver
    const deskGeo = new THREE.PlaneGeometry(16, 16);
    const deskMat = new THREE.ShadowMaterial({ opacity: 0.08 });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -1.8;
    deskMesh.receiveShadow = true;
    scene.add(deskMesh);

    // Ambient floating golden dust particles
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = (Math.random() - 0.5) * 6;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xecd599,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Initial position & tilt
    bookGroup.rotation.x = 0.32;
    bookGroup.rotation.y = -0.42;
    bookGroup.rotation.z = 0.08;
    bookGroup.position.set(0, 0.1, 0);

    // Interactive mouse / touch tracking
    let targetRotX = 0.32;
    let targetRotY = -0.42;
    let isHovered = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = -0.42 + x * 0.45;
      targetRotX = 0.32 - y * 0.35;
      isHovered = true;
    };

    const handleMouseLeave = () => {
      targetRotX = 0.32;
      targetRotY = -0.42;
      isHovered = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (bookGroupRef.current) {
        // Smooth interpolation to target rotation
        bookGroupRef.current.rotation.x += (targetRotX - bookGroupRef.current.rotation.x) * 0.06;
        bookGroupRef.current.rotation.y += (targetRotY - bookGroupRef.current.rotation.y) * 0.06;

        // Gentle floating breathing animation
        const floatOffset = Math.sin(elapsedTime * 1.5) * 0.05;
        bookGroupRef.current.position.y = 0.1 + floatOffset;
      }

      // Gentle particle drift
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += Math.sin(elapsedTime + i) * 0.002;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#fbf9f5] via-[#f7f3eb] to-[#efe9dd] border border-[#e8dfd1] shadow-inner">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onClick={onOpenBook}
        className="w-full h-full cursor-pointer"
        title="Click to open 3D Journal"
      />

      {/* Floating 3D Book Label & Open Invitation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center text-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-[#dfd5c5] shadow-md text-xs font-medium text-[#4a584e] tracking-wide animate-pulse">
          <span>✨</span>
          <span>Click to Open Journal & Flip Pages</span>
          <span className="text-[#a49a88]">•</span>
          <span className="text-[#877c6b]">{entries.length} Entries Preserved</span>
        </div>
        {activeEntry && (
          <p className="mt-2 text-xs font-serif italic text-[#7c7365] max-w-xs truncate">
            Latest: "{activeEntry.title || 'Untitled reflection'}"
          </p>
        )}
      </div>
    </div>
  );
};
