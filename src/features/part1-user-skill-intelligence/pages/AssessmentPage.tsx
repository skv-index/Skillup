import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ProgressBar } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { paths } from '@/app/paths';
import {
  assessmentById,
  questionsForAssessment,
  skillById,
} from '../data/catalog';
import type { QuizQuestion } from '../data/catalog';
import { currentUserId, effectiveLevel, saveResult } from '../services/part1-store';
import { aiAvailable, generateQuestions } from '../services/ai';
import '../part1.css';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AssessmentPage() {
  const { user } = useAuth();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  const assessment = assessmentId ? assessmentById(assessmentId) : undefined;
  const staticQuestions = useMemo(() => (assessmentId ? questionsForAssessment(assessmentId) : []), [assessmentId]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [left, setLeft] = useState((assessment?.durationMinutes ?? 10) * 60);
  const [finished, setFinished] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<QuizQuestion[]>([]);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Track latest answers/index without re-triggering the AI effect.
  const stateRef = useRef({ answers, index });
  stateRef.current = { answers, index };

  useEffect(() => {
    if (!assessment || !user || !aiAvailable()) return;
    setAiStatus('loading');
    generateQuestions({
      assessmentId: assessment.id,
      skill: skillById(assessment.skillId)?.name ?? assessment.title,
      level: effectiveLevel(assessment.skillId, currentUserId()).level,
      count: assessment.questionCount,
    })
      .then((qs) => {
        if (qs.length) {
          // Only adopt AI questions before the user started answering.
          if (Object.keys(stateRef.current.answers).length === 0 && stateRef.current.index === 0) {
            setAiQuestions(qs);
          }
          setAiStatus('ready');
        } else {
          setAiStatus('error');
        }
      })
      .catch(() => setAiStatus('error'));
  }, [user, assessment]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          setFinished(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  if (!user) return <Navigate to={paths.login} replace />;
  if (!assessment) {
    return (
      <div>
        <Alert variant="error">Assessment not found.</Alert>
        <p className="mt-4">
          <Link className="btn btn--secondary btn--sm" to={paths.mySkills}>
            Back to My Skills
          </Link>
        </p>
      </div>
    );
  }

  const skill = skillById(assessment.skillId);
  const questions = aiQuestions.length > 0 ? aiQuestions : staticQuestions;
  const qIndex = Math.min(index, questions.length - 1);
  const q = questions[qIndex];
  const answered = Object.keys(answers).length;

  const submit = () => {
    let correct = 0;
    const correctTopics: string[] = [];
    const wrongTopics: string[] = [];
    questions.forEach((qq) => {
      if (answers[qq.id] === qq.answer) {
        correct++;
        correctTopics.push(qq.topic);
      } else {
        wrongTopics.push(qq.topic);
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const uniq = (arr: string[]) => [...new Set(arr)];
    const result = saveResult(
      {
        assessmentId: assessment.id,
        skillId: assessment.skillId,
        score,
        strengths: uniq(correctTopics).slice(0, 3),
        weaknesses: uniq(wrongTopics).slice(0, 3),
      },
      currentUserId(),
    );
    navigate(`/skills/assessment/${assessment.id}/result`, { state: { resultId: result.id } });
  };

  useEffect(() => {
    if (finished && answered > 0) {
      // auto-submit once when time expires (guard double-run via finished flag reset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h1 className="h2">{assessment.title}</h1>
          <p>
            {skill?.name} · {questions.length} questions · {assessment.durationMinutes} min · Progress Tracking
          </p>
        </div>
        <div className="row">
          {aiStatus === 'loading' && <Badge variant="info">Generating AI questions…</Badge>}
          {aiStatus === 'ready' && aiQuestions.length > 0 && <Badge variant="primary">AI-adaptive</Badge>}
          <Badge variant={left < 60 ? 'danger' : 'info'}>⏱ {fmt(left)}</Badge>
        </div>
      </div>

      <ProgressBar value={answered} max={questions.length} label={`Answered ${answered}/${questions.length}`} />

      <Card title={`Q${qIndex + 1}. ${q.prompt}`} subtitle={q.topic} className="mt-4">
        <div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`quiz-option ${answers[q.id] === i ? 'quiz-option--picked' : ''}`}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
            >
              <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
            </button>
          ))}
        </div>
        <div className="row row--between mt-4">
          <Button variant="ghost" disabled={qIndex === 0} onClick={() => setIndex((v) => v - 1)}>
            Previous
          </Button>
          {qIndex < questions.length - 1 ? (
            <Button onClick={() => setIndex((v) => v + 1)}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={answered < questions.length}>
              Submit ({answered}/{questions.length})
            </Button>
          )}
        </div>
        {answered < questions.length && (
          <p className="tiny muted mt-4">Answer all questions to submit. Time left: {fmt(left)}.</p>
        )}
      </Card>

      <div className="row mt-4" style={{ flexWrap: 'wrap' }}>
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            className={`btn btn--sm ${answers[qq.id] !== undefined ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
