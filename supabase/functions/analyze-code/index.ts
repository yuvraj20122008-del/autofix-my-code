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

// Prepare files with truncation
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { repoSummary, action } = await req.json() as AnalysisRequest;

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = `You are an expert code analyzer. Analyze the provided repository summary and identify:
1. Critical errors that need immediate fixing
2. Code quality issues and warnings
3. Security vulnerabilities
4. Performance concerns
5. Best practice violations

Provide a structured JSON response with:
{
  "criticalErrors": [{"file": "path", "line": number, "issue": "description", "severity": "critical|high|medium|low"}],
  "warnings": [{"file": "path", "issue": "description"}],
  "securityIssues": [{"file": "path", "issue": "description", "cve": "if applicable"}],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallScore": number (0-100),
  "summary": "brief summary"
}`;
      const filesContent = prepareFiles(repoSummary.files, 1500, 15);
      userPrompt = `Analyze this repository:\n\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\n\nFiles:\n${filesContent}\n\nExisting Errors:\n${repoSummary.errors.slice(0, 20).join('\n')}\n\nWarnings:\n${repoSummary.warnings.slice(0, 20).join('\n')}`;
    } else if (action === 'fix') {
      systemPrompt = `You are an expert code fixer. Generate minimal, safe patches to fix the identified issues.

For each fix, provide:
1. The file path
2. The EXACT original code that needs to be changed (the problematic code)
3. The EXACT fixed code to replace it with
4. A unified diff showing the change
5. Explanation of the fix
6. Risk assessment (low/medium/high)

IMPORTANT: The "original" field should contain the exact code snippet that needs to be changed (what to remove).
The "fixed" field should contain the exact replacement code (what to add instead).
Keep these snippets focused on the specific lines being changed.

Respond with JSON:
{
  "patches": [
    {
      "file": "path/to/file",
      "original": "exact original code to change",
      "fixed": "exact fixed code to replace with",
      "diff": "unified diff format",
      "explanation": "what this fixes",
      "risk": "low|medium|high",
      "testCommand": "command to verify fix"
    }
  ],
  "summary": "overall fix summary",
  "fixedCount": number,
  "skippedCount": number,
  "skippedReasons": ["reason1"]
}`;
      const filesContent = prepareFiles(repoSummary.files, 2000, 10);
      userPrompt = `Generate fixes for these issues:\n\nRepository Info:\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\n\nFiles with issues:\n${filesContent}\n\nErrors to fix:\n${repoSummary.errors.slice(0, 15).join('\n')}\n\nWarnings:\n${repoSummary.warnings.slice(0, 15).join('\n')}`;
    } else if (action === 'generate-docs') {
      systemPrompt = `You are a technical documentation expert. Generate comprehensive documentation for the codebase.

Generate:
1. A professional README.md with project overview, setup instructions, usage examples
2. A repo-summary.md with architecture details
3. A problems-solved.md documenting what issues were fixed

Respond with JSON:
{
  "readme": "full README.md content in markdown",
  "summary": "repo-summary.md content",
  "problemsSolved": "problems-solved.md content"
}`;
      const filesContent = prepareFiles(repoSummary.files, 1000, 8);
      userPrompt = `Generate documentation for:\n\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\nStructure: ${repoSummary.structure.slice(0, 30).join('\n')}\n\nKey files:\n${filesContent}`;
    }

    console.log(`Processing ${action} request with Lovable AI...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

    console.log(`${action} completed successfully`);

    // Try to parse as JSON, otherwise return as text
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch {
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