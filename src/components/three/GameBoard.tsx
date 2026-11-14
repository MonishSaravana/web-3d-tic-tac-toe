// 3D board: the 3x3x3 grid, its pieces and the camera rig.

'use client';

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
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
    /** Fired when WebGL goes away so the page can fall back to the flat view. */
    onContextLost?: () => void;
}

function gridToWorld(pos: Position, spacing: number = SPACING): [number, number, number] {
    return [(pos.x - 1) * spacing, (pos.y - 1) * spacing, (pos.z - 1) * spacing];
}

/** Faint floor under each layer so the three levels read as levels. */
function LayerPlanes({ spacing = SPACING }: { spacing?: number }) {
    const size = spacing * 3;
    return (
        <group>
            {[0, 1, 2].map(y => (
                <mesh
                    key={y}
                    position={[0, (y - 1) * spacing - spacing * 0.5, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                >
                    <planeGeometry args={[size, size]} />
                    <meshBasicMaterial
                        color="#5b6474"
                        transparent
                        opacity={0.05}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/** Small marker in every empty cell — without these the cube looks unplayable. */
function EmptyMarkers({
    board,
    spacing = SPACING,
}: {
    board: Board;
    spacing?: number;
}) {
    const points = useMemo(() => {
        const out: [number, number, number][] = [];
        for (let i = 0; i < 27; i++) {
            if (board[i] === null) out.push(gridToWorld(indexToPosition(i), spacing));
        }
        return out;
    }, [board, spacing]);

    return (
        <group>
            {points.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.055, 10, 10]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
                </mesh>
            ))}
        </group>
    );
}

/** Glowing beam drawn through the three winning cells. */
function WinningBeam({
    line,
    player,
    spacing = SPACING,
}: {
    line: Position[];
    player: PlayerNumber;
    spacing?: number;
}) {
    const { position, quaternion, length } = useMemo(() => {
        const start = new Vector3(...gridToWorld(line[0], spacing));
        const end = new Vector3(...gridToWorld(line[line.length - 1], spacing));
        const dir = new Vector3().subVectors(end, start);
        const mid = new Vector3().addVectors(start, end).multiplyScalar(0.5);
        const q = new Quaternion().setFromUnitVectors(
            new Vector3(0, 1, 0),
            dir.clone().normalize()
        );
        return { position: mid, quaternion: q, length: dir.length() + 0.5 };
    }, [line, spacing]);

    return (
        <mesh position={position} quaternion={quaternion}>
            <cylinderGeometry args={[0.045, 0.045, length, 12]} />
            <meshBasicMaterial
                color={DEFAULT_PIECES[player].color}
                transparent
                opacity={0.75}
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

    return (
        <>
            <PerspectiveCamera makeDefault position={[4.4, 3.8, 4.4]} fov={46} />

            <OrbitControls
                enablePan={false}
                enableZoom
                enableRotate
                minDistance={3.5}
                maxDistance={12}
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.55}
                zoomSpeed={0.7}
            />

            <ambientLight intensity={0.6} />
            <hemisphereLight args={['#dfe7ff', '#141821', 0.55]} />
            <directionalLight position={[8, 12, 6]} intensity={1.1} />
            <directionalLight position={[-8, -6, -6]} intensity={0.35} />
            <pointLight position={[0, 0, 0]} intensity={0.45} distance={7} />

            <LayerPlanes />
            <TicTacToeGrid spacing={SPACING} />
            <EmptyMarkers board={board} />

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

            {/* Preview of the move under the cursor, or of the armed move. */}
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
    const { onContextLost } = props;
    const [failed, setFailed] = useState(false);
    const reported = useRef(false);

    const report = useCallback(() => {
        if (reported.current) return;
        reported.current = true;
        setFailed(true);
        onContextLost?.();
    }, [onContextLost]);

    // Bail out early on machines with no WebGL at all rather than rendering a
    // blank square.
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

    if (failed) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                }}
            >
                3D rendering isn’t available in this browser — use the Layers view.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
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
                <GameBoardScene {...props} />
            </Canvas>
        </div>
    );
}

interface DemoBoardProps {
    autoRotate?: boolean;
}

/** Decorative board for the home page. */
export function DemoBoard({ autoRotate = true }: DemoBoardProps) {
    const demoBoard: Board = useMemo(() => {
        const b: Board = Array(27).fill(null);
        b[13] = 1; // centre
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
                <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={44} />
                <OrbitControls
                    autoRotate={autoRotate}
                    autoRotateSpeed={0.9}
                    enableZoom={false}
                    enablePan={false}
                />

                <ambientLight intensity={0.65} />
                <hemisphereLight args={['#dfe7ff', '#141821', 0.5]} />
                <directionalLight position={[8, 12, 6]} intensity={1} />
                <pointLight position={[0, 0, 0]} intensity={0.4} distance={7} />

                <LayerPlanes />
                <TicTacToeGrid spacing={SPACING} />
                <EmptyMarkers board={demoBoard} />

                {demoBoard.map((value, index) =>
                    value === null ? null : (
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
