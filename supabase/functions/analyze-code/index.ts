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

// Validate request structure
function validateRequest(req: unknown): req is AnalysisRequest {
  if (!req || typeof req !== 'object') return false;
  const r = req as any;
  return (
    r.repoSummary &&
    Array.isArray(r.repoSummary.languages) &&
    Array.isArray(r.repoSummary.frameworks) &&
    Array.isArray(r.repoSummary.files) &&
    Array.isArray(r.repoSummary.errors) &&
    Array.isArray(r.repoSummary.warnings) &&
    Array.isArray(r.repoSummary.structure) &&
    (r.action === 'analyze' || r.action === 'fix' || r.action === 'generate-docs')
  );
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

// Validate JSON response structure
function validateAnalysisResponse(result: unknown, action: string): boolean {
  if (!result || typeof result !== 'object') return false;
  const r = result as any;
  
  if (action === 'analyze') {
    return Array.isArray(r.criticalErrors) && Array.isArray(r.warnings) && typeof r.overallScore === 'number';
  } else if (action === 'fix') {
    return Array.isArray(r.patches) && typeof r.fixedCount === 'number' && typeof r.skippedCount === 'number';
  } else if (action === 'generate-docs') {
    return typeof r.readme === 'string' && typeof r.summary === 'string';
  }
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured');
      throw new Error('API configuration error');
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('Invalid JSON body:', e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid request format' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateRequest(requestBody)) {
      console.error('Invalid request structure');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid request structure' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { repoSummary, action } = requestBody;

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
      console.error('No content in response from API');
      throw new Error('Empty response from API');
    }

    console.log(`${action} completed successfully`);

    // Try to parse as JSON
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
      
      // Validate the response structure
      if (!validateAnalysisResponse(result, action)) {
        console.error('Response validation failed for action:', action);
        console.error('Raw result:', JSON.stringify(result).substring(0, 500));
        throw new Error(`Invalid response structure for ${action}`);
      }
    } catch (parseError) {
      console.error('Failed to parse or validate JSON:', parseError);
      console.error('Raw content:', content.substring(0, 500));
      // Return structured error instead of raw content
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse API response. Please try again.' 
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, result, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-code function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorMessage.includes('API configuration') ? 500 : 500;
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An error occurred while processing your request. Please try again.' 
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
