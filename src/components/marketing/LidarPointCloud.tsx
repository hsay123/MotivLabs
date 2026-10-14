"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LidarPointCloudProps {
  className?: string;
  isInView?: boolean;
  prefersReducedMotion?: boolean;
}

/**
 * Generates a deterministic procedural point cloud representing a robotic
 * indoor spatial scan with recognizable structure (walls, floor, objects).
 */
function generatePointCloud(
  particleCount: number,
  seed: number = 42
): { positions: Float32Array; colors: Float32Array; sizes: Float32Array } {
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  // Seeded random for deterministic generation
  let randomSeed = seed;
  const random = () => {
    randomSeed = (randomSeed * 1664525 + 1013904223) % 4294967296;
    return randomSeed / 4294967296;
  };

  const limeColor = new THREE.Color("#C6FF00");
  const graphiteColor = new THREE.Color("#2D2D2D");
  const coolGrayColor = new THREE.Color("#6B7280");
  const warmGrayColor = new THREE.Color("#9CA3AF");

  const baseColors = [graphiteColor, coolGrayColor, warmGrayColor];

  for (let i = 0; i < particleCount; i++) {
    const u = random();
    const v = random();
    const w = random();

    // Generate structured point cloud: floor, walls, and objects
    let x: number, y: number, z: number;
    let colorChoice: number;
    let pointSize: number;

    // Distribution: 30% floor plane, 25% walls, 35% objects, 10% sparse scan lines
    if (u < 0.3) {
      // Floor plane (y = -1.5 to -1.2)
      x = (random() - 0.5) * 6;
      y = -1.5 + random() * 0.3;
      z = (random() - 0.5) * 6;
      colorChoice = 0; // graphite
      pointSize = 0.015 + random() * 0.01;
    } else if (u < 0.55) {
      // Walls (vertical planes)
      const wall = Math.floor(random() * 4);
      if (wall === 0) { // back wall
        x = (random() - 0.5) * 6;
        y = -1.5 + random() * 3;
        z = -3 + random() * 0.2;
      } else if (wall === 1) { // front wall
        x = (random() - 0.5) * 6;
        y = -1.5 + random() * 3;
        z = 3 - random() * 0.2;
      } else if (wall === 2) { // left wall
        x = -3 + random() * 0.2;
        y = -1.5 + random() * 3;
        z = (random() - 0.5) * 6;
      } else { // right wall
        x = 3 - random() * 0.2;
        y = -1.5 + random() * 3;
        z = (random() - 0.5) * 6;
      }
      colorChoice = random() < 0.5 ? 0 : 1; // graphite or cool gray
      pointSize = 0.012 + random() * 0.008;
    } else if (u < 0.9) {
      // Objects in the scene (boxes, cylinders - robotic platform, equipment)
      const objType = Math.floor(random() * 3);
      if (objType === 0) {
        // Robotic platform base (center-ish)
        x = (random() - 0.5) * 1.5;
        y = -1.3 + random() * 0.4;
        z = (random() - 0.5) * 1.5;
      } else if (objType === 1) {
        // Vertical equipment/rack
        x = -2 + random() * 0.8;
        y = -1.5 + random() * 2.5;
        z = -2 + random() * 0.8;
      } else {
        // Scattered debris/small objects
        x = (random() - 0.5) * 5;
        y = -1.4 + random() * 0.8;
        z = (random() - 0.5) * 5;
      }
      colorChoice = random() < 0.3 ? 0 : (random() < 0.6 ? 1 : 2);
      pointSize = 0.018 + random() * 0.015;
    } else {
      // Sparse scan lines - horizontal rings at different heights
      const ringHeight = -1.5 + random() * 3;
      const ringRadius = 0.5 + random() * 2.5;
      const angle = random() * Math.PI * 2;
      x = Math.cos(angle) * ringRadius;
      y = ringHeight + (random() - 0.5) * 0.05;
      z = Math.sin(angle) * ringRadius;
      colorChoice = 0;
      pointSize = 0.01 + random() * 0.005;
    }

    // Add some noise for realism
    x += (random() - 0.5) * 0.05;
    y += (random() - 0.5) * 0.05;
    z += (random() - 0.5) * 0.05;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Assign color with occasional lime accent (3% of points)
    const useLime = random() < 0.03;
    if (useLime) {
      colors[i * 3] = limeColor.r;
      colors[i * 3 + 1] = limeColor.g;
      colors[i * 3 + 2] = limeColor.b;
      pointSize *= 1.5; // slightly larger for accent points
    } else {
      const baseColor = baseColors[colorChoice];
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    sizes[i] = pointSize;
  }

  return { positions, colors, sizes };
}

/**
 * Inner point cloud component that renders with React Three Fiber
 */
function LidarPointCloudInner({
  particleCount = 15000,
  rotationSpeed = 0.05,
  prefersReducedMotion = false,
}: {
  particleCount?: number;
  rotationSpeed?: number;
  prefersReducedMotion?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { positions, colors, sizes } = useMemo(
    () => generatePointCloud(particleCount),
    [particleCount]
  );

  // Parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (prefersReducedMotion) return;

    const group = groupRef.current;
    if (!group) return;

    // Slow continuous rotation around Y axis
    group.rotation.y += delta * rotationSpeed;

    // Subtle floating motion
    group.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.03;

    // Subtle parallax based on mouse (desktop only)
    const targetX = mousePos.x * 0.15;
    const targetY = mousePos.y * 0.1;
    group.rotation.x += (targetY - group.rotation.x) * 0.02 * delta * 60;
    group.rotation.z += (targetX - group.rotation.z) * 0.02 * delta * 60;
  });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -2,
    });
  };

  const handlePointerLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <group ref={groupRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            usage={THREE.StaticDrawUsage}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            usage={THREE.StaticDrawUsage}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
            usage={THREE.StaticDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={1}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * Main LidarPointCloud component with Canvas wrapper
 */
export function LidarPointCloud({
  className = "",
  isInView = true,
  prefersReducedMotion = false,
}: LidarPointCloudProps) {
  const [webglError, setWebglError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render if not in view (performance) or WebGL failed
  if (!mounted || !isInView || webglError) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "400px",
          background: "linear-gradient(135deg, rgba(45,45,45,0.03) 0%, rgba(107,114,128,0.02) 100%)",
          borderRadius: "24px",
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        borderRadius: "24px",
        overflow: "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: [0, 0.5, 4.5], fov: 35 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <color attach="background" args={["#F8F9FA"]} />
        <fog attach="fog" args={["#F8F9FA", 2, 8]} />
        <LidarPointCloudInner
          particleCount={prefersReducedMotion ? 5000 : 15000}
          rotationSpeed={prefersReducedMotion ? 0 : 0.05}
          prefersReducedMotion={prefersReducedMotion}
        />
      </Canvas>
    </div>
  );
}

interface LidarPointCloudProps {
  className?: string;
  isInView?: boolean;
  prefersReducedMotion?: boolean;
}