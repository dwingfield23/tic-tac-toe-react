import React, { useEffect, useState } from "react";
import "./App.css"; // For custom line styles
import confetti from "canvas-confetti";

const Modal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">{message}</h2>
        <button
          onClick={onClose}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

const Square = ({ value, onClick, animate }) => {
  return (
    <button
      className={`w-20 h-20 text-2xl font-bold border border-gray-400 flex items-center justify-center ${
        animate ? "animate-pop" : ""
      }`}
      onClick={onClick}
    >
      {value}
    </button>
  );
};

const Board = () => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameMode, setGameMode] = useState("pvp"); // "pvp" or "ai"
  const [difficulty, setDifficulty] = useState("easy");
  const [aiPlayer, setAiPlayer] = useState("O"); // default AI as O
  const [startingPlayer, setStartingPlayer] = useState("X");
  const [winningLine, setWinningLine] = useState(null);
  const [hasCelebrated, setHasCelebrated] = useState(false); // To avoid multiple confetti triggers
  const [showModal, setShowModal] = useState(false);
  const [winnerSymbol, setWinnerSymbol] = useState(null);
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem("ticTacToeScore");
    return saved ? JSON.parse(saved) : { X: 0, O: 0, draws: 0 };
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("ticTacToeHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const winner = calculateWinner(squares);
  
  useEffect(() => {
    localStorage.setItem("ticTacToeScore", JSON.stringify(score));
  }, [score]);
  
  useEffect(() => {
    if (squares.every((sq) => sq === null)) {
      setXIsNext(startingPlayer === "X");
    }
  }, [startingPlayer, squares]);
  
  useEffect(() => {
    const currentPlayer = xIsNext ? "X" : "O";
    
    if (
      gameMode === "ai" &&
      currentPlayer === aiPlayer &&
      !calculateWinner(squares) &&
      squares.some((sq) => sq === null)
    ) {
      const timeout = setTimeout(() => {
        let aiMove;
        
        if (difficulty === "easy") {
          aiMove = getEasyAIMove(squares);
        } else if (difficulty === "medium") {
          aiMove = getMediumAIMove(squares, aiPlayer);
        } else if (difficulty === "hard") {
          aiMove = getHardAIMove(squares, aiPlayer);
        }
        
        if (aiMove !== null) {
          handleClick(aiMove, true); // true = allow AI move
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [xIsNext, squares, gameMode, aiPlayer, difficulty]);
  
  // Checks for a winner, loser, or draw
  useEffect(() => {
    if (!hasCelebrated && (winner || squares.every(Boolean))) {
      const result = winner ? winner.symbol : "Draw";
      
      // Update score
      if (winner) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setScore((prev) => ({ ...prev, [winner.symbol]: prev[winner.symbol] + 1 }));
        setWinnerSymbol(winner.symbol);
      } else {
        setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
        setWinnerSymbol(null);
      }
      
      // Update history
      const newEntry = {
        id: Date.now(),
        result,
      };
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("ticTacToeHistory", JSON.stringify(updatedHistory));
      
      setShowModal(true);
      setHasCelebrated(true);
    }
  }, [winner, hasCelebrated, squares]);
  
  const getEasyAIMove = (squares) => {
    const emptyIndexes = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);
    if (emptyIndexes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * emptyIndexes.length);
    return emptyIndexes[randomIndex];
  };
  
  const getMediumAIMove = (squares, aiSymbol) => {
    const opponent = aiSymbol === "X" ? "O" : "X";
    
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    
    // 1. Try to win
    for (let [a, b, c] of winningCombos) {
      const line = [squares[a], squares[b], squares[c]];
      const counts = line.filter((val) => val === aiSymbol).length;
      const empty = [a, b, c].find((i) => squares[i] === null);
      if (counts === 2 && empty !== undefined) return empty;
    }
    
    // 2. Try to block opponent
    for (let [a, b, c] of winningCombos) {
      const line = [squares[a], squares[b], squares[c]];
      const counts = line.filter((val) => val === opponent).length;
      const empty = [a, b, c].find((i) => squares[i] === null);
      if (counts === 2 && empty !== undefined) return empty;
    }
    
    // 3. Pick random
    const emptyIndexes = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);
    if (emptyIndexes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * emptyIndexes.length);
    return emptyIndexes[randomIndex];
  };
  
  const getHardAIMove = (squares, aiSymbol) => {
    const opponent = aiSymbol === "X" ? "O" : "X";

    
    const getAvailableMoves = (board) =>
      board.map((val, idx) => (val === null ? idx : null)).filter((i) => i !== null);
  
    const minimax = (board, isMaximizing) => {
      const winner = calculateWinner(board);
      if (winner) {
        if (winner.winner === aiSymbol) return { score: 1 };
        else if (winner.winner === opponent) return { score: -1 };
      } else if (board.every((sq) => sq !== null)) {
        return { score: 0 }; // Tie
      }
    
      const moves = [];
  
      
    
      for (let index of getAvailableMoves(board)) {
        const newBoard = [...board];
        newBoard[index] = isMaximizing ? aiSymbol : opponent;
        const result = minimax(newBoard, !isMaximizing);
        moves.push({ index, score: result.score });
        console.log('moves',moves)
      }
      
     
    
      if (moves.length === 0) {
        return { score: 0 };
      }
    
      if (isMaximizing) {
        return moves.reduce((best, move) => (move.score > best.score ? move : best));
      } else {
        return moves.reduce((best, move) => (move.score < best.score ? move : best));
      }
    };
    
    const best = minimax(squares, true);
    return best.index;
  };
  
  
  //*
  const handleClick = (i) => {
    const currentPlayer = xIsNext ? "X" : "O";

    if (
      squares[i] ||
      calculateWinner(squares)
    ) {
      return;
    }
    
    const nextSquares = [...squares];
    nextSquares[i] = currentPlayer;
    setSquares(nextSquares);
    
    const win = calculateWinner(nextSquares);
    if (win) setWinningLine(win.line);
    
    setXIsNext(!xIsNext);
  };
  //*/
  const renderSquare = (i) => {
    return (
      <Square
        value={squares[i]}
        onClick={() => handleClick(i)}
        animate={Boolean(squares[i])}
      />
    );
  };
  
  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(startingPlayer === "X");
    setWinningLine(null);
    setHasCelebrated(false);
    setShowModal(false);
    setWinnerSymbol(null);
  };
  
  const resetScore = () => {
    setScore({ X: 0, O: 0, draws: 0 });
    localStorage.removeItem("ticTacToeScore");
  };
  
  
  
  return (
    <div className="flex flex-col items-center mt-10 relative">
  
      <div className="mb-4 space-y-2">
        <div>
          <label className="mr-2 font-medium">Game Mode:</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="pvp">Player vs Player</option>
            <option value="ai">Player vs AI</option>
          </select>
        </div>
    
        {gameMode === "ai" && (
          <>
            <div>
              <label className="mr-2 font-medium">AI Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
        
            <div>
              <label className="mr-2 font-medium">AI Plays As:</label>
              <select
                value={aiPlayer}
                onChange={(e) => setAiPlayer(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option value="X">X</option>
                <option value="O">O</option>
              </select>
            </div>
          </>
        )}
      </div>
      
      <div className="grid grid-flow-col grid-rows-3 gap-4">
        
        <div className="row-span-3">
  
          <h2 className="text-xl font-semibold mb-4">
            {gameMode === "ai" && (xIsNext ? "X" : "O") === aiPlayer
              ? "AI is thinking..."
              : `Next Player: ${xIsNext ? "X" : "O"}`}
          </h2>
  
          <div className="grid grid-cols-3 gap-0 relative">
            {Array(9)
              .fill(null)
              .map((_, i) => (
                <div key={i}>{renderSquare(i)}</div>
              ))}
            {winner && (
              <div className={`win-line ${getLineClass(winningLine)}`} />
            )}
          </div>
          
        </div>
        <div className="col-span-2">
          
          <div className="flex justify-center gap-6 mb-4 text-lg font-semibold">
            <div className="text-blue-600">X: {score.X}</div>
            <div className="text-red-600">O: {score.O}</div>
            <div className="text-gray-700">Draws: {score.draws}</div>
          </div>
  
          
          
        </div>
        <div className="col-span-2 row-span-2">
          <div className="mt-6 w-full max-w-xs bg-white shadow-md rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">🏆 Win History</h3>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No games played yet.</p>
            ) : (
              <ul className="text-sm max-h-64 overflow-y-auto">
                {history.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="py-1 border-b border-gray-200 flex justify-between"
                  >
                    <span>Game {history.length - index}</span>
                    <span>
            {entry.result === "Draw" ? "🤝 Draw" : `🎉 ${entry.result} wins`}
          </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
  
  
  
  
      <div className="mb-4">
        <label className="mr-2 font-medium">Starting Player:</label>
        <select
          value={startingPlayer}
         onChange={(e) => setStartingPlayer(e.target.value)}
          disabled={squares.some(Boolean)}
          className="px-2 py-1 border rounded disabled:bg-gray-100"
        >
          <option value="X">X</option>
          <option value="O">O</option>
        </select>
      </div>
     
    
     
    
      <button
        onClick={resetGame}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Restart Game
      </button>
  
      <button
        onClick={resetScore}
        className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Reset Score
      </button>
  
      <button
        onClick={() => {
          setHistory([]);
          localStorage.removeItem("ticTacToeHistory");
        }}
        className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        Clear History
      </button>
    
      {showModal && (
        <Modal
          message={
            winnerSymbol
              ? `🎉 Player ${winnerSymbol} wins!`
              : "🤝 It's a draw!"
          }
          onClose={resetGame}
        />
      )}
    </div>
    );
};

// Winning line logic
const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], // Row 1
    [3, 4, 5], // Row 2
    [6, 7, 8], // Row 3
    [0, 3, 6], // Col 1
    [1, 4, 7], // Col 2
    [2, 5, 8], // Col 3
    [0, 4, 8], // Diag TL-BR
    [2, 4, 6], // Diag TR-BL
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { symbol: squares[a], line };
    }
  }
  return null;
};

// Return a CSS class for the red line based on winning combination
const getLineClass = (line) => {
  const map = {
    "0,1,2": "horizontal-top",
    "3,4,5": "horizontal-middle",
    "6,7,8": "horizontal-bottom",
    "0,3,6": "vertical-left",
    "1,4,7": "vertical-middle",
    "2,5,8": "vertical-right",
    "0,4,8": "diagonal-main",
    "2,4,6": "diagonal-anti",
  };
  return map[line?.join(",")];
};

const App = () => <Board />;

export default App;
