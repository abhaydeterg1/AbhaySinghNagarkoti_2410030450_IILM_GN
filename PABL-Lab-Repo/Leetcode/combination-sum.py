# ============================================================================
# LeetCode #39 — Combination Sum
# Difficulty: Medium
# Link: https://leetcode.com/problems/combination-sum/
# ============================================================================
#
# Given an array of distinct integers candidates and a target integer target,
# return a list of all unique combinations of candidates where the chosen
# numbers sum to target. The same number may be chosen unlimited times.
#
# Result: Accepted — Runtime: 9ms, Memory: 12.06 MB
# ============================================================================

class Solution(object):
    def combinationSum(self, candidates, target):
        def backtrack(start, path, target):
            if target == 0:
                result.append(path)
                return
            for i in range(start, len(candidates)):
                if candidates[i] > target:
                    continue
                backtrack(i, path + [candidates[i]], target - candidates[i])

        result = []
        backtrack(0, [], target)
        return result
