import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  repoSummary: {
    languages: string[];
    frameworks: string[];
    files: { path: string; content: string; type: string }[];
    errors: string[];
    warnings: string[];
    structure: string[];
  };
  action: 'analyze' | 'fix' | 'generate-docs';
}

// Truncate content to avoid token limits
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '\n... [truncated]';
}

// Prepare files with truncation - keep it small for Groq limits
function prepareFiles(files: { path: string; content: string }[], maxPerFile: number, maxFiles: number) {
  return files.slice(0, maxFiles).map(f => 
    `--- ${f.path} ---\n${truncateContent(f.content, maxPerFile)}`
  ).join('\n\n');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const { repoSummary, action } = await req.json() as AnalysisRequest;

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = `You are an expert code analyzer. Analyze the provided repository and identify issues.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "criticalErrors": [{"file": "path", "line": 1, "issue": "description", "severity": "critical"}],
  "warnings": [{"file": "path", "issue": "description"}],
  "securityIssues": [{"file": "path", "issue": "description", "cve": ""}],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallScore": 75,
  "summary": "brief summary"
}`;
      const filesContent = prepareFiles(repoSummary.files, 800, 8);
      userPrompt = `Analyze:\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\n\nFiles:\n${filesContent}\n\nErrors:\n${repoSummary.errors.slice(0, 10).join('\n')}`;
    } else if (action === 'fix') {
      systemPrompt = `You are an expert code fixer. Generate patches to fix issues.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "patches": [
    {
      "file": "path/to/file",
      "original": "exact original code to change",
      "fixed": "exact fixed code to replace with",
      "diff": "- old\\n+ new",
      "explanation": "what this fixes",
      "risk": "low",
      "testCommand": "npm test"
    }
  ],
  "summary": "overall fix summary",
  "fixedCount": 1,
  "skippedCount": 0,
  "skippedReasons": []
}`;
      const filesContent = prepareFiles(repoSummary.files, 1000, 6);
      userPrompt = `Fix issues:\nLanguages: ${repoSummary.languages.join(', ')}\n\nFiles:\n${filesContent}\n\nErrors:\n${repoSummary.errors.slice(0, 8).join('\n')}`;
    } else if (action === 'generate-docs') {
      systemPrompt = `You are a documentation expert. Generate docs for the codebase.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "readme": "# Project Name\\n\\n## Overview\\n...",
  "summary": "Architecture summary...",
  "problemsSolved": "Issues fixed..."
}`;
      const filesContent = prepareFiles(repoSummary.files, 600, 5);
      userPrompt = `Generate docs:\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\nStructure: ${repoSummary.structure.slice(0, 15).join('\n')}\n\nFiles:\n${filesContent}`;
    }

    console.log(`Processing ${action} request with Groq...`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 4096,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 413) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Request too large. Please try with fewer files.' 
        }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    console.log(`${action} completed successfully`);

    // Try to parse as JSON
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse JSON, raw content:', content.substring(0, 500));
      result = { raw: content };
    }

    return new Response(JSON.stringify({ success: true, result, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-code function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
