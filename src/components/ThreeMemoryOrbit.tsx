import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { JournalEntry, JournalPhoto } from '../types';
import { Eye, BookOpen, Calendar, MapPin, X } from 'lucide-react';

interface ThreeMemoryOrbitProps {
  entries: JournalEntry[];
  onOpenEntry: (entryId: string) => void;
}

interface OrbitMemoryItem {
  entryId: string;
  entryTitle: string;
  date: string;
  location?: string;
  photo: JournalPhoto;
  mood: string;
  mesh?: THREE.Mesh;
}

export const ThreeMemoryOrbit: React.FC<ThreeMemoryOrbitProps> = ({ entries, onOpenEntry }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMemory, setSelectedMemory] = useState<OrbitMemoryItem | null>(null);
  const itemsRef = useRef<OrbitMemoryItem[]>([]);
  const reqIdRef = useRef<number | null>(null);

  // Extract all photos with their parent entry context
  const memoryItems: OrbitMemoryItem[] = [];
  entries.forEach((e) => {
    e.photos.forEach((p) => {
      memoryItems.push({
        entryId: e.id,
        entryTitle: e.title || 'Untitled Reflection',
        date: e.date,
        location: e.location,
        photo: p,
        mood: e.mood,
      });
    });
  });

  itemsRef.current = memoryItems;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Ambient Lighting
    const ambient = new THREE.AmbientLight(0xfff6ea, 1.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Orbit Ring Track Visualizer
    const ringGeo = new THREE.TorusGeometry(3.6, 0.012, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xdfd4c4, transparent: true, opacity: 0.5 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    orbitGroup.add(ringMesh);

    const innerRingGeo = new THREE.TorusGeometry(2.4, 0.01, 16, 80);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, ringMat);
    innerRingMesh.rotation.x = Math.PI / 2.1;
    orbitGroup.add(innerRingMesh);

    // Texture loader for polaroid photo cards
    const textureLoader = new THREE.TextureLoader();
    const polaroidMeshes: { mesh: THREE.Group; item: OrbitMemoryItem; baseAngle: number; radius: number }[] = [];

    // Fallback if user has no photos yet
    const displayItems = memoryItems.length > 0 ? memoryItems : [
      {
        entryId: 'seed-1',
        entryTitle: 'Morning Sunlight in Courtyard',
        date: '2026-08-28',
        mood: 'peaceful',
        photo: {
          id: 'sample-1',
          url: 'https://images.unsplash.com/photo-1509783236416-c9ad59bae472?auto=format&fit=crop&w=800&q=80',
          caption: 'Morning Light',
          timestamp: Date.now()
        }
      },
      {
        entryId: 'seed-2',
        entryTitle: 'Handcrafted Journals & Fountain Ink',
        date: '2026-08-27',
        mood: 'inspired',
        photo: {
          id: 'sample-2',
          url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          caption: 'Tactile Notes',
          timestamp: Date.now()
        }
      },
      {
        entryId: 'seed-3',
        entryTitle: 'Coastline Salt Wind',
        date: '2026-08-26',
        mood: 'grateful',
        photo: {
          id: 'sample-3',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          caption: 'Tide Pools',
          timestamp: Date.now()
        }
      }
    ];

    displayItems.forEach((item, idx) => {
      const radius = idx % 2 === 0 ? 3.6 : 2.5;
      const angle = (idx / displayItems.length) * Math.PI * 2;

      const cardGroup = new THREE.Group();

      // Polaroid Paper Frame
      const paperGeo = new THREE.BoxGeometry(1.2, 1.45, 0.03);
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xfefdfa,
        roughness: 0.8,
        metalness: 0.05,
      });
      const paperMesh = new THREE.Mesh(paperGeo, paperMat);
      cardGroup.add(paperMesh);

      // Photo Quad
      const photoGeo = new THREE.PlaneGeometry(1.0, 1.0);
      textureLoader.load(
        item.photo.url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const photoMat = new THREE.MeshBasicMaterial({ map: tex });
          const photoMesh = new THREE.Mesh(photoGeo, photoMat);
          photoMesh.position.set(0, 0.12, 0.02);
          cardGroup.add(photoMesh);
        },
        undefined,
        () => {
          // Fallback pastel square
          const photoMat = new THREE.MeshStandardMaterial({ color: 0x9fb8ad });
          const photoMesh = new THREE.Mesh(photoGeo, photoMat);
          photoMesh.position.set(0, 0.12, 0.02);
          cardGroup.add(photoMesh);
        }
      );

      // Position along orbit
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(angle * 2) * 0.4;
      cardGroup.position.set(x, y, z);
      cardGroup.lookAt(0, y * 0.5, 0);
      cardGroup.rotation.z += (Math.random() - 0.5) * 0.2;

      // Attach metadata for raycasting
      paperMesh.userData = { itemIndex: idx };

      orbitGroup.add(cardGroup);
      polaroidMeshes.push({ mesh: cardGroup, item, baseAngle: angle, radius });
    });

    // Ambient floating dust particles
    const starCount = 60;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 12;
      starPositions[i + 1] = (Math.random() - 0.5) * 8;
      starPositions[i + 2] = (Math.random() - 0.5) * 12;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xc8b79b, size: 0.04, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Interactive Drag / Rotation
    let isDragging = false;
    let previousMouseX = 0;
    let autoRotateSpeed = 0.003;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMouseX;
        orbitGroup.rotation.y += deltaX * 0.006;
        previousMouseX = e.clientX;
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(orbitGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData && typeof hit.userData.itemIndex === 'number') {
          const item = displayItems[hit.userData.itemIndex];
          if (item) setSelectedMemory(item);
        }
      }
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('click', onClick);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (!isDragging) {
        orbitGroup.rotation.y += autoRotateSpeed;
      }

      // Gentle floating bob
      polaroidMeshes.forEach((p, idx) => {
        p.mesh.position.y += Math.sin(elapsed * 1.2 + idx) * 0.0015;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('click', onClick);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [memoryItems.length]);

  return (
    <div className="relative w-full h-[520px] md:h-[620px] select-none rounded-2xl overflow-hidden bg-gradient-to-b from-[#f9f7f2] via-[#f4eee3] to-[#ebe2d4] border border-[#e5dcce] shadow-inner">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Orbit Controls & Overlay Info */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#dfd5c5] shadow-xs text-xs font-medium text-[#4a584e]">
        <span className="w-2 h-2 rounded-full bg-[#4a6b5d] animate-ping" />
        <span>3D Memory Orbit</span>
        <span className="text-[#a49a88]">•</span>
        <span className="text-[#7d7362]">Drag to Rotate / Click Polaroid to View</span>
      </div>

      {/* Selected Memory Inspection Modal */}
      {selectedMemory && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white p-5 rounded-2xl border border-[#ded5c6] shadow-2xl">
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-[#7d7362] hover:bg-[#f5efe4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-2 bg-[#fdfcf9] border border-[#eee7da] rounded-xl shadow-xs">
              <img
                src={selectedMemory.photo.url}
                alt={selectedMemory.photo.caption || 'Memory Photo'}
                className="w-full h-48 object-cover rounded-lg"
              />
              {selectedMemory.photo.caption && (
                <p className="mt-2 text-center text-xs font-serif italic text-[#635a4d]">
                  "{selectedMemory.photo.caption}"
                </p>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-base font-serif font-semibold text-[#2c342f] leading-snug">
                {selectedMemory.entryTitle}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-[#7c7365]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedMemory.date}
                </span>
                {selectedMemory.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedMemory.location}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  onOpenEntry(selectedMemory.entryId);
                  setSelectedMemory(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#4a6b5d] text-white text-xs font-medium hover:bg-[#3d594d] transition-colors shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Read Full Journal
              </button>
              <button
                onClick={() => setSelectedMemory(null)}
                className="py-2.5 px-4 rounded-xl bg-[#f2ebe0] text-[#52493c] text-xs font-medium hover:bg-[#e7decff0] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
