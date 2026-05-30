import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '../components/Icon';
import { colors } from '../styles/commonStyles';
import { GEMINI_API_KEY, GEMINI_API_URL } from '../utils/constants';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I\'m your BreedLink AI Assistant. I can help you with cat breeding, care, health, and related topics. What would you like to know about your feline friends today? 🐾',
    sender: 'ai',
    timestamp: new Date(),
  },
];

export default function AIChatScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const callGeminiAPI = async (prompt: string) => {
    try {
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are BreedLink, an in-app AI assistant that helps users with cat breeding, care, health, behavior, and related topics. You must always respond in plain text using the same font style as the app interface. Do not use bold, italics, emojis, or any decorative formatting. No headings, markdown, or code formatting.

Your primary goals:

- Provide accurate, clear, and friendly information about cat care, health, nutrition, hygiene, vaccination, breeding, behavior, and adoption.

- When asked about breeding, always emphasize responsible and ethical breeding practices, including health checks, age suitability, and veterinary guidance.

- Avoid giving medical diagnoses or prescriptions. Instead, encourage users to consult a certified veterinarian for any serious or emergency health concerns.

Formatting rules:

- Always write in plain text only.

- When giving step-by-step instructions, use this format:

  1. Start with the first step.



  2. Leave one blank line between each step.



  3. Each step must be concise, begin with a capital letter, and use plain language.

Safety & content filtering:

- Refuse or redirect any inappropriate, unsafe, harmful, or unrelated requests.

- Never provide content involving violence, illegal activity, or unsafe animal practices.

- If uncertain, guide users to seek professional veterinary advice or official resources.

Tone and style:

- Use a warm, caring, and supportive tone.

- Be friendly and approachable, but stay factual and professional.

- Keep answers concise and relevant unless the user requests more detail.

User question: ${prompt}`
          }]
        }]
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.output ||
        data.candidates?.[0]?.content?.[0]?.text ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        data.output?.[0]?.content?.text ||
        "I'm having trouble processing your request right now. Please try again.";

      return responseText;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "I'm having trouble connecting to the AI service right now. Please check your internet connection and try again. If the problem persists, the AI might be temporarily unavailable.";
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const newUserMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputText('');
      setIsTyping(true);
      
      try {
        const aiResponse = await callGeminiAPI(inputText.trim());
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error processing your request. Please try again.",
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    
    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Icon name="chatbubbles" size={20} color={colors.white} />
          </View>
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
              {message.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.aiMessage]}>
        <View style={styles.aiAvatar}>
          <Icon name="chatbubbles" size={20} color={colors.white} />
        </View>
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
            <View style={styles.typingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.aiHeaderAvatar}>
              <Icon name="chatbubbles" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.aiName}>BreedLink AI Assistant</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about cat breeding..."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
              onPress={inputText.trim() ? handleSendMessage : undefined}
              disabled={!inputText.trim()}
            >
              <Icon 
                name="send" 
                size={20} 
                color={inputText.trim() ? colors.white : colors.textLight} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  aiName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  onlineStatus: {
    fontSize: 14,
    color: colors.success,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 6,
    position: 'absolute',
    left: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 6,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.white,
  },
  aiMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 16,
  },
  userTimestamp: {
    alignSelf: 'flex-end',
  },
  aiTimestamp: {
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 6,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});