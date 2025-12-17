// 3D Cell Component
// Individual cell in the 3x3x3 grid with hover and click interaction

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Mesh, BoxGeometry, EdgesGeometry, LineSegments } from 'three';
import { Position } from '@/lib/game/types';

interface CellProps {
    position: Position;
    worldPosition: [number, number, number];
    isEmpty: boolean;
    isHovered: boolean;
    isSelected: boolean;
    isValidTarget: boolean;
    isTakeoverTarget: boolean;
    isWinningCell: boolean;
    onHover: (position: Position | null) => void;
    onClick: (position: Position) => void;
}

export function Cell({
    position,
    worldPosition,
    isEmpty,
    isHovered,
    isSelected,
    isValidTarget,
    isTakeoverTarget,
    isWinningCell,
    onHover,
    onClick,
}: CellProps) {
    const meshRef = useRef<Mesh>(null);
    const edgesRef = useRef<LineSegments>(null);
    const [localHover, setLocalHover] = useState(false);

    const cellSize = 1;
    const padding = 0.05;
    const innerSize = cellSize - padding * 2;

    // Determine cell appearance based on state
    const getColor = () => {
        if (isWinningCell) return 'rgba(34, 197, 94, 0.3)'; // green
        if (isSelected) return 'rgba(255, 255, 255, 0.2)';
        if (isTakeoverTarget && isHovered) return 'rgba(239, 68, 68, 0.2)'; // red
        if (isHovered && isEmpty) return 'rgba(255, 255, 255, 0.1)';
        return 'transparent';
    };

    const getEdgeColor = () => {
        if (isWinningCell) return '#22c55e';
        if (isSelected) return '#ffffff';
        if (isTakeoverTarget && isHovered) return '#ef4444';
        if (isHovered && isValidTarget) return '#ffffff';
        if (localHover && isValidTarget) return 'rgba(255, 255, 255, 0.5)';
        return 'rgba(255, 255, 255, 0.1)';
    };

    const handlePointerEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setLocalHover(true);
        if (isValidTarget || isTakeoverTarget) {
            onHover(position);
        }
    }, [position, isValidTarget, isTakeoverTarget, onHover]);

    const handlePointerLeave = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setLocalHover(false);
        onHover(null);
    }, [onHover]);

    const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (isValidTarget || isTakeoverTarget) {
            onClick(position);
        }
    }, [position, isValidTarget, isTakeoverTarget, onClick]);

    // Animate winning cells
    useFrame((state) => {
        if (meshRef.current && isWinningCell) {
            const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.02 + 1;
            meshRef.current.scale.setScalar(pulse);
        }
    });

    const shouldShowFill = isHovered || isSelected || isWinningCell;
    const opacity = isEmpty ? 0.8 : 0.4;

    return (
        <group position={worldPosition}>
            {/* Cell fill (shown on hover/select/win) */}
            {shouldShowFill && (
                <mesh ref={meshRef}>
                    <boxGeometry args={[innerSize, innerSize, innerSize]} />
                    <meshBasicMaterial
                        color={isWinningCell ? '#22c55e' : isTakeoverTarget ? '#ef4444' : '#ffffff'}
                        transparent
                        opacity={isWinningCell ? 0.2 : 0.08}
                    />
                </mesh>
            )}

            {/* Cell edges/wireframe */}
            <lineSegments>
                <edgesGeometry args={[new BoxGeometry(innerSize, innerSize, innerSize)]} />
                <lineBasicMaterial
                    color={getEdgeColor()}
                    transparent
                    opacity={opacity}
                    linewidth={1}
                />
            </lineSegments>

            {/* Invisible hitbox for interaction */}
            <mesh
                visible={false}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onClick={handleClick}
            >
                <boxGeometry args={[cellSize, cellSize, cellSize]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}

// Grid lines connecting cells
interface GridLinesProps {
    spacing: number;
    size: number;
}

export function GridLines({ spacing, size }: GridLinesProps) {
    const halfSize = (size * spacing) / 2 - spacing / 2;

    // Generate all line segments
    const lineSegments: Array<{ key: string; start: [number, number, number]; end: [number, number, number] }> = [];

    // Vertical pillars
    for (let x = 0; x <= size; x++) {
        for (let z = 0; z <= size; z++) {
            const xPos = x * spacing - halfSize - spacing / 2;
            const zPos = z * spacing - halfSize - spacing / 2;
            lineSegments.push({
                key: `pillar-${x}-${z}`,
                start: [xPos, -halfSize - spacing / 2, zPos],
                end: [xPos, halfSize + spacing / 2, zPos],
            });
        }
    }

    // X-axis lines
    for (let y = 0; y <= size; y++) {
        for (let z = 0; z <= size; z++) {
            const yPos = y * spacing - halfSize - spacing / 2;
            const zPos = z * spacing - halfSize - spacing / 2;
            lineSegments.push({
                key: `x-${y}-${z}`,
                start: [-halfSize - spacing / 2, yPos, zPos],
                end: [halfSize + spacing / 2, yPos, zPos],
            });
        }
    }

    // Z-axis lines
    for (let y = 0; y <= size; y++) {
        for (let x = 0; x <= size; x++) {
            const yPos = y * spacing - halfSize - spacing / 2;
            const xPos = x * spacing - halfSize - spacing / 2;
            lineSegments.push({
                key: `z-${y}-${x}`,
                start: [xPos, yPos, -halfSize - spacing / 2],
                end: [xPos, yPos, halfSize + spacing / 2],
            });
        }
    }

    return (
        <group>
            {lineSegments.map(({ key, start, end }) => (
                <line key={key}>
                    <bufferGeometry>
                        <float32BufferAttribute
                            attach="attributes-position"
                            args={[new Float32Array([...start, ...end]), 3]}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="white" transparent opacity={0.06} />
                </line>
            ))}
        </group>
    );
}

