import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Brain } from "lucide-react";

const generateMathQuestion = () => {
  const operations = ['+', '-', '×'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let a, b, answer;
  
  switch (operation) {
    case '+':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 50) + 10;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 50) + 30;
      b = Math.floor(Math.random() * 30) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
      break;
    default:
      a = 10;
      b = 5;
      answer = 15;
  }
  
  return {
    question: `${a} ${operation} ${b} = ?`,
    answer: answer,
  };
};

const MathChallengeDialog = ({ open, onOpenChange, onSuccess }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect', null
  const [correctCount, setCorrectCount] = useState(0);

  const TOTAL_QUESTIONS = 5;

  useEffect(() => {
    if (open) {
      // Generate 5 new questions when dialog opens
      const newQuestions = Array.from({ length: TOTAL_QUESTIONS }, () => generateMathQuestion());
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setUserAnswer("");
      setFeedback(null);
      setCorrectCount(0);
    }
  }, [open]);

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = parseInt(userAnswer) === currentQuestion.answer;

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < TOTAL_QUESTIONS - 1) {
        setCurrentIndex(prev => prev + 1);
        setUserAnswer("");
        setFeedback(null);
      } else {
        // All questions answered
        if (isCorrect && correctCount + 1 === TOTAL_QUESTIONS) {
          // All correct!
          onSuccess();
          onOpenChange(false);
        } else if (!isCorrect || correctCount + (isCorrect ? 1 : 0) < TOTAL_QUESTIONS) {
          // Failed - reset
          const newQuestions = Array.from({ length: TOTAL_QUESTIONS }, () => generateMathQuestion());
          setQuestions(newQuestions);
          setCurrentIndex(0);
          setUserAnswer("");
          setFeedback(null);
          setCorrectCount(0);
        }
      }
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userAnswer && feedback === null) {
      handleSubmitAnswer();
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / TOTAL_QUESTIONS) * 100;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Math Challenge
          </AlertDialogTitle>
          <AlertDialogDescription>
            Solve {TOTAL_QUESTIONS} math problems correctly to update your calorie goal.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</span>
              <span>{correctCount} correct</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="text-center space-y-4">
              <div className="text-3xl font-bold text-foreground py-4">
                {currentQuestion.question}
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Your answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={feedback !== null}
                  className="text-center text-lg"
                  autoFocus
                />
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!userAnswer || feedback !== null}
                >
                  Check
                </Button>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`flex items-center justify-center gap-2 text-lg font-medium ${
                  feedback === 'correct' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {feedback === 'correct' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Wrong! Answer was {currentQuestion.answer}. Starting over...
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MathChallengeDialog;
