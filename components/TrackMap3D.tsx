/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Driver } from '../types';

interface TrackMapProps {
  drivers: Driver[];
  heroId: string;
  circuitId: string;
  isRunning: boolean;
}


interface CircuitData {
    trackPoints: THREE.Vector3[];
    pitLanePoints: THREE.Vector3[];
}

// Helper to create points
const v3 = (x: number, z: number) => new THREE.Vector3(x, 0, z);

// High Fidelity Track Geometry - Flat (Y=0)
const getCircuitData = (id: string): CircuitData => {
    const scale = 2.5;
    let rawTrack: THREE.Vector3[] = [];
    let rawPit: THREE.Vector3[] = [];

    switch (id) {
        case 'monza':
            // Clockwise
            // Start/Finish Straight is vertical. Going 'Up' (-Z) visually or 'Down' (+Z). 
            // Let's standard: Start (0, 0), going Z- (North)
            rawTrack = [
                v3(0, 0), // SF Line
                v3(0, -20), // Main Straight End
                v3(2, -22), v3(-1, -24), v3(0, -26), // T1/T2 Rettifilo (Right-Left)
                v3(8, -35), // Curva Grande (Long Right)
                v3(10, -45), v3(8, -47), v3(10, -49), // Roggia (Left-Right)
                v3(12, -45), v3(15, -40), // Lesmo 1 & 2
                v3(12, -20), // Serraglio
                v3(10, -5), v3(14, -2), v3(12, 2), // Ascari (Left-Right-Left)
                v3(12, 15), // Back Straight
                v3(8, 25), v3(0, 20), // Parabolica (Long Right 180)
                v3(0, 0) // Finish
            ];
            // Pit Lane: Right side of main straight.
            // Entry: After Parabolica (before SF). Exit: After T1/T2 (technically re-joins at Curva Grande in real life, but usually T1 exit for visuals)
            // Visually: Parallel to Segment (0, 20) -> (0, -20)
            rawPit = [
                v3(0.5, 18), // Entry (Inside Parabolica exit)
                v3(2, 15),   // Pit Lane Start
                v3(2, 0),    // Pit Box Area
                v3(2, -15),  // Pit Lane End
                v3(1, -18)   // Merge before T1/T2 for simplicity or after
            ];
            break;

        case 'spa':
            // Clockwise
            // La Source is T1 (Hairpin Right). SF is before it.
            rawTrack = [
                v3(0, 0), // SF Line
                v3(0, -5), // Towards La Source
                v3(3, -8), v3(1, -10), // La Source (Hairpin Right)
                v3(-2, -5), // Downhill
                v3(-3, 0), v3(-1, 5), v3(0, 8), // Eau Rouge / Raidillon (Left-Right-Left)
                v3(2, 20), // Kemmel Straight
                v3(5, 25), v3(3, 27), // Les Combes (Right-Left)
                v3(5, 23), // Malmedy
                v3(10, 20), // Bruxelles (Long Right)
                v3(15, 25), // Pouhon (Double Left - approximated as wide left)
                v3(20, 20), // Fagnes
                v3(22, 15), // Stavelot
                v3(15, 5), // Blanchimont (Fast Left)
                v3(5, -2), // Bus Stop Entry
                v3(2, -4), v3(0, -2), // Bus Stop Chicane (Right-Left)
                v3(0, 0)
            ];
            // Pit Lane: Right side of SF straight (Inside)
            // Entry: Before Bus Stop. Exit: After La Source.
            // Simplified: Parallel to SF straight.
            rawPit = [
                v3(3, -3), // Entry from Bus Stop
                v3(2, 0), // Pit Box
                v3(2, -8), // Exit after La Source
                v3(1.5, -9) // Merge
            ];
            break;

        case 'suzuka':
             // Figure 8. Clockwise mostly.
             // SF Straight
             rawTrack = [
                 v3(0, 0), // SF
                 v3(0, -10), // Towards T1
                 v3(5, -15), // T1/T2 (Right)
                 v3(10, -10), v3(15, -15), v3(20, -10), // S Curves (Left-Right-Left-Right)
                 v3(25, -15), // Dunlop
                 v3(30, -20), v3(30, -25), // Degner 1 & 2
                 v3(20, -25), // Under the bridge
                 v3(15, -30), v3(15, -35), v3(20, -32), // Hairpin
                 v3(30, -15), // Spoon Entry
                 v3(35, -10), v3(30, -5), // Spoon Exit
                 v3(20, -10), // Over the bridge (Crossover)
                 v3(5, -5), // 130R
                 v3(2, -8), v3(0, -5), // Casio Triangle (Chicane)
                 v3(0, 0)
             ];
             // Pit Lane: Right side of SF.
             rawPit = [
                 v3(1, -6), // Entry Casio
                 v3(3, -5), // Lane
                 v3(3, -10), // Lane
                 v3(2, -12) // Exit T1
             ];
             break;

        case 'bahrain':
            // Clockwise
            // SF Straight
            rawTrack = [
                v3(0, 0), // SF
                v3(0, -15), // Main Straight
                v3(3, -18), v3(0, -20), // T1 (Tight Right)
                v3(-5, -15), // T2/T3
                v3(-2, -10), // Straight to T4
                v3(2, -10), // T4
                v3(5, -5), v3(8, -8), v3(5, -12), // Esses (5,6,7)
                v3(2, -15), // T8
                v3(0, -18), // T9/10 (Tight Left)
                v3(-5, -25), // Back Straight
                v3(-10, -20), // T13
                v3(-5, -5), // T14/15 Main Straight entry
                v3(0, 0)
            ];
            // Pit Lane: Right side of SF.
            rawPit = [
                v3(-3, -3), // Entry
                v3(-2, 0), // Pit Lane
                v3(-2, -15), // Pit Lane
                v3(-1, -17) // Exit
            ];
            break;

        case 'cota':
             // Anti-Clockwise
             // SF Straight
             rawTrack = [
                 v3(0, 0), // SF
                 v3(0, -10), // Uphill to T1
                 v3(-5, -12), // T1 (Sharp Left)
                 v3(-5, -5), // T2
                 v3(-2, -2), v3(2, -5), v3(-2, -8), v3(2, -11), // Esses (Snake)
                 v3(5, -20), // Back Straight
                 v3(0, -25), // T12 (Sharp Left)
                 v3(-5, -20), v3(-8, -22), v3(-10, -20), // Stadium Section
                 v3(-5, -15), // Long Right (Carousel)
                 v3(0, -5), // Final Turns
                 v3(0, 0)
             ];
             // Pit Lane: Right side of track (Inside).
             rawPit = [
                 v3(-1, -3), // Entry
                 v3(2, -5), // Pit Lane
                 v3(2, -10), // Pit Lane
                 v3(0, -11) // Exit T1
             ];
             break;
        
        case 'monaco':
             // Clockwise
             rawTrack = [
                 v3(0, 0), // SF
                 v3(2, -5), // Ste Devote
                 v3(0, -10), // Beau Rivage
                 v3(-2, -12), // Massenet
                 v3(0, -15), // Casino
                 v3(2, -12), // Mirabeau
                 v3(3, -11), // Hairpin
                 v3(2, -8), // Portier
                 v3(0, -8), // Tunnel
                 v3(-5, -9), // Chicane
                 v3(-6, -5), // Tabac
                 v3(-4, -2), // Swimming Pool 1
                 v3(-2, 0), // Swimming Pool 2
                 v3(-2, 2), // Rascasse
                 v3(0, 2), // Antony Noghes
                 v3(0, 0)
             ];
             // Pit Lane: Right side (Inside). Reverse logic visually on map usually?
             // It's after La Rascasse, exits after Ste Devote.
             rawPit = [
                 v3(-1, 2), // Entry Rascasse
                 v3(1, 0), // Pit Lane
                 v3(3, -4) // Exit Ste Devote
             ];
             break;

        default:
             // Circle
             for(let i=0; i<30; i++) {
                 const angle = (i/30) * Math.PI * 2;
                 rawTrack.push(v3(Math.cos(angle)*15, Math.sin(angle)*10));
             }
             rawTrack.push(rawTrack[0]);
             // Pit Lane (Chord)
             rawPit = [
                 v3(12, 5),
                 v3(10, 0),
                 v3(12, -5)
             ];
             break;
    }

    // Centering correction (optional but helps visualization)
    const center = new THREE.Vector3();
    rawTrack.forEach(p => center.add(p));
    center.divideScalar(rawTrack.length);
    
    const centeredTrack = rawTrack.map(p => p.sub(center).multiplyScalar(scale));
    // Apply same center/scale to pit
    const centeredPit = rawPit.map(p => p.sub(center).multiplyScalar(scale));

    return { 
        trackPoints: centeredTrack, 
        pitLanePoints: centeredPit 
    };
};

const generateCurve = (points: THREE.Vector3[], closed: boolean) => {
  return new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.15);
};

const TrackMesh = ({ curve }: { curve: THREE.CatmullRomCurve3 }) => {
  return (
    <group>
        {/* The Neon Track Tube */}
        <mesh>
            {/* Flattened tube by using low tubular segments or scaling geometry? 
                TubeGeometry generates a round tube. 
                For a flat track, we can scale the mesh on Y axis.
            */}
            <tubeGeometry args={[curve, 400, 0.6, 8, true]} />
            <meshStandardMaterial 
                color="#171717" 
                emissive="#dc2626" 
                emissiveIntensity={0.2}
                roughness={0.6}
                metalness={0.5}
            />
        </mesh>
        {/* Track Edges/Kerbs simulation (Wireframe overlay) */}
        <mesh>
            <tubeGeometry args={[curve, 400, 0.65, 3, true]} />
            <meshBasicMaterial color="#404040" wireframe opacity={0.3} transparent />
        </mesh>
    </group>
  );
};

const PitLaneMesh = ({ curve }: { curve: THREE.CatmullRomCurve3 }) => {
    return (
      <group>
          <mesh>
              <tubeGeometry args={[curve, 64, 0.4, 4, false]} />
              <meshStandardMaterial 
                  color="#fbbf24" // Amber/Yellow for Pit
                  emissive="#fbbf24" 
                  emissiveIntensity={0.4}
              />
          </mesh>
          {/* Pit Entry/Exit Cones/Markers */}
          <mesh position={curve.getPointAt(0.05)}>
              <coneGeometry args={[0.5, 1, 8]} />
              <meshBasicMaterial color="orange" />
          </mesh>
          <mesh position={curve.getPointAt(0.95)}>
              <coneGeometry args={[0.5, 1, 8]} />
              <meshBasicMaterial color="green" />
          </mesh>
      </group>
    );
  };

interface DriverOrbProps {
  driver: Driver;
  curve: THREE.CatmullRomCurve3;
  pitCurve: THREE.CatmullRomCurve3;
  isHero: boolean;
  gapToLeader: number;
  totalLapTimeSec?: number;
  isRunning: boolean;
}

const DriverOrb: React.FC<DriverOrbProps> = ({ driver, curve, pitCurve, isHero, gapToLeader, totalLapTimeSec = 90, isRunning }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const progressRef = useRef(0); // Track % (0-1)
    const pitProgressRef = useRef(0); // Pit % (0-1)

    // Used to interpolate visual gap smoothness
    const targetGapRef = useRef(gapToLeader);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        targetGapRef.current = THREE.MathUtils.lerp(targetGapRef.current, gapToLeader, delta * 2);

        // Visual speed scale (Simulation runs at 45x speed approximately)
        // Lap takes ~4s in Sim (4000ms tick).
        const speed = 0.25; 
        
        if (isRunning) {
            if (driver.status === 'Pit') {
                // Pit Lane Traversal
                pitProgressRef.current += delta * speed; 
                if (pitProgressRef.current > 1) pitProgressRef.current = 1; 
            } else {
                // Track Traversal
                progressRef.current += delta * speed;
                pitProgressRef.current = 0;
            }
        }

        let position = new THREE.Vector3();
        let tangent = new THREE.Vector3();

        if (driver.status === 'Pit') {
            const t = Math.min(1, Math.max(0, pitProgressRef.current));
            position = pitCurve.getPointAt(t);
            tangent = pitCurve.getTangentAt(t);
        } else {
            // Main Track Logic
            const visualGap = targetGapRef.current / totalLapTimeSec; 
            
            let t = (progressRef.current - visualGap) % 1;
            if (t < 0) t += 1; 
            
            position = curve.getPointAt(t);
            tangent = curve.getTangentAt(t);
        }

        meshRef.current.position.copy(position);
        meshRef.current.position.y += 0.8; 
        meshRef.current.lookAt(position.clone().add(tangent));

        // Pulse hero light
        if (isHero && lightRef.current) {
            lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 5) * 1;
        }
    });

    const orbColor = isHero ? "#ffffff" : driver.color;
    const orbSize = isHero ? 1.5 : 0.9;

    return (
        <group>
             <mesh ref={meshRef}>
                {/* Use a flatter box/arrow shape for cars instead of just spheres? User asked for realism but spheres are abstract. 
                    Let's stick to spheres but maybe flatten them slightly to look like dots on a map. */}
                <sphereGeometry args={[orbSize, 16, 16]} />
                <meshStandardMaterial 
                    color={orbColor} 
                    emissive={orbColor}
                    emissiveIntensity={isHero ? 2 : 0.8}
                />
                {isHero && (
                   <pointLight ref={lightRef} color="#ffffff" distance={25} decay={2} />
                )}
             </mesh>
        </group>
    );
}

const TrackMap3D: React.FC<TrackMapProps> = ({ drivers, heroId, circuitId, isRunning }) => {
  const { trackPoints, pitLanePoints } = useMemo(() => getCircuitData(circuitId), [circuitId]);
  const curve = useMemo(() => generateCurve(trackPoints, true), [trackPoints]);
  const pitCurve = useMemo(() => generateCurve(pitLanePoints, false), [pitLanePoints]);

  return (
    <div className="w-full h-full bg-neutral-900 border-t-4 border-red-600 rounded-sm shadow-2xl relative overflow-hidden group">
      
      {/* Overlay UI */}
      <div className="absolute top-0 left-0 p-4 z-10 pointer-events-none w-full flex justify-between">
         <div>
            <h3 className="text-lg font-bold text-white uppercase italic tracking-widest skew-box">
                <span className="unskew block text-red-500">Holotable View</span>
            </h3>
            <span className="text-[10px] text-neutral-400 font-mono">LIVE OPTICAL TRACKING</span>
         </div>
         <div className="text-right">
             <div className="text-[10px] text-neutral-500 uppercase font-bold">Grid Floor</div>
             <div className="text-xs text-red-500 font-mono font-bold animate-pulse">ACTIVE</div>
         </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right">
         <div className="text-[10px] text-neutral-600 font-mono">
            R3F RENDER ENGINE<br/>
            THREE.JS r150<br/>
            MAP: {circuitId.toUpperCase()}
         </div>
      </div>

      <Canvas>
        {/* Adjusted Camera to be more top-down/isometric for better map view */}
        {/* @ts-ignore */}
        <PerspectiveCamera makeDefault position={[0, 100, 50]} fov={35} />
        <OrbitControls 
            enablePan={true} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={20} 
            maxDistance={300}
            autoRotate={isRunning}
            autoRotateSpeed={0.2} 
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <spotLight position={[0, 150, 0]} angle={0.8} penumbra={1} intensity={1} castShadow />
        <pointLight position={[20, 20, 20]} intensity={0.5} color="#ef4444" />
        
        {/* Environment */}
        <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <fog attach="fog" args={['#0a0a0a', 50, 250]} />

        {/* The Track */}
        <TrackMesh curve={curve} />
        <PitLaneMesh curve={pitCurve} />
        
        {/* Grid Floor */}
        <gridHelper args={[500, 100, '#333333', '#111111']} position={[0, -2, 0]} />

        {/* Drivers */}
        {drivers.map(d => (
            <DriverOrb 
                key={d.id} 
                driver={d} 
                curve={curve} 
                pitCurve={pitCurve}
                isHero={d.id === heroId} 
                gapToLeader={d.gapToLeader}
                totalLapTimeSec={90} 
                isRunning={isRunning}
            />
        ))}

      </Canvas>
    </div>
  );
};

export default TrackMap3D;