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
      userPrompt = `Analyze this repository:\n\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\n\nFiles:\n${repoSummary.files.map(f => `--- ${f.path} ---\n${f.content.substring(0, 2000)}`).join('\n\n')}\n\nExisting Errors:\n${repoSummary.errors.join('\n')}\n\nWarnings:\n${repoSummary.warnings.join('\n')}`;
    } else if (action === 'fix') {
      systemPrompt = `You are an expert code fixer. Generate minimal, safe patches to fix the identified issues.

For each fix, provide:
1. The file path
2. A unified diff patch
3. Explanation of the fix
4. Risk assessment (low/medium/high)

Respond with JSON:
{
  "patches": [
    {
      "file": "path/to/file",
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
      userPrompt = `Generate fixes for these issues:\n\nRepository Info:\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\n\nFiles with issues:\n${repoSummary.files.map(f => `--- ${f.path} ---\n${f.content.substring(0, 3000)}`).join('\n\n')}\n\nErrors to fix:\n${repoSummary.errors.join('\n')}\n\nWarnings:\n${repoSummary.warnings.join('\n')}`;
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
      userPrompt = `Generate documentation for:\n\nLanguages: ${repoSummary.languages.join(', ')}\nFrameworks: ${repoSummary.frameworks.join(', ')}\nStructure: ${repoSummary.structure.join('\n')}\n\nKey files:\n${repoSummary.files.slice(0, 10).map(f => `--- ${f.path} ---\n${f.content.substring(0, 1500)}`).join('\n\n')}`;
    }

    console.log(`Processing ${action} request...`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in response');
    }

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
