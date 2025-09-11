export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  description: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  technical: string[];
}
