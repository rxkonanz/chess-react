import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./Chessboard.css";

const ChessboardComponent = () => {
    
    const [game, setGame] = useState(new Chess());
    const [isCheck, setIsCheck] = useState(false);
    const [gameOver, setGameOver] = useState(null);

    const makeMove = ({ from, to, promotion }) => {
        
        if(gameOver){
            console.log("status of game over", gameOver);
            return; // Do not allow moves after game is over.
        }

        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({ from, to, promotion: promotion || "q" });
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
        } catch (error) {
            console.error("Invalid move:", { from, to, promotion }, error);
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
        </div>
    );
};

export default ChessboardComponent;
