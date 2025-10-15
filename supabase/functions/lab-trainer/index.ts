import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LabBlueprint {
  title: string;
  theme: string;
  description: string;
  hints: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  extra_hints: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
  expected_output: string;
  tests?: Array<{
    input: string;
    expected: string;
  }>;
}

const taskBlueprints: LabBlueprint[] = [
  {
    title: "Simple Adder",
    theme: "math fundamentals",
    description: "Ask the user for two numbers and print their sum.",
    hints: {
      beginner: ["Use input() and int().", "Add them and print the result."],
      intermediate: ["Wrap logic in a function.", "Validate numeric input."],
      advanced: ["Accept variable number of inputs.", "Handle non-numerical errors."]
    },
    extra_hints: {
      beginner: ["Use int(input()) for both numbers.", "print(a + b) at the end."],
      intermediate: ["Define a function def add_nums(a,b): return a+b."],
      advanced: ["Use try/except to handle ValueError."]
    },
    expected_output: "Sum of two numbers printed.",
    tests: [
      { input: "2\n3\n", expected: "5" },
      { input: "10\n5\n", expected: "15" }
    ]
  },
  {
    title: "Calorie Estimator Bot",
    theme: "nutrition analysis",
    description: "Estimate calorie intake from foods and quantities.",
    hints: {
      beginner: ["Use dict for foods/calories.", "Loop and sum totals."],
      intermediate: ["Read from CSV with pandas.", "Handle invalid foods."],
      advanced: ["Use an API.", "Visualize results with matplotlib."]
    },
    extra_hints: {
      beginner: ["Start with a dict like {'apple':95, 'banana':105}.", "Ask user for food names."],
      intermediate: ["Use pandas.read_csv to load a dataset of food and calories."],
      advanced: ["Fetch nutrition data via requests and plot it."]
    },
    expected_output: "Display total calories consumed."
  },
  {
    title: "Workout Performance Tracker",
    theme: "fitness analytics",
    description: "Track exercises and analyze volume lifted per session.",
    hints: {
      beginner: ["Use dict for exercise and reps.", "Calculate total volume."],
      intermediate: ["Store data in CSV.", "Summarize per exercise with pandas."],
      advanced: ["Visualize progress trends.", "Predict improvement."]
    },
    extra_hints: {
      beginner: ["Request exercise, reps, and weight from the user."],
      intermediate: ["Write session data to CSV for reuse."],
      advanced: ["Plot total weight per session with matplotlib."]
    },
    expected_output: "Summarized workout progress."
  },
  {
    title: "Stock Price Visualizer",
    theme: "finance & markets",
    description: "Retrieve and visualize stock prices.",
    hints: {
      beginner: ["Store fake prices in a dict.", "Print daily change."],
      intermediate: ["Use pandas for CSV data.", "Plot with matplotlib."],
      advanced: ["Fetch live data via API.", "Analyze moving averages."]
    },
    extra_hints: {
      beginner: ["Make a dict {'AAPL':[150,152,149]}.", "Print min, max, avg."],
      intermediate: ["Use pandas.read_csv() to process file data."],
      advanced: ["Calculate volatility = stddev of daily returns."]
    },
    expected_output: "Plot or print stock trends."
  }
];

const randomTips = [
  "Write clean, readable code.",
  "Break tasks into functions.",
  "Handle invalid data gracefully.",
  "Add comments for each step."
];

function generateLab(difficulty: string, topic?: string): { text: string; lab: LabBlueprint } {
  const validDifficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';
  
  let filteredLabs = taskBlueprints;
  if (topic && topic !== "Random") {
    filteredLabs = taskBlueprints.filter(lab => 
      lab.theme.toLowerCase().includes(topic.toLowerCase())
    );
  }
  
  if (filteredLabs.length === 0) {
    filteredLabs = taskBlueprints;
  }
  
  const lab = filteredLabs[Math.floor(Math.random() * filteredLabs.length)];
  const hints = lab.hints[validDifficulty];
  const tip = randomTips[Math.floor(Math.random() * randomTips.length)];
  
  const text = `=== ${lab.title.toUpperCase()} ===

🧩 Challenge:
${lab.description}

🎯 Your Task:
${tip}

🧠 Steps to Consider (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level):
${hints.map(h => `- ${h}`).join('\n')}

✅ Expected Outcome:
${lab.expected_output}

🏷️ Topic: ${lab.theme.charAt(0).toUpperCase() + lab.theme.slice(1)}`;

  return { text, lab };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { difficulty = 'beginner', topic } = await req.json();
    
    console.log('Generating lab:', { difficulty, topic });
    
    const result = generateLab(difficulty, topic);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in lab-trainer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
