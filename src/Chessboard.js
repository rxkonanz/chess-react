import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./Chessboard.css";

const ChessboardComponent = () => {
    
    const [game, setGame] = useState(new Chess());
    const [isCheck, setIsCheck] = useState(false);
    const [gameOver, setGameOver] = useState(null);
    const [loading, setLoading] = useState(false);

    const makeMove = async ({ from, to, promotion }) => {
        
        if(gameOver){
            console.log("status of game over", gameOver);
            return; // Do not allow moves after game is over.
        }
        
        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({ from, to, promotion: promotion || "q" });
            console.log(move);
            if (!move) {
                console.warn(`Illegal move attempted: ${from} to ${to}`);
                return;
            }
            setGame(gameCopy);

            // Check for checks (confusing ikr)
            setIsCheck(gameCopy.inCheck());

            // Check for checkmate and stalemate
            if (gameCopy.isCheckmate()){
                setGameOver("Checkmate");
            } else if (gameCopy.isStalemate()) {
                setGameOver("Stalemate");
            } else if (gameCopy.isGameOver()) {
                setGameOver("Game Over");
            }

            // Trigger AI move after player's move
            if(gameCopy.turn() === "b"){
                let cleanMove = await getAiMove(gameCopy.fen());
                console.log(cleanMove);
                gameCopy.move({ from: cleanMove.slice(0, 2), to: cleanMove.slice(2, 4), promotion: "q"});
                setGame(gameCopy);
                // Check for checks (confusing ikr)
                setIsCheck(gameCopy.inCheck());

                // Check for checkmate and stalemate
                if (gameCopy.isCheckmate()){
                    setGameOver("Checkmate");
                } else if (gameCopy.isStalemate()) {
                    setGameOver("Stalemate");
                } else if (gameCopy.isGameOver()) {
                    setGameOver("Game Over");
                }
            }

        } catch (error) {
            console.error("Invalid move:", { from, to, promotion }, error);
        }
    };

    const getAiMove = async (fen) => {
        setLoading(true); // Start loading indicator
        try {

            const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=12&mode=bestmove`;
            const response = await fetch(url, {
            method: "GET",  // Use GET since we're passing data in the URL
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",  // Use this content type
            }
        });
            // Check if the response is successful
            if (!response.ok) {
                throw new Error("Error fetching data from Stockfish API");
            }

            const data = await response.json();
            const bestMove = data.bestmove;
            console.log("AI Move:", data);
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
            setLoading(false); // Stop loading indicator
        }
    };

    const getCheckSquare = () => {
        if (isCheck){
            const board = game.board();
            for (let row of board) {
                for (let square of row) {
                    if (square && square.type === "k" && square.color === game.turn()) {
                        return { [square.square]: { background: "red"} };
                    }
                }
            }
        }
        return {};
    };

    return (
        <div className="chess-container">
            {gameOver && <h2 style={{ color: "blue" }}>{gameOver}</h2>}
            <Chessboard
                position={game.fen()}
                onPieceDrop={(sourceSquare, targetSquare) => 
                    makeMove({ from: sourceSquare, to: targetSquare, promotion: "q" })
                }
                customSquareStyles={getCheckSquare()} // Highlight Checked King
            />
            {isCheck && !gameOver && <h2 style={{ color: "red"}}>Check!</h2>}
            {loading && <h2>AI Thinking...</h2>}
        </div>
    );
};

export default ChessboardComponent;
