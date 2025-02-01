import React, { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./Chessboard.css";

const ChessboardComponent = () => {
    const [game, setGame] = useState(new Chess());
    const [isCheck, setIsCheck] = useState(false);

    const makeMove = ({ from, to, promotion }) => {
        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({ from, to, promotion: promotion || "q" });
            if (!move) {
                console.warn(`Illegal move attempted: ${from} to ${to}`);
                return;
            }
            setGame(gameCopy);
            setIsCheck(gameCopy.inCheck());
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
            <Chessboard
                position={game.fen()}
                onPieceDrop={(sourceSquare, targetSquare) => 
                    makeMove({ from: sourceSquare, to: targetSquare, promotion: "q" })
                }
                customSquareStyles={getCheckSquare()} // Highlight Checked King
            />
            {isCheck && <h2 style={{ color: "red"}}>Check!</h2>}
        </div>
    );
};

export default ChessboardComponent;
