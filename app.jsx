const { useState, useEffect, useRef } = React;

// --- Icons ---
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>
);

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

// --- API Service ---
const generatePlan = async (goal, apiKey) => {
    const prompt = `You are an expert planner. The user wants to achieve this goal: "${goal}". 
    Create a practical, actionable 5-step implementation plan. 
    Return ONLY a valid JSON array containing exactly 5 objects. Each object must have:
    - "id" (number, 1 to 5)
    - "title" (string, short action-oriented title)
    - "description" (string, 1-2 sentences explaining the step)`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to generate plan. Please check your API key.');
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
};

// --- Components ---

const ThemeToggle = ({ isDark, toggleTheme }) => {
    return (
        <button 
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-3 glass-panel rounded-full text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary interactive"
            aria-label="Toggle Dark Mode"
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
};

const ApiKeyInput = ({ apiKey, setApiKey }) => {
    return (
        <div className="mb-6 p-4 glass-panel rounded-xl flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-dark/50 p-2 rounded-lg text-secondary">
                <KeyIcon />
            </div>
            <input 
                type="password" 
                placeholder="Enter your Gemini API Key..." 
                className="bg-transparent border-none outline-none flex-1 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
        </div>
    );
};

const GoalInput = ({ onSubmit, isLoading }) => {
    const [goal, setGoal] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (goal.trim() && !isLoading) {
            onSubmit(goal);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass-panel rounded-2xl p-2 flex items-center">
                <div className="pl-4 text-slate-500 dark:text-slate-400">
                    <TargetIcon />
                </div>
                <input 
                    type="text" 
                    placeholder="What is your goal?" 
                    className="w-full bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white px-4 py-3 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !goal.trim()}
                    className="bg-gradient-primary interactive hover:shadow-lg hover:shadow-primary/30 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="loader"></div>
                    ) : (
                        <>
                            <span>Generate</span>
                            <SparklesIcon />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

const ProgressBar = ({ steps }) => {
    if (steps.length === 0) return null;
    
    const completedCount = steps.filter(s => s.completed).length;
    const percentage = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="mt-12 mb-8 glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Your Progress</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{completedCount} of {steps.length} tasks completed</p>
                </div>
                <div className="text-3xl font-bold gradient-text">{percentage}%</div>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-dark/50 rounded-full overflow-hidden p-1">
                <div 
                    className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                </div>
            </div>
        </div>
    );
};

const PlanDisplay = ({ steps, toggleStep }) => {
    if (steps.length === 0) return null;

    return (
        <div className="space-y-4">
            {steps.map((step, index) => (
                <div 
                    key={step.id || index}
                    onClick={() => toggleStep(index)}
                    className={`glass-panel rounded-xl p-5 cursor-pointer interactive transform hover:-translate-y-2 hover:shadow-2xl ${
                        step.completed ? 'opacity-60 bg-slate-100 dark:bg-dark/40 border-primary/20' : 'hover:border-primary/50'
                    }`}
                >
                    <div className="flex gap-5 items-start">
                        <div className="mt-1">
                            <input 
                                type="checkbox" 
                                className="custom-checkbox"
                                checked={step.completed || false}
                                readOnly
                            />
                        </div>
                        <div className="flex-1">
                            <h4 className={`text-lg font-medium transition-colors ${step.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                {step.title}
                            </h4>
                            <p className={`mt-2 text-sm leading-relaxed ${step.completed ? 'text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                {step.description}
                            </p>
                        </div>
                        <div className="text-5xl font-black text-slate-900/5 dark:text-white/5 pointer-events-none select-none">
                            0{index + 1}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main App ---
const App = () => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [steps, setSteps] = useState([]);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' || 
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return true;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    // Persist API key
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }, [apiKey]);

    const handleGenerate = async (goal) => {
        if (!apiKey) {
            setError("Please enter your Gemini API Key first.");
            return;
        }

        setIsLoading(true);
        setError("");
        
        try {
            const plan = await generatePlan(goal, apiKey);
            // Ensure exactly 5 steps and add completed flag
            const formattedPlan = plan.slice(0, 5).map(step => ({
                ...step,
                completed: false
            }));
            setSteps(formattedPlan);
        } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStep = (index) => {
        setSteps(prev => {
            const newSteps = [...prev];
            newSteps[index] = { ...newSteps[index], completed: !newSteps[index].completed };
            return newSteps;
        });
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6">
            <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
            <div className="max-w-3xl mx-auto">
                <header className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 glass-panel rounded-2xl mb-6 shadow-xl shadow-primary/20 text-primary">
                        <SparklesIcon />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white transition-colors">
                        AI <span className="gradient-text">Goal Planner</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto transition-colors">
                        Turn your ambitions into actionable steps. Enter your goal, and our AI will generate a precise 5-step implementation plan.
                    </p>
                </header>

                <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
                
                <GoalInput onSubmit={handleGenerate} isLoading={isLoading} />

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {steps.length > 0 && (
                    <div className="animate-fade-in-up mt-8">
                        <ProgressBar steps={steps} />
                        <PlanDisplay steps={steps} toggleStep={toggleStep} />
                    </div>
                )}
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
