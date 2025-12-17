// 3D Game Board Component
// The main 3x3x3 grid with all cells and pieces

'use client';

import { useMemo, useCallback } from 'react';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Cell, GridLines } from './Cell';
import { GamePiece, GhostPiece } from './GamePiece';
import {
    Board,
    Position,
    PlayerNumber,
    indexToPosition,
    positionToIndex
} from '@/lib/game/types';

interface GameBoardProps {
    board: Board;
    currentTurn: PlayerNumber;
    hoveredCell: Position | null;
    selectedCell: Position | null;
    winningLine: Position[] | null;
    isTakeoverMode: boolean;
    takeoversRemaining: number;
    onCellHover: (position: Position | null) => void;
    onCellClick: (position: Position) => void;
    disabled?: boolean;
}

// Convert grid position to world coordinates
function gridToWorld(pos: Position, spacing: number = 1.2): [number, number, number] {
    const offset = spacing; // Center the grid
    return [
        (pos.x - 1) * spacing,
        (pos.y - 1) * spacing,
        (pos.z - 1) * spacing,
    ];
}

function GameBoardScene({
    board,
    currentTurn,
    hoveredCell,
    selectedCell,
    winningLine,
    isTakeoverMode,
    takeoversRemaining,
    onCellHover,
    onCellClick,
    disabled = false,
}: GameBoardProps) {
    const spacing = 1.2;

    // Generate all cell positions
    const cells = useMemo(() => {
        const result: { position: Position; index: number }[] = [];
        for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
                for (let x = 0; x < 3; x++) {
                    const position = { x, y, z };
                    result.push({ position, index: positionToIndex(position) });
                }
            }
        }
        return result;
    }, []);

    // Check if a position is in the winning line
    const isWinningCell = useCallback((pos: Position) => {
        if (!winningLine) return false;
        return winningLine.some(wp => wp.x === pos.x && wp.y === pos.y && wp.z === pos.z);
    }, [winningLine]);

    // Check if cell is hovered
    const isCellHovered = useCallback((pos: Position) => {
        if (!hoveredCell) return false;
        return hoveredCell.x === pos.x && hoveredCell.y === pos.y && hoveredCell.z === pos.z;
    }, [hoveredCell]);

    // Check if cell is selected
    const isCellSelected = useCallback((pos: Position) => {
        if (!selectedCell) return false;
        return selectedCell.x === pos.x && selectedCell.y === pos.y && selectedCell.z === pos.z;
    }, [selectedCell]);

    // Determine valid targets
    const getValidTarget = useCallback((pos: Position): { isValid: boolean; isTakeover: boolean } => {
        if (disabled) return { isValid: false, isTakeover: false };

        const index = positionToIndex(pos);
        const cellValue = board[index];

        if (isTakeoverMode && takeoversRemaining > 0) {
            // In takeover mode, target opponent pieces
            return {
                isValid: cellValue !== null && cellValue !== currentTurn,
                isTakeover: true
            };
        } else {
            // Normal mode, target empty cells
            return {
                isValid: cellValue === null,
                isTakeover: false
            };
        }
    }, [board, currentTurn, isTakeoverMode, takeoversRemaining, disabled]);

    return (
        <>
            {/* Camera */}
            <PerspectiveCamera makeDefault position={[4, 4, 4]} fov={50} />

            {/* Controls */}
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={15}
                dampingFactor={0.05}
                rotateSpeed={0.5}
            />

            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />
            <pointLight position={[0, 5, 0]} intensity={0.3} />

            {/* Grid structure */}
            <GridLines spacing={spacing} size={3} />

            {/* Cells */}
            {cells.map(({ position, index }) => {
                const cellValue = board[index];
                const worldPos = gridToWorld(position, spacing);
                const { isValid, isTakeover } = getValidTarget(position);

                return (
                    <Cell
                        key={`cell-${index}`}
                        position={position}
                        worldPosition={worldPos}
                        isEmpty={cellValue === null}
                        isHovered={isCellHovered(position)}
                        isSelected={isCellSelected(position)}
                        isValidTarget={isValid && !isTakeover}
                        isTakeoverTarget={isValid && isTakeover}
                        isWinningCell={isWinningCell(position)}
                        onHover={onCellHover}
                        onClick={onCellClick}
                    />
                );
            })}

            {/* Game pieces */}
            {cells.map(({ position, index }) => {
                const cellValue = board[index];
                if (cellValue === null) return null;

                const worldPos = gridToWorld(position, spacing);

                return (
                    <GamePiece
                        key={`piece-${index}`}
                        player={cellValue}
                        position={worldPos}
                        isWinning={isWinningCell(position)}
                    />
                );
            })}

            {/* Ghost piece preview on hover */}
            {hoveredCell && !disabled && (
                (() => {
                    const index = positionToIndex(hoveredCell);
                    const cellValue = board[index];
                    const { isValid, isTakeover } = getValidTarget(hoveredCell);

                    if (isValid) {
                        const worldPos = gridToWorld(hoveredCell, spacing);
                        return (
                            <GhostPiece
                                player={currentTurn}
                                position={worldPos}
                                isTakeover={isTakeover}
                            />
                        );
                    }
                    return null;
                })()
            )}
        </>
    );
}

// Main exported component with Canvas wrapper
export function GameBoard(props: GameBoardProps) {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
            <Canvas
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <GameBoardScene {...props} />
            </Canvas>
        </div>
    );
}

// Standalone demo board for the home page
interface DemoBoardProps {
    autoRotate?: boolean;
}

export function DemoBoard({ autoRotate = true }: DemoBoardProps) {
    // Create a static demo board with some pieces
    const demoBoard: Board = Array(27).fill(null);
    demoBoard[13] = 1; // Center
    demoBoard[0] = 2;
    demoBoard[26] = 3;
    demoBoard[4] = 1;
    demoBoard[22] = 2;

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
            <Canvas
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={45} />
                <OrbitControls
                    autoRotate={autoRotate}
                    autoRotateSpeed={1}
                    enableZoom={false}
                    enablePan={false}
                />

                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={0.7} />

                <GridLines spacing={1.2} size={3} />

                {demoBoard.map((value, index) => {
                    if (value === null) return null;
                    const position = indexToPosition(index);
                    const worldPos = gridToWorld(position, 1.2);
                    return (
                        <GamePiece
                            key={`demo-piece-${index}`}
                            player={value}
                            position={worldPos}
                        />
                    );
                })}
            </Canvas>
        </div>
    );
}
