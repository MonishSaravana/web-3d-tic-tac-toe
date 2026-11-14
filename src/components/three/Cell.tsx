// 3D Cell Component
// Individual cell in the 3x3x3 grid with hover and click interaction
// No visible outline by default - only shows on hover/selection

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Mesh } from 'three';
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
    const [localHover, setLocalHover] = useState(false);

    const cellSize = 1.1; // Slightly larger for easier clicking
    const visualSize = 0.9; // Visual size for hover effect

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

    // Only show visual effect when hovered, selected, or winning
    const shouldShowVisual = isHovered || isSelected || isWinningCell || (localHover && isValidTarget);

    // Determine color based on state
    const getColor = () => {
        if (isWinningCell) return '#22c55e';
        if (isTakeoverTarget) return '#ef4444';
        return '#ffffff';
    };

    const getOpacity = () => {
        if (isWinningCell) return 0.3;
        if (isSelected) return 0.38;
        if (isHovered) return 0.2;
        if (localHover) return 0.12;
        return 0;
    };

    return (
        <group position={worldPosition}>
            {/* Translucent fill shown only on hover/select/win */}
            {shouldShowVisual && (
                <mesh ref={meshRef}>
                    <boxGeometry args={[visualSize, visualSize, visualSize]} />
                    <meshBasicMaterial
                        color={getColor()}
                        transparent
                        opacity={getOpacity()}
                    />
                </mesh>
            )}

            {/* Invisible hitbox for interaction - always present */}
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

// Classic 3D Tic-Tac-Toe Grid Lines
// Just the dividing lines like a "#" shape extended into 3D
interface TicTacToeGridProps {
    spacing: number;
    lineThickness?: number;
}

export function TicTacToeGrid({ spacing, lineThickness = 0.035 }: TicTacToeGridProps) {
    // Grid dimensions
    const totalSize = spacing * 3;
    const halfTotal = totalSize / 2;

    // Line positions (at 1/3 and 2/3 of the grid)
    const linePos1 = -spacing / 2;
    const linePos2 = spacing / 2;

    // Create cylinder-based lines for better visibility
    const lines: Array<{
        key: string;
        position: [number, number, number];
        rotation: [number, number, number];
        length: number;
    }> = [];

    // Vertical pillars (Y-axis) - 4 pillars at the internal intersections
    const pillarPositions = [
        [linePos1, linePos1],
        [linePos1, linePos2],
        [linePos2, linePos1],
        [linePos2, linePos2],
    ];

    for (const [x, z] of pillarPositions) {
        lines.push({
            key: `pillar-${x}-${z}`,
            position: [x, 0, z],
            rotation: [0, 0, 0],
            length: totalSize,
        });
    }

    // Horizontal lines along X-axis (at each y level, 2 lines per level)
    for (let yIdx = -1; yIdx <= 1; yIdx++) {
        const y = yIdx * spacing;
        // Lines at z = linePos1 and z = linePos2
        for (const z of [linePos1, linePos2]) {
            lines.push({
                key: `x-line-${yIdx}-${z}`,
                position: [0, y, z],
                rotation: [0, 0, Math.PI / 2],
                length: totalSize,
            });
        }
    }

    // Horizontal lines along Z-axis (at each y level, 2 lines per level)
    for (let yIdx = -1; yIdx <= 1; yIdx++) {
        const y = yIdx * spacing;
        // Lines at x = linePos1 and x = linePos2
        for (const x of [linePos1, linePos2]) {
            lines.push({
                key: `z-line-${yIdx}-${x}`,
                position: [x, y, 0],
                rotation: [Math.PI / 2, 0, 0],
                length: totalSize,
            });
        }
    }

    return (
        <group>
            {lines.map(({ key, position, rotation, length }) => (
                <mesh key={key} position={position} rotation={rotation}>
                    <cylinderGeometry args={[lineThickness, lineThickness, length, 8]} />
                    <meshStandardMaterial
                        color="#9aa4b6"
                        emissive="#2d3340"
                        emissiveIntensity={0.9}
                        metalness={0.1}
                        roughness={0.55}
                    />
                </mesh>
            ))}
        </group>
    );
}

// Keep the old GridLines for backwards compatibility but mark as deprecated
export function GridLines({ spacing }: { spacing: number; size?: number }) {
    return <TicTacToeGrid spacing={spacing} />;
}
