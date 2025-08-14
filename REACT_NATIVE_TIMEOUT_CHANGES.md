# 📱 React Native Timeout Changes Guide

## 🔧 **Required Changes in React Native App**

### **1. Update `opponent_answered` Event Handler**

आपके current code में यह है:
```javascript
// Current code
socket.on('opponent_answered', (data: { questionIndex: number; answer: number }) => {
  console.log('👥 Opponent answered event received:', data);
  setBattleState(prev => ({
    ...prev,
    opponentAnswers: {
      ...prev.opponentAnswers,
      [data.questionIndex]: data.answer
    }
  }));
});
```

**Change to:**
```javascript
// Updated code with timeout support
socket.on('opponent_answered', (data: { 
  questionIndex: number; 
  answer: number | null; 
  timedOut?: boolean 
}) => {
  console.log('👥 Opponent answered event received:', data);
  
  if (data.timedOut) {
    // Handle timeout case
    console.log('⏰ Opponent timed out on question:', data.questionIndex);
    
    // Show timeout message to user
    Alert.alert(
      'Opponent Timed Out',
      `Opponent didn't answer question ${data.questionIndex + 1} in time.`,
      [{ text: 'OK' }]
    );
    
    // Disable answer buttons temporarily
    setAnswerButtonsDisabled(true);
    
    // Re-enable after 2 seconds
    setTimeout(() => {
      setAnswerButtonsDisabled(false);
    }, 2000);
    
  } else {
    // Normal answer case
    setBattleState(prev => ({
      ...prev,
      opponentAnswers: {
        ...prev.opponentAnswers,
        [data.questionIndex]: data.answer
      }
    }));
  }
});
```

### **2. Add State for Answer Button Control**

```javascript
// Add this state
const [answerButtonsDisabled, setAnswerButtonsDisabled] = useState(false);
```

### **3. Update Answer Button Component**

```javascript
// In your answer button component
<TouchableOpacity
  style={[
    answerButtonStyle,
    answerButtonsDisabled && { opacity: 0.5 }
  ]}
  onPress={() => handleAnswer(optionIndex)}
  disabled={answerButtonsDisabled}
>
  <Text>{option}</Text>
</TouchableOpacity>
```

### **4. Add Timeout Message Display**

```javascript
// Add timeout message state
const [timeoutMessage, setTimeoutMessage] = useState('');

// In your render method
{timeoutMessage && (
  <View style={styles.timeoutMessage}>
    <Text style={styles.timeoutText}>{timeoutMessage}</Text>
  </View>
)}

// Add styles
const styles = StyleSheet.create({
  timeoutMessage: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  timeoutText: {
    color: '#c62828',
    textAlign: 'center',
    fontWeight: 'bold'
  }
});
```

### **5. Enhanced Timeout Handling**

```javascript
// More comprehensive timeout handler
const handleOpponentTimeout = (questionIndex: number) => {
  console.log('⏰ Handling opponent timeout for question:', questionIndex);
  
  // Show timeout message
  setTimeoutMessage(`Opponent timed out on question ${questionIndex + 1}`);
  
  // Disable answer buttons
  setAnswerButtonsDisabled(true);
  
  // Clear timeout message after 3 seconds
  setTimeout(() => {
    setTimeoutMessage('');
    setAnswerButtonsDisabled(false);
  }, 3000);
  
  // Update battle state to show opponent didn't answer
  setBattleState(prev => ({
    ...prev,
    opponentAnswers: {
      ...prev.opponentAnswers,
      [questionIndex]: null // null indicates no answer
    }
  }));
};

// Updated event handler
socket.on('opponent_answered', (data: { 
  questionIndex: number; 
  answer: number | null; 
  timedOut?: boolean 
}) => {
  console.log('👥 Opponent answered event received:', data);
  
  if (data.timedOut) {
    handleOpponentTimeout(data.questionIndex);
  } else {
    // Normal answer handling
    setBattleState(prev => ({
      ...prev,
      opponentAnswers: {
        ...prev.opponentAnswers,
        [data.questionIndex]: data.answer
      }
    }));
  }
});
```

### **6. Add Visual Indicators for Timeout**

```javascript
// In your answer display component
const renderOpponentAnswer = (questionIndex: number) => {
  const opponentAnswer = battleState.opponentAnswers[questionIndex];
  
  if (opponentAnswer === null) {
    // Opponent timed out
    return (
      <View style={styles.timeoutIndicator}>
        <Text style={styles.timeoutText}>⏰ Timed Out</Text>
      </View>
    );
  } else if (opponentAnswer !== undefined) {
    // Opponent answered
    return (
      <View style={styles.answerIndicator}>
        <Text>Opponent: Option {opponentAnswer + 1}</Text>
      </View>
    );
  }
  
  return null;
};
```

### **7. Complete Updated Component Example**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { io } from 'socket.io-client';

export default function BattleQuizScreen() {
  const [battleState, setBattleState] = useState({
    status: 'waiting',
    currentQuestion: 0,
    timeLeft: 15,
    answers: {},
    opponentAnswers: {}
  });
  
  const [answerButtonsDisabled, setAnswerButtonsDisabled] = useState(false);
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const socket = useRef(null);
  
  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://your-server:3001');
    
    // Setup event listeners
    socket.current.on('opponent_answered', (data: { 
      questionIndex: number; 
      answer: number | null; 
      timedOut?: boolean 
    }) => {
      console.log('👥 Opponent answered event received:', data);
      
      if (data.timedOut) {
        handleOpponentTimeout(data.questionIndex);
      } else {
        setBattleState(prev => ({
          ...prev,
          opponentAnswers: {
            ...prev.opponentAnswers,
            [data.questionIndex]: data.answer
          }
        }));
      }
    });
    
    // Other event listeners...
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);
  
  const handleOpponentTimeout = (questionIndex: number) => {
    console.log('⏰ Handling opponent timeout for question:', questionIndex);
    
    setTimeoutMessage(`Opponent timed out on question ${questionIndex + 1}`);
    setAnswerButtonsDisabled(true);
    
    setTimeout(() => {
      setTimeoutMessage('');
      setAnswerButtonsDisabled(false);
    }, 3000);
    
    setBattleState(prev => ({
      ...prev,
      opponentAnswers: {
        ...prev.opponentAnswers,
        [questionIndex]: null
      }
    }));
  };
  
  const handleAnswer = (answerIndex: number) => {
    if (answerButtonsDisabled) return;
    
    // Your existing answer logic
    socket.current.emit('answer_question', {
      matchId: 'your-match-id',
      questionIndex: battleState.currentQuestion,
      answerIndex: answerIndex,
      timeSpent: 15 - battleState.timeLeft
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Timeout message */}
      {timeoutMessage && (
        <View style={styles.timeoutMessage}>
          <Text style={styles.timeoutText}>{timeoutMessage}</Text>
        </View>
      )}
      
      {/* Question and answer buttons */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Question {battleState.currentQuestion + 1}</Text>
        
        {/* Answer buttons */}
        {['Option A', 'Option B', 'Option C', 'Option D'].map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              answerButtonsDisabled && styles.disabledButton
            ]}
            onPress={() => handleAnswer(index)}
            disabled={answerButtonsDisabled}
          >
            <Text style={styles.answerText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Opponent answer display */}
      {renderOpponentAnswer(battleState.currentQuestion)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  timeoutMessage: {
    backgroundColor: '#ffebee',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  timeoutText: {
    color: '#c62828',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  questionContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  answerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  timeoutIndicator: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  }
});
```

## ✅ **Summary of Changes**

1. **Update `opponent_answered` event handler** to handle `timedOut` flag
2. **Add state management** for button disabling and timeout messages
3. **Add visual feedback** for timeout scenarios
4. **Update UI components** to show timeout indicators
5. **Add proper error handling** for timeout cases

## 🎯 **Key Benefits**

- ✅ Users get clear feedback when opponent times out
- ✅ Answer buttons are temporarily disabled during timeout
- ✅ Visual indicators show opponent's timeout status
- ✅ Smooth user experience during timeout scenarios
- ✅ Proper state management for timeout cases

**🚀 These changes will make your React Native app fully compatible with the new timeout functionality!** 