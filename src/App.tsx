import trainingData from './trainingData';
import { ThemeToggle } from './components/ThemeToggle';
import { Hero } from './components/Hero';
import { RoadTimeline } from './components/RoadTimeline';
import { CurrentBlock } from './components/CurrentBlock';
import { EngineTrends } from './components/EngineTrends';
import { Volume } from './components/Volume';
import { LongRun } from './components/LongRun';
import { MilestoneWall } from './components/MilestoneWall';
import { ThenVsNow } from './components/ThenVsNow';
import { Gear } from './components/Gear';
import { Footer } from './components/Footer';

// Section order is fixed by spec §5.
export default function App() {
  const d = trainingData;
  return (
    <div className="app">
      <ThemeToggle />
      <main>
        <Hero races={d.races} />
        <RoadTimeline phases={d.phases} races={d.races} />
        <CurrentBlock
          phases={d.phases}
          weeks={d.weeks}
          qualitySessions={d.quality_sessions}
          checkpoints={d.checkpoints}
          futurePlan={d.future_plan}
        />
        <EngineTrends
          easyRuns={d.easy_runs}
          monthlyEf={d.monthly_ef}
          qualitySessions={d.quality_sessions}
          targets={d.targets}
          athlete={d.athlete}
        />
        <Volume weeks={d.weeks} futurePlan={d.future_plan} targets={d.targets} />
        <LongRun points={d.long_run_progression} futurePlan={d.future_plan} />
        <MilestoneWall milestones={d.milestones} />
        <ThenVsNow comparisons={d.comparisons} />
      </main>
      <Gear gear={d.gear} />
      <Footer updatedAt={d.updated_at} />
    </div>
  );
}
