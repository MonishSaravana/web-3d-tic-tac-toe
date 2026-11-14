// 3D Game Piece Component
// Renders different shapes for each player

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { PlayerNumber, DEFAULT_PIECES } from '@/lib/game/types';

interface GamePieceProps {
    player: PlayerNumber;
    position: [number, number, number];
    isWinning?: boolean;
    isNew?: boolean;
    /** Fades pieces that are not part of the winning line. */
    dimmed?: boolean;
    onClick?: () => void;
}

export function GamePiece({
    player,
    position,
    isWinning = false,
    isNew = false,
    dimmed = false,
    onClick
}: GamePieceProps) {
    const meshRef = useRef<Mesh>(null);

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
            emissiveIntensity: isWinning ? 0.75 : 0.25,
            metalness: 0.25,
            roughness: 0.3,
            transparent: dimmed,
            opacity: dimmed ? 0.3 : 1,
        };

        switch (config.type) {
            case 'sphere':
                return (
                    <mesh
                        ref={meshRef}
                        position={position}
                        scale={isNew ? 0.01 : baseScale}
                        onClick={onClick}
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
    /** The move is armed and one more tap plays it — render it solidly. */
    armed?: boolean;
}

export function GhostPiece({ player, position, isTakeover = false, armed = false }: GhostPieceProps) {
    const meshRef = useRef<Mesh>(null);
    const config = DEFAULT_PIECES[player];
    const baseScale = armed ? 0.34 : 0.3;

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
        opacity: armed ? 0.72 : 0.4,
        wireframe: !armed,
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
