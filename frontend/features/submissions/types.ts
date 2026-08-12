export type SubmissionStatus = "AC" | "WA" | "TLE" | "RE" | "IE" | string;

export interface TestCaseResult {
  testcase_id: number | null;
  status: SubmissionStatus;
  runtime_ms: number;
  is_hidden: boolean;
  actual_output: string | null;
  expected_output: string | null;
  stderr: string;
}

export interface SubmissionResult {
  result_id: number | null;
  challenge_id: number;
  status: SubmissionStatus;
  passed_testcases: number;
  total_testcases: number;
  details: TestCaseResult[];
}

export interface SubmissionSummary {
  result_id: number;
  submit_status: SubmissionStatus;
  passed_testcases: number;
  timestamp: string;
}

export interface SubmissionDetail {
  result_id: number;
  challenge_id: number;
  submit_status: SubmissionStatus;
  passed_testcases: number;
  submit: string;
  timestamp: string;
}

export interface SubmitCodeInput {
  challengeId: number;
  code: string;
  language: string;
}
