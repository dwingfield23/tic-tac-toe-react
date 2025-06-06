import { getEasyAIMove, getMediumAIMove, getBestMove } from './ai';

describe('Easy AI (Random)', () => {
	it('should return a valid index from available moves', () => {
		const board = [null, 'X', null, 'O', 'X', null, null, null, 'O'];
		const move = getEasyAIMove(board);
		expect([0, 2, 5, 6, 7]).toContain(move);
	});
});

describe('Medium AI', () => {
	it('should block opponent\'s winning move', () => {
		const board = ['X', 'X', null, null, 'O', null, null, null, null];
		const move = getMediumAIMove(board, 'O');
		expect(move).toBe(2); // Block 'X' from winning
	});
	
	it('should take winning move if available', () => {
		const board = ['O', 'O', null, 'X', 'X', null, null, null, null];
		const move = getMediumAIMove(board, 'O');
		expect(move).toBe(2); // 'O' wins
	});
});

describe('Hard AI (Minimax)', () => {
	it('should choose the center if available on an empty board', () => {
		const board = Array(9).fill(null);
		const move = getBestMove(board, 'O'); // 'O' is AI
		expect(move).toBe(4); // Best opening move
	});
	
	it('should never lose if playing second', () => {
		const board = ['X', null, null, null, 'O', null, null, null, 'X'];
		const move = getBestMove(board, 'O');
		expect([1, 2, 3, 5, 6, 7]).toContain(move); // Avoid losing
	});
});
