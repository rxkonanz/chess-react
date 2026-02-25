import React, { useState, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./Chessboard.css";

const DIFFICULTY_LEVELS = [
    { label: "Easy",   depth: 6  },
    { label: "Medium", depth: 10 },
    { label: "Hard",   depth: 15 },
];

const ChessboardComponent = () => {

    const [game, setGame] = useState(new Chess());
    const [isCheck, setIsCheck] = useState(false);
    const [gameOver, setGameOver] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [optionSquares, setOptionSquares] = useState({});
    const [moveHistory, setMoveHistory] = useState([]);
    const [difficultyIndex, setDifficultyIndex] = useState(1); // default: Medium
    const moveListRef = useRef(null);

    // Auto-scroll move history to the latest move
    useEffect(() => {
        if (moveListRef.current) {
            moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
        }
    }, [moveHistory]);

    const resetGame = () => {
        setGame(new Chess());
        setIsCheck(false);
        setGameOver(null);
        setLoading(false);
        setSelectedSquare(null);
        setOptionSquares({});
        setMoveHistory([]);
    };

    const applyGameStatus = (gameCopy) => {
        setIsCheck(gameCopy.inCheck());
        if (gameCopy.isCheckmate()) {
            setGameOver("Checkmate");
        } else if (gameCopy.isStalemate()) {
            setGameOver("Stalemate");
        } else if (gameCopy.isGameOver()) {
            setGameOver("Game Over");
        }
    };

    const makeMove = async ({ from, to, promotion }) => {
        if (gameOver || loading) return;

        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({ from, to, promotion: promotion || "q" });
            if (!move) {
                console.warn(`Illegal move attempted: ${from} to ${to}`);
                return;
            }

            setMoveHistory(prev => [...prev, move.san]);
            setGame(new Chess(gameCopy.fen()));
            applyGameStatus(gameCopy);

            // Only trigger AI if the game isn't over after the player's move
            if (!gameCopy.isGameOver() && gameCopy.turn() === "b") {
                const cleanMove = await getAiMove(gameCopy.fen());
                if (!cleanMove) return;

                const aiMove = gameCopy.move({
                    from: cleanMove.slice(0, 2),
                    to: cleanMove.slice(2, 4),
                    promotion: "q",
                });

                if (aiMove) {
                    setMoveHistory(prev => [...prev, aiMove.san]);
                    setGame(new Chess(gameCopy.fen()));
                    applyGameStatus(gameCopy);
                }
            }
        } catch (error) {
            console.error("Invalid move:", { from, to, promotion }, error);
        }
    };

    const getAiMove = async (fen) => {
        setLoading(true);
        try {
            const depth = DIFFICULTY_LEVELS[difficultyIndex].depth;
            const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}&mode=bestmove`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            if (!response.ok) throw new Error("Error fetching data from Stockfish API");

            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Stockfish API returned failure");

            const bestMove = data.bestmove;
            if (bestMove) {
                const cleanMove = bestMove.split(" ")[1];
                console.log("Best Move from StockFish:", cleanMove);
                return cleanMove;
            } else {
                console.warn("No bestmove in API response", data);
            }
        } catch (error) {
            console.error("Error fetching move from Stockfish API:", error);
        } finally {
            setLoading(false);
        }
    };

    // Show dots on legal target squares for the selected piece
    const getMoveOptions = (square) => {
        const moves = game.moves({ square, verbose: true });
        if (moves.length === 0) {
            setOptionSquares({});
            return;
        }

        const newSquares = {};
        moves.forEach(move => {
            // Captures get a large ring; empty squares get a small dot
            newSquares[move.to] = {
                background: move.captured
                    ? "radial-gradient(circle, rgba(0,0,0,.15) 82%, transparent 82%)"
                    : "radial-gradient(circle, rgba(0,0,0,.15) 28%, transparent 28%)",
                borderRadius: "50%",
            };
        });
        // Highlight the selected piece's square
        newSquares[square] = { background: "rgba(255, 255, 0, 0.45)" };
        setOptionSquares(newSquares);
    };

    // Handle click-to-move: select piece, switch selection, or execute move
    const onSquareClick = (square) => {
        if (gameOver || loading || game.turn() !== "w") return;

        const piece = game.get(square);

        // Clicking the same square deselects it
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setOptionSquares({});
            return;
        }

        // No piece selected yet — select this square if it holds a white piece
        if (!selectedSquare) {
            if (piece && piece.color === "w") {
                setSelectedSquare(square);
                getMoveOptions(square);
            }
            return;
        }

        // A piece is already selected — if clicking another white piece, switch selection
        if (piece && piece.color === "w") {
            setSelectedSquare(square);
            getMoveOptions(square);
            return;
        }

        // Attempt the move from selected square to this square
        makeMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setOptionSquares({});
    };

    const getCheckSquare = () => {
        if (isCheck) {
            const board = game.board();
            for (let row of board) {
                for (let square of row) {
                    if (square && square.type === "k" && square.color === game.turn()) {
                        return { [square.square]: { background: "rgba(220, 0, 0, 0.65)" } };
                    }
                }
            }
        }
        return {};
    };

    // Merge move hint squares with check highlight (check takes priority)
    const getCustomSquareStyles = () => ({
        ...optionSquares,
        ...getCheckSquare(),
    });

    // Group flat move list into {number, white, black} pairs for display
    const movePairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        movePairs.push({
            number: Math.floor(i / 2) + 1,
            white: moveHistory[i],
            black: moveHistory[i + 1] || "",
        });
    }

    return (
        <div className="game-wrapper">
            <div className="chess-container">
                <div className="board-controls">
                    <button className="new-game-btn" onClick={resetGame}>New Game</button>
                    {gameOver && <span className="game-over-msg">{gameOver}!</span>}
                    {isCheck && !gameOver && <span className="check-msg">Check!</span>}
                    {loading && <span className="thinking-msg">AI thinking...</span>}
                </div>
                <div className="difficulty-bar">
                    <span className="difficulty-label">Difficulty:</span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={difficultyIndex}
                        onChange={e => setDifficultyIndex(Number(e.target.value))}
                        className="difficulty-slider"
                        disabled={loading}
                    />
                    <span className="difficulty-name">{DIFFICULTY_LEVELS[difficultyIndex].label}</span>
                </div>
                <Chessboard
                    position={game.fen()}
                    onPieceDrop={(sourceSquare, targetSquare) => {
                        // Clear any click-selection state when drag is used
                        setSelectedSquare(null);
                        setOptionSquares({});
                        makeMove({ from: sourceSquare, to: targetSquare, promotion: "q" });
                        return true;
                    }}
                    onSquareClick={onSquareClick}
                    customSquareStyles={getCustomSquareStyles()}
                />
            </div>

            <div className="history-panel">
                <h3 className="history-title">Move History</h3>
                <div className="moves-list" ref={moveListRef}>
                    {movePairs.length === 0 ? (
                        <p className="no-moves">No moves yet</p>
                    ) : (
                        <table className="moves-table">
                            <tbody>
                                {movePairs.map(({ number, white, black }) => (
                                    <tr key={number}>
                                        <td className="move-number">{number}.</td>
                                        <td className="move-white">{white}</td>
                                        <td className="move-black">{black}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChessboardComponent;
