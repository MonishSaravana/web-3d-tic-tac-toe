// A single cell of the 3x3x3 grid.
//
// Every empty cell carries a visible stud. That is what makes the cube
// playable: without it you are guessing where the clickable volumes are. The
// stud grows and takes the current player's colour on hover, and the cell
// volume lights up behind it.

'use client';

import { useRef, useState, useCallback } from 'react';
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
    /** Colour of whoever is to move, used for the hover preview. */
    turnColor: string;
    cellSize?: number;
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
    turnColor,
    cellSize = 1.1,
    onHover,
    onClick,
}: CellProps) {
    const volumeRef = useRef<Mesh>(null);
    const studRef = useRef<Mesh>(null);
    const [localHover, setLocalHover] = useState(false);

    const active = isHovered || localHover;
    const playable = isValidTarget || isTakeoverTarget;

    const handlePointerEnter = useCallback(
        (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setLocalHover(true);
            if (playable) onHover(position);
        },
        [position, playable, onHover]
    );

    const handlePointerLeave = useCallback(
        (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setLocalHover(false);
            onHover(null);
        },
        [onHover]
    );

    const handleClick = useCallback(
        (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            if (playable) onClick(position);
        },
        [position, playable, onClick]
    );

    useFrame((state, delta) => {
        if (volumeRef.current && isWinningCell) {
            const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.03 + 1;
            volumeRef.current.scale.setScalar(pulse);
        }

        // Grow the stud toward the cursor so the target is unmistakable.
        if (studRef.current) {
            const target = active && isValidTarget ? 2.1 : 1;
            const current = studRef.current.scale.x;
            studRef.current.scale.setScalar(
                current + (target - current) * Math.min(1, delta * 12)
            );
        }
    });

    const showVolume = active || isSelected || isWinningCell;

    const volumeColor = isWinningCell
        ? '#22c55e'
        : isTakeoverTarget
            ? '#ef4444'
            : turnColor;

    const volumeOpacity = isWinningCell
        ? 0.3
        : isSelected
            ? 0.34
            : active && playable
                ? 0.2
                : active
                    ? 0.07
                    : 0;

    return (
        <group position={worldPosition}>
            {showVolume && (
                <mesh ref={volumeRef}>
                    <boxGeometry args={[0.92, 0.92, 0.92]} />
                    <meshBasicMaterial
                        color={volumeColor}
                        transparent
                        opacity={volumeOpacity}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* The stud: a visible, aimable marker in every empty cell. */}
            {isEmpty && (
                <mesh ref={studRef}>
                    <sphereGeometry args={[0.055, 12, 12]} />
                    <meshBasicMaterial
                        color={active && isValidTarget ? turnColor : '#ffffff'}
                        transparent
                        opacity={active && isValidTarget ? 0.95 : 0.3}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Invisible hitbox — slightly larger than the cell for easy aiming. */}
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

interface TicTacToeGridProps {
    spacing: number;
    /** Layers are pushed apart vertically so you can see inside the cube. */
    ySpacing?: number;
    lineThickness?: number;
}

/**
 * The lattice. Horizontal lines are drawn per layer so that raising ySpacing
 * separates the three boards instead of stretching one cube.
 */
export function TicTacToeGrid({
    spacing,
    ySpacing = spacing,
    lineThickness = 0.022,
}: TicTacToeGridProps) {
    const planSize = spacing * 3;
    const inner1 = -spacing / 2;
    const inner2 = spacing / 2;

    const lines: Array<{
        key: string;
        position: [number, number, number];
        rotation: [number, number, number];
        length: number;
        faint?: boolean;
    }> = [];

    // Vertical connectors between the layers, kept faint: they explain the
    // stacking without crowding the cells.
    for (const x of [inner1, inner2]) {
        for (const z of [inner1, inner2]) {
            lines.push({
                key: `pillar-${x}-${z}`,
                position: [x, 0, z],
                rotation: [0, 0, 0],
                length: ySpacing * 2,
                faint: true,
            });
        }
    }

    // Each layer gets its own "#" of lines.
    for (let level = -1; level <= 1; level++) {
        const y = level * ySpacing;

        for (const z of [inner1, inner2]) {
            lines.push({
                key: `x-${level}-${z}`,
                position: [0, y, z],
                rotation: [0, 0, Math.PI / 2],
                length: planSize,
            });
        }

        for (const x of [inner1, inner2]) {
            lines.push({
                key: `z-${level}-${x}`,
                position: [x, y, 0],
                rotation: [Math.PI / 2, 0, 0],
                length: planSize,
            });
        }
    }

    return (
        <group>
            {lines.map(({ key, position, rotation, length, faint }) => (
                <mesh key={key} position={position} rotation={rotation}>
                    <cylinderGeometry
                        args={[
                            faint ? lineThickness * 0.7 : lineThickness,
                            faint ? lineThickness * 0.7 : lineThickness,
                            length,
                            6,
                        ]}
                    />
                    <meshBasicMaterial
                        color="#9aa4b6"
                        transparent
                        opacity={faint ? 0.22 : 0.55}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** @deprecated kept for older imports */
export function GridLines({ spacing }: { spacing: number; size?: number }) {
    return <TicTacToeGrid spacing={spacing} />;
}
