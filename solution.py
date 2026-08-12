from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hm = {}
        n = len(nums)
        for i in range(n):
            if target - nums[i] in hm:
                return [hm[target - nums[i]], i]
            hm[nums[i]] = i

if __name__ == '__main__':
    # Add input parsing block if challenge requires reading from stdin
    import sys
    import json
    input_data = sys.stdin.read().strip()
    if input_data:
        try:
            # Assume input is like: [2,7,11,15]\n9
            lines = input_data.split('\n')
            nums = json.loads(lines[0])
            target = int(lines[1])
            sol = Solution()
            ans = sol.twoSum(nums, target)
            print(json.dumps(ans))
        except Exception as e:
            pass
