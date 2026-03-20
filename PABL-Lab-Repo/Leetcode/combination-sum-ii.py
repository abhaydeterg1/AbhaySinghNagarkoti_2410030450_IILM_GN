# ============================================================================
# LeetCode #40 — Combination Sum II
# Difficulty: Medium
# Link: https://leetcode.com/problems/combination-sum-ii/
# ============================================================================
#
# Given a collection of candidate numbers and a target number, find all
# unique combinations where the candidate numbers sum to target. Each number
# may only be used once. The solution set must not contain duplicate combos.
#
# Result: Accepted — Runtime: 3ms, Memory: 11.81 MB
# ============================================================================

class Solution(object):
    def combinationSum2(self, candidates, target):
        candidates.sort()
        result = []

        def backtrack(start, path, target):
            if target == 0:
                result.append(path)
                return

            for i in range(start, len(candidates)):
                if i > start and candidates[i] == candidates[i - 1]:
                    continue
                if candidates[i] > target:
                    break
                backtrack(i + 1, path + [candidates[i]], target - candidates[i])

        backtrack(0, [], target)
        return result
