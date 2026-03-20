# ================================================================
# Problem : Word Search
# LeetCode : #79  |  Difficulty: Medium
# Link     : https://leetcode.com/problems/word-search/
# ================================================================
#
# PROBLEM STATEMENT:
#   Given an m x n grid of characters board and a string word,
#   return true if word exists in the grid.
#   The word can be constructed from letters of sequentially
#   adjacent cells (horizontally or vertically neighboring).
#   The same letter cell may not be used more than once.
#
# Examples:
#   Input : board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
#   Output: true
#
#   Input : board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
#   Output: true
#
#   Input : board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"
#   Output: false
#
# Constraints:
#   - m == board.length
#   - n == board[i].length
#   - 1 <= m, n <= 6
#   - 1 <= word.length <= 15
#   - board and word consist of only lowercase and uppercase English letters.
#
# Follow up:
#   Could you use search pruning to make your solution faster
#   with a larger board?
# ================================================================

class Solution(object):
    def exist(self, board, word):
        """
        :type board: List[List[str]]
        :type word: str
        :rtype: bool
        """
        if not board or not board[0]:
            return False

        rows, cols = len(board), len(board[0])

        def backtrack(r, c, index):
            if index == len(word):
                return True
            if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[index]:
                return False

            temp = board[r][c]
            board[r][c] = '#'  # Mark as visited

            found = (backtrack(r + 1, c, index + 1) or
                     backtrack(r - 1, c, index + 1) or
                     backtrack(r, c + 1, index + 1) or
                     backtrack(r, c - 1, index + 1))

            board[r][c] = temp  # Restore
            return found

        for i in range(rows):
            for j in range(cols):
                if backtrack(i, j, 0):
                    return True

        return False
