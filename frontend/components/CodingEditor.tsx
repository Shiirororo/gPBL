"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const LANGUAGE_MAP: Record<string, string> = {
  Python: "python",
  Javascript: "javascript",
  Java: "java",
  "C++": "cpp",
  C: "c",
  Go: "go",
};



const SAMPLE_CODE_SNIPPET: Record<string, string> = {
  Python:
`def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`,
  Javascript:
`/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}
`,
  Java:
`import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
  "C++":
`#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
  C:
`#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                int* result = (int*)malloc(2 * sizeof(int));
                result[0] = i;
                result[1] = j;
                *returnSize = 2;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}
`,
  Go:
`func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return nil
}
`,
};

export default function CodingEditor({ className }: { className?: string }) {
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState(SAMPLE_CODE_SNIPPET["Python"]);

  return (
    <Card className={`rounded-xl overflow-hidden h-full flex flex-col ${className ?? ""}`}>
      <CardHeader className="shrink-0">
        <div className="flex items-center justify-between">
          <CardDescription className="text-lg bold">
            Select language
            <div className="text-sm">Press ` for AI Assistant</div>
          </CardDescription>

        <Select
        value={language}
        onValueChange={(value) => {
            if (value !== null) {
              setLanguage(value);
              setCode(SAMPLE_CODE_SNIPPET[value] ?? "");
            }
        }}
        >
        <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Language" />
        </SelectTrigger>
            <SelectContent className="rounded-lg">
                <SelectItem value="Python">Python</SelectItem>
                <SelectItem value="Javascript">JavaScript</SelectItem>
                <SelectItem value="Java">Java</SelectItem>
                <SelectItem value="C++">C++</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="Go">Go</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* relative+absolute ensures Monaco receives a real pixel height
          regardless of flex-grow propagation through the panel chain */}
      <CardContent className="relative flex-1 min-h-0 p-0">
        <div className="absolute inset-0">
          <Editor
            height="100%"
            language={LANGUAGE_MAP[language] ?? "plaintext"}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}