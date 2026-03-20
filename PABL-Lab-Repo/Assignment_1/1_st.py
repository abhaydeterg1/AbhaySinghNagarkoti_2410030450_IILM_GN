'''
Given an integer array arr[] and an integer k, your task is to find and return the kth smallest
element in the given array.
Note: The kth smallest element is determined based on the sorted order of the array.
'''

class Solution:
    def kthSmallest(self, arr, k):
        x = arr.sort()
        return arr[k-1]
