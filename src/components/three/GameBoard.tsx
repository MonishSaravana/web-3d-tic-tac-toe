// The board. One view only: the cube, in 3D.
//
// Legibility comes from the scene, not from flattening it:
//   - the three layers are pushed apart vertically so nothing is hidden
//   - every empty cell carries a stud you can aim at
//   - each layer is labelled in space
//   - a drag that rotates the camera never counts as a click

'use client';

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import { Cell, TicTacToeGrid } from './Cell';
import { GamePiece, GhostPiece } from './GamePiece';
import {
    Board,
    Position,
    PlayerNumber,
    DEFAULT_PIECES,
    indexToPosition,
    positionToIndex,
} from '@/lib/game/types';

const SPACING = 1.2;
/** Vertical gap between layers. Wider than SPACING so you can see inside. */
const Y_SPACING = 1.85;

export const LAYER_NAMES = ['Bottom', 'Middle', 'Top'] as const;

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
    /** Fired when WebGL is unavailable or lost. */
    onContextLost?: () => void;
}

function gridToWorld(pos: Position): [number, number, number] {
    return [(pos.x - 1) * SPACING, (pos.y - 1) * Y_SPACING, (pos.z - 1) * SPACING];
}

/** A faint pad under each layer so the level reads as a surface. */
function LayerPads() {
    const size = SPACING * 3;
    return (
        <group>
            {[0, 1, 2].map(y => (
                <mesh
                    key={y}
                    position={[0, (y - 1) * Y_SPACING - 0.52, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[size, size]} />
                    <meshBasicMaterial
                        color="#5b6474"
                        transparent
                        opacity={0.06}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Layer names pinned in 3D space, so the stack is never ambiguous. */
function LayerLabels() {
    const width = useThree(state => state.size.width);

    // On a phone-sized canvas the labels would sit on top of the cube; the
    // readout under the board names the layer instead.
    if (width < 430) return null;

    return (
        <group>
            {[0, 1, 2].map(y => (
                <Html
                    key={y}
                    position={[-SPACING * 1.95, (y - 1) * Y_SPACING, SPACING * 1.75]}
                    center
                    distanceFactor={9}
                    zIndexRange={[10, 0]}
                    style={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '13px',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.45)',
                    }}
                >
                    {y + 1} {LAYER_NAMES[y]}
                </Html>
            ))}
        </group>
    );
}

function WinningBeam({ line, player }: { line: Position[]; player: PlayerNumber }) {
    const { position, quaternion, length } = useMemo(() => {
        const start = new Vector3(...gridToWorld(line[0]));
        const end = new Vector3(...gridToWorld(line[line.length - 1]));
        const dir = new Vector3().subVectors(end, start);
        const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
        const q = new Quaternion().setFromUnitVectors(
            new Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        return { position: mid, quaternion: q, length: dir.length() + 0.5 };
    }, [line]);

    return (
        <mesh position={position} quaternion={quaternion}>
            <cylinderGeometry args={[0.05, 0.05, length, 12]} />
            <meshBasicMaterial
                color={DEFAULT_PIECES[player].color}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
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

    const isWinningCell = useCallback(
        (pos: Position) =>
            !!winningLine &&
            winningLine.some(wp => wp.x === pos.x && wp.y === pos.y && wp.z === pos.z),
        [winningLine]
    );

    const samePos = (a: Position | null, b: Position) =>
        !!a && a.x === b.x && a.y === b.y && a.z === b.z;

    const getValidTarget = useCallback(
        (pos: Position): { isValid: boolean; isTakeover: boolean } => {
            if (disabled) return { isValid: false, isTakeover: false };

            const cellValue = board[positionToIndex(pos)];

            if (isTakeoverMode && takeoversRemaining > 0) {
                return {
                    isValid: cellValue !== null && cellValue !== currentTurn,
                    isTakeover: true,
                };
            }
            return { isValid: cellValue === null, isTakeover: false };
        },
        [board, currentTurn, isTakeoverMode, takeoversRemaining, disabled]
    );

    const winner = winningLine ? board[positionToIndex(winningLine[0])] : null;
    const turnColor = DEFAULT_PIECES[currentTurn].color;

    const canvasWidth = useThree(state => state.size.width);
    const compact = canvasWidth < 430;
    // Memoised so a hover re-render never snaps the camera back.
    const cameraPosition = useMemo<[number, number, number]>(
        () => (compact ? [4.5, 3.8, 4.5] : [5.2, 4.4, 5.2]),
        [compact]
    );

    return (
        <>
            <PerspectiveCamera makeDefault position={cameraPosition} fov={compact ? 48 : 44} />

            <OrbitControls
                enablePan={false}
                enableZoom
                enableRotate
                minDistance={4}
                maxDistance={14}
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.5}
                zoomSpeed={0.7}
                target={[0, 0, 0]}
                // Keep the pitch in the band where the three layers stay
                // separate: straight down stacks them on top of each other,
                // level with them flattens each one into a line.
                minPolarAngle={Math.PI * 0.22}
                maxPolarAngle={Math.PI * 0.38}
            />

            <ambientLight intensity={0.65} />
            <hemisphereLight args={['#dfe7ff', '#141821', 0.5]} />
            <directionalLight position={[8, 14, 6]} intensity={1.1} />
            <directionalLight position={[-8, -6, -6]} intensity={0.3} />

            <LayerPads />
            <TicTacToeGrid spacing={SPACING} ySpacing={Y_SPACING} />
            <LayerLabels />

            {cells.map(({ position, index }) => {
                const { isValid, isTakeover } = getValidTarget(position);

                return (
                    <Cell
                        key={`cell-${index}`}
                        position={position}
                        worldPosition={gridToWorld(position)}
                        isEmpty={board[index] === null}
                        isHovered={samePos(hoveredCell, position)}
                        isSelected={samePos(selectedCell, position)}
                        isValidTarget={isValid && !isTakeover}
                        isTakeoverTarget={isValid && isTakeover}
                        isWinningCell={isWinningCell(position)}
                        turnColor={turnColor}
                        onHover={onCellHover}
                        onClick={onCellClick}
                    />
                );
            })}

            {cells.map(({ position, index }) => {
                const cellValue = board[index];
                if (cellValue === null) return null;

                return (
                    <GamePiece
                        key={`piece-${index}`}
                        player={cellValue}
                        position={gridToWorld(position)}
                        isWinning={isWinningCell(position)}
                        dimmed={winningLine !== null && !isWinningCell(position)}
                    />
                );
            })}

            {winningLine && winner !== null && (
                <WinningBeam line={winningLine} player={winner} />
            )}

            {/* Preview of the move under the cursor. */}
            {(() => {
                const target = selectedCell ?? hoveredCell;
                if (!target || disabled) return null;
                const { isValid, isTakeover } = getValidTarget(target);
                if (!isValid) return null;
                return (
                    <GhostPiece
                        player={currentTurn}
                        position={gridToWorld(target)}
                        isTakeover={isTakeover}
                        armed={samePos(selectedCell, target)}
                    />
                );
            })()}
        </>
    );
}

export function GameBoard(props: GameBoardProps) {
    const { onContextLost, onCellClick } = props;
    const [failed, setFailed] = useState(false);
    const reported = useRef(false);

    // A rotate gesture must never place a piece.
    const dragged = useRef(false);
    const downAt = useRef<{ x: number; y: number } | null>(null);

    const report = useCallback(() => {
        if (reported.current) return;
        reported.current = true;
        setFailed(true);
        onContextLost?.();
    }, [onContextLost]);

    useEffect(() => {
        try {
            const probe = document.createElement('canvas');
            const gl =
                probe.getContext('webgl2') ||
                probe.getContext('webgl') ||
                probe.getContext('experimental-webgl');
            if (!gl) report();
        } catch {
            report();
        }
    }, [report]);

    const guardedClick = useCallback(
        (position: Position) => {
            if (dragged.current) return;
            onCellClick(position);
        },
        [onCellClick]
    );

    if (failed) {
        return null;
    }

    return (
        <div
            style={{ width: '100%', height: '100%', touchAction: 'none' }}
            onPointerDown={e => {
                dragged.current = false;
                downAt.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerMove={e => {
                if (!downAt.current) return;
                const dx = e.clientX - downAt.current.x;
                const dy = e.clientY - downAt.current.y;
                if (dx * dx + dy * dy > 36) dragged.current = true;
            }}
        >
            <Canvas
                gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
                dpr={[1, 2]}
                style={{ background: 'transparent' }}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener('webglcontextlost', event => {
                        event.preventDefault();
                        report();
                    });
                }}
            >
                <GameBoardScene {...props} onCellClick={guardedClick} />
            </Canvas>
        </div>
    );
}

/** Decorative board for the home page. */
export function DemoBoard({ autoRotate = true }: { autoRotate?: boolean }) {
    const demoBoard: Board = useMemo(() => {
        const b: Board = Array(27).fill(null);
        b[13] = 1;
        b[4] = 1;
        b[22] = 1;
        b[0] = 2;
        b[26] = 2;
        b[8] = 3;
        return b;
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '260px' }}>
            <Canvas
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 2]}
                style={{ background: 'transparent' }}
            >
                <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={42} />
                <OrbitControls
                    autoRotate={autoRotate}
                    autoRotateSpeed={0.9}
                    enableZoom={false}
                    enablePan={false}
                />

                <ambientLight intensity={0.7} />
                <hemisphereLight args={['#dfe7ff', '#141821', 0.5]} />
                <directionalLight position={[8, 14, 6]} intensity={1} />

                <LayerPads />
                <TicTacToeGrid spacing={SPACING} ySpacing={Y_SPACING} />

                {demoBoard.map((value, index) =>
                    value === null ? (
                        <mesh key={`dot-${index}`} position={gridToWorld(indexToPosition(index))}>
                            <sphereGeometry args={[0.055, 10, 10]} />
                            <meshBasicMaterial color="#ffffff" transparent opacity={0.28} />
                        </mesh>
                    ) : (
                        <GamePiece
                            key={`demo-piece-${index}`}
                            player={value}
                            position={gridToWorld(indexToPosition(index))}
                        />
                    )
                )}
            </Canvas>
        </div>
    );
}
