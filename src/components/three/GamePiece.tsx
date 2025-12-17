// 3D Game Piece Component
// Renders different shapes for each player

'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MeshStandardMaterial } from 'three';
import { PlayerNumber, PieceType, DEFAULT_PIECES } from '@/lib/game/types';

interface GamePieceProps {
    player: PlayerNumber;
    position: [number, number, number];
    isWinning?: boolean;
    isNew?: boolean;
    onClick?: () => void;
}

export function GamePiece({
    player,
    position,
    isWinning = false,
    isNew = false,
    onClick
}: GamePieceProps) {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const config = DEFAULT_PIECES[player];
    const baseScale = 0.35;

    // Animate rotation and scale
    useFrame((state, delta) => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.y += delta * 0.5;

            // Winning pulse effect
            if (isWinning) {
                const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.05 + 1;
                meshRef.current.scale.setScalar(baseScale * pulse);
            }

            // New piece entrance animation
            if (isNew && meshRef.current.scale.x < baseScale) {
                const newScale = Math.min(meshRef.current.scale.x + delta * 2, baseScale);
                meshRef.current.scale.setScalar(newScale);
            }
        }
    });

    // Render the appropriate shape based on piece type
    const renderShape = () => {
        const materialProps = {
            color: config.color,
            emissive: isWinning ? config.color : (config.emissive || '#000000'),
            emissiveIntensity: isWinning ? 0.5 : 0.1,
            metalness: 0.3,
            roughness: 0.4,
        };

        switch (config.type) {
            case 'sphere':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            case 'cube':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        rotation={[Math.PI / 4, Math.PI / 4, 0]}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <boxGeometry args={[1.4, 1.4, 1.4]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            case 'octahedron':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <octahedronGeometry args={[1, 0]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            case 'torus':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        rotation={[Math.PI / 2, 0, 0]}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <torusGeometry args={[0.7, 0.3, 16, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            case 'cone':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <coneGeometry args={[0.8, 1.6, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            case 'cylinder':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <cylinderGeometry args={[0.6, 0.6, 1.2, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );

            default:
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                    >
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                );
        }
    };

    return renderShape();
}

// Preview piece for hovering over empty cells
interface GhostPieceProps {
    player: PlayerNumber;
    position: [number, number, number];
    isTakeover?: boolean;
}

export function GhostPiece({ player, position, isTakeover = false }: GhostPieceProps) {
    const meshRef = useRef<Mesh>(null);
    const config = DEFAULT_PIECES[player];
    const baseScale = 0.3;

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime;
            // Subtle floating animation
            const float = Math.sin(state.clock.elapsedTime * 2) * 0.05;
            meshRef.current.position.y = position[1] + float;
        }
    });

    const materialProps = {
        color: isTakeover ? '#ff4444' : config.color,
        transparent: true,
        opacity: 0.4,
        wireframe: true,
    };

    switch (config.type) {
        case 'sphere':
            return (
                <mesh ref={meshRef} position={position} scale={baseScale}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );

        case 'cube':
            return (
                <mesh ref={meshRef} position={position} scale={baseScale} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
                    <boxGeometry args={[1.4, 1.4, 1.4]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );

        case 'octahedron':
            return (
                <mesh ref={meshRef} position={position} scale={baseScale}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );

        default:
            return (
                <mesh ref={meshRef} position={position} scale={baseScale}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial {...materialProps} />
                </mesh>
            );
    }
}
