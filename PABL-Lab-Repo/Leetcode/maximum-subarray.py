# ================================================================
# Problem : Maximum Subarray
# LeetCode : #53  |  Difficulty: Medium
# Link     : https://leetcode.com/problems/maximum-subarray/
# ================================================================
#
# PROBLEM STATEMENT:
#   Given an integer array nums, find the subarray with the
#   largest sum, and return its sum.
#
# Examples:
#   Input : nums = [-2,1,-3,4,-1,2,1,-5,4]
#   Output: 6  (subarray [4,-1,2,1] has the largest sum = 6)
#
#   Input : nums = [1]
#   Output: 1
#
#   Input : nums = [5,4,-1,7,8]
#   Output: 23
#
# Constraints:
#   - 1 <= nums.length <= 10^5
#   - -10^4 <= nums[i] <= 10^4
#
# Follow up:
#   If you have figured out the O(n) solution, try coding
#   another solution using the divide and conquer approach.
#   (Kadane's Algorithm is used here)
# ================================================================

def kadane(arr):
    current_sum = arr[0]
    max_sum = arr[0]

    for i in range(1, len(arr)):
        current_sum = max(arr[i], current_sum + arr[i])
        max_sum = max(max_sum, current_sum)

    return max_sum


# --- Test Cases ---
arr = [-2, -3, 4, -1, -2, 1, 5, -3]
print("Maximum Subarray Sum =", kadane(arr))   # Expected: 7

arr1 = [-5, -2, -8]
print("Maximum Subarray Sum =", kadane(arr1))  # Expected: -2
