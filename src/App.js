import React from "react";
import ChessboardComponent from "./Chessboard";

function App() {
    return (
        <div className="App">
            <h1 style={{paddingLeft: "40px"}}>Can you beat Roberto in Chess?</h1>
            <ChessboardComponent />
        </div>
    );
}

export default App;