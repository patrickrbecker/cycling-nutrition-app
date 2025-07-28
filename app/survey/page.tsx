'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, Droplets, Zap, AlertCircle, Coffee, Target } from 'lucide-react';
import Head from 'next/head';

interface SurveyData {
  weight: number;
  sweatRate: 'light' | 'moderate' | 'heavy';
  intensity: 'easy' | 'moderate' | 'hard' | 'mixed';
  giSensitivity: 'sensitive' | 'normal' | 'tolerant';
  previousIssues: string[];
  preferredFuels: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  name: string;
}

const INITIAL_DATA: SurveyData = {
  weight: 150,
  sweatRate: 'moderate',
  intensity: 'moderate',
  giSensitivity: 'normal',
  previousIssues: [],
  preferredFuels: [],
  experienceLevel: 'intermediate',
  name: ''
};

export default function NutritionSurvey() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>(INITIAL_DATA);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save survey data and redirect to main app
      localStorage.setItem('nutritionProfile', JSON.stringify(surveyData));
      router.push('/?profile=true');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  const handleArrayToggle = (field: keyof SurveyData, value: string) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }));
  };

  const steps = [
    // Step 1: Personal Info
    {
      title: "Let's Get Started",
      icon: <User className="w-8 h-8 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">What&apos;s your name?</label>
            <input
              type="text"
              value={surveyData.name}
              onChange={(e) => setSurveyData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Body Weight (lbs)</label>
            <input
              type="number"
              value={surveyData.weight}
              onChange={(e) => setSurveyData(prev => ({ ...prev, weight: Number(e.target.value) }))}
              className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
              min="100"
              max="300"
            />
            <p className="text-sm text-blue-200 mt-1">Used to calculate personalized carb and fluid needs</p>
          </div>
        </div>
      )
    },

    // Step 2: Sweat Rate
    {
      title: "How Much Do You Sweat?",
      icon: <Droplets className="w-8 h-8 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">This affects your electrolyte and fluid replacement needs</p>
          {[
            { value: 'light', label: 'Light Sweater', desc: 'Barely sweat during rides, stay relatively dry' },
            { value: 'moderate', label: 'Moderate Sweater', desc: 'Noticeable sweat, but not dripping' },
            { value: 'heavy', label: 'Heavy Sweater', desc: 'Sweat profusely, clothes soaked, salt stains' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSurveyData(prev => ({ ...prev, sweatRate: option.value as 'light' | 'moderate' | 'heavy' }))}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                surveyData.sweatRate === option.value
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80">{option.desc}</div>
            </button>
          ))}
        </div>
      )
    },

    // Step 3: Ride Intensity
    {
      title: "What's Your Typical Ride Intensity?",
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">Higher intensity requires more frequent fueling</p>
          {[
            { value: 'easy', label: 'Easy/Recovery', desc: 'Conversational pace, zone 1-2' },
            { value: 'moderate', label: 'Moderate/Endurance', desc: 'Steady effort, zone 2-3' },
            { value: 'hard', label: 'Hard/Threshold', desc: 'Challenging pace, zone 3-4' },
            { value: 'mixed', label: 'Mixed Intensity', desc: 'Intervals, group rides, racing' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSurveyData(prev => ({ ...prev, intensity: option.value as 'easy' | 'moderate' | 'hard' | 'mixed' }))}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                surveyData.intensity === option.value
                  ? 'bg-yellow-600 border-yellow-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80">{option.desc}</div>
            </button>
          ))}
        </div>
      )
    },

    // Step 4: GI Sensitivity
    {
      title: "How's Your Stomach During Rides?",
      icon: <AlertCircle className="w-8 h-8 text-green-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">This helps us recommend the right fuel timing and types</p>
          {[
            { value: 'sensitive', label: 'Sensitive Stomach', desc: 'Often experience nausea or stomach issues during rides' },
            { value: 'normal', label: 'Normal Tolerance', desc: 'Occasional minor issues but generally fine' },
            { value: 'tolerant', label: 'Iron Stomach', desc: 'Can eat/drink anything during rides without issues' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSurveyData(prev => ({ ...prev, giSensitivity: option.value as 'sensitive' | 'normal' | 'tolerant' }))}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                surveyData.giSensitivity === option.value
                  ? 'bg-green-600 border-green-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80">{option.desc}</div>
            </button>
          ))}
        </div>
      )
    },

    // Step 5: Previous Issues
    {
      title: "Any Past Fueling Issues?",
      icon: <AlertCircle className="w-8 h-8 text-red-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">Select any issues you&apos;ve experienced (optional)</p>
          {[
            'Bonking/hitting the wall',
            'Nausea during rides',
            'Stomach cramping',
            'Dehydration',
            'Muscle cramps',
            'Energy crashes',
            'Never had issues'
          ].map(issue => (
            <button
              key={issue}
              onClick={() => handleArrayToggle('previousIssues', issue)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                surveyData.previousIssues.includes(issue)
                  ? 'bg-red-600 border-red-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {issue}
            </button>
          ))}
        </div>
      )
    },

    // Step 6: Fuel Preferences
    {
      title: "What Fuels Do You Prefer?",
      icon: <Coffee className="w-8 h-8 text-orange-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">Select your preferred fuel types (choose multiple)</p>
          {[
            'Energy gels',
            'Sports drinks',
            'Energy bars',
            'Real food (bananas, dates)',
            'Electrolyte tablets',
            'Energy chews/blocks',
            'Homemade options'
          ].map(fuel => (
            <button
              key={fuel}
              onClick={() => handleArrayToggle('preferredFuels', fuel)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                surveyData.preferredFuels.includes(fuel)
                  ? 'bg-orange-600 border-orange-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {fuel}
            </button>
          ))}
        </div>
      )
    },

    // Step 7: Experience Level
    {
      title: "What's Your Cycling Experience?",
      icon: <Target className="w-8 h-8 text-purple-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-blue-200 mb-6">This helps us tailor recommendations to your level</p>
          {[
            { value: 'beginner', label: 'Beginner', desc: 'New to cycling or endurance sports' },
            { value: 'intermediate', label: 'Intermediate', desc: 'Regular rider with some long rides under your belt' },
            { value: 'advanced', label: 'Advanced', desc: 'Experienced cyclist, racing or very long rides' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setSurveyData(prev => ({ ...prev, experienceLevel: option.value as 'beginner' | 'intermediate' | 'advanced' }))}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                surveyData.experienceLevel === option.value
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-80">{option.desc}</div>
            </button>
          ))}
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0: return surveyData.name.trim().length > 0 && surveyData.weight > 0;
      case 4: return surveyData.previousIssues.length > 0;
      case 5: return surveyData.preferredFuels.length > 0;
      default: return true;
    }
  };

  return (
    <>
      <Head>
        <title>Create Your Personalized Cycling Nutrition Profile | Cycling Fuel Planner</title>
        <meta name="description" content="Create a personalized nutrition profile for optimal cycling performance. Answer 7 quick questions about your sweat rate, intensity, and preferences to get custom fuel timing recommendations." />
        <meta name="keywords" content="cycling nutrition profile, personalized cycling nutrition, cycling fuel assessment, sports nutrition survey, cycling performance optimization" />
        <meta property="og:title" content="Create Your Personalized Cycling Nutrition Profile" />
        <meta property="og:description" content="Answer 7 quick questions to get personalized cycling nutrition recommendations based on your unique needs and preferences." />
        <meta property="og:url" content="https://cycling-nutrition-app.vercel.app/survey" />
        <meta name="twitter:title" content="Create Your Personalized Cycling Nutrition Profile" />
        <meta name="twitter:description" content="Get custom cycling nutrition recommendations in just 7 quick questions." />
        <link rel="canonical" href="https://cycling-nutrition-app.vercel.app/survey" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Personalized Nutrition Profile</h1>
          <p className="text-blue-200">Help us create your custom fueling strategy</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step */}
        <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            {steps[currentStep].icon}
            <h2 className="text-2xl font-semibold">{steps[currentStep].title}</h2>
          </div>
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            {currentStep === steps.length - 1 ? 'Complete Profile' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>
    </>
  );
}