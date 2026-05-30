import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '../components/Icon';
import { colors } from '../styles/commonStyles';
import BottomNavigation from '../components/BottomNavigation';
import MutualAgreement from './agreement'; // Import the agreement component
import { supabase } from '../supabase';
import CustomAlert from '../components/CustomAlert'; // Import CustomAlert


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hi! I saw your cat Luna and she looks adorable! 😍',
    sender: 'user',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    text: 'Thank you! Luna is indeed a sweetheart. Are you interested in meeting her?',
    sender: 'other',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    text: 'Yes, I would love to! When would be a good time?',
    sender: 'user',
    timestamp: new Date(Date.now() - 3400000),
  },
  {
    id: '4',
    text: 'How about this weekend? We could meet at the local park.',
    sender: 'other',
    timestamp: new Date(Date.now() - 3300000),
  },
];

const emojiShortcuts = ['😊', '😍', '🐾', '❤️', '👍', '😂', '🥰', '😘'];

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false); // Add state for showing agreement

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [myCatProfile, setMyCatProfile] = useState<string | null>(null);
  const [matchedCatProfile, setMatchedCatProfile] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const matchId = params.chatId; // We'll use this to identify the match
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
const [messagesSubscription, setMessagesSubscription] = useState<any>(null);

// Custom alert states
const [cancelAlert, setCancelAlert] = useState({
  visible: false,
  title: '',
  message: '',
  type: 'warning' as 'warning' | 'success' | 'error' | 'info',
});

const [completeAlert, setCompleteAlert] = useState({
  visible: false,
  title: '',
  message: '',
  type: 'warning' as 'warning' | 'success' | 'error' | 'info',
});

  // Support both single cat and breeding chat modes
  const catName = params.catName as string || 'Cat';
  const catImage = params.catImage as string || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop';
  
  // Breeding chat parameters
  const myCatName = params.myCatName as string;
  const matchedCatName = params.matchedCatName as string;
  const myCatImage = params.myCatImage as string;
  const matchedCatImage = params.matchedCatImage as string;
  const myCatBreed = params.myCatBreed as string;
  const matchedCatBreed = params.matchedCatBreed as string;
  const myCatGender = params.myCatGender as string;
  const matchedCatGender = params.matchedCatGender as string;
  
  const isBreedingChat = !!myCatName && !!matchedCatName;

  console.log('ChatScreen rendered with params:', params);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [matchData, setMatchData] = useState<any>(null);

useEffect(() => {
  // Fetch current user ID
  const fetchSession = async () => {
    const { data } = await supabase.auth.getSession();
    setCurrentUserId(data?.session?.user?.id || null);
  };

  // Fetch match data from Supabase
  const fetchMatch = async () => {
    if (!matchId) return;
    const { data, error } = await supabase
      .from("matchmaking")
      .select(`
        match_id,
        requester_id,
        receiver_id,
        owner_requester:requester_id(name),
        owner_receiver:receiver_id(name)
      `)
      .eq("match_id", matchId)
      .single();

    if (error) console.error("Error fetching match:", error);
    else setMatchData(data);
  };

  const fetchAgreementStatus = async () => {
    if (!matchId) return;
    const { data, error } = await supabase
      .from("agreements")
      .select("signed_by_owner1, signed_by_owner2")
      .eq("match_id", matchId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching agreement:", error);
      setAgreementSigned(false);
    } else if (data) {
      setAgreementSigned(data.signed_by_owner1 && data.signed_by_owner2);
    } else {
      setAgreementSigned(false);
    }
  };

  fetchSession();
  fetchMatch();
  fetchAgreementStatus();
}, [matchId]);




  useEffect(() => {
    // Simulate typing indicator
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(typingTimer);
  }, [messages]);

  // Fetch messages from database
const fetchMessages = async () => {
  if (!matchId) return;
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return;
  }

  // Transform database messages to your Message interface
  const transformedMessages: Message[] = (data || []).map(msg => ({
    id: msg.message_id.toString(),
    text: msg.message,
    sender: msg.sender_id === currentUserId ? 'user' : 'other',
    timestamp: new Date(msg.created_at),
  }));

  setMessages(transformedMessages);
};

// Set up real-time subscription for new messages
useEffect(() => {
  if (!matchId || !currentUserId) return;

  // Initial fetch
  fetchMessages();

  // Mark all messages from other user as read
  const markMessagesAsRead = async () => {
    console.log(`🔵 Marking messages as read for match ${matchId}, receiver: ${currentUserId}`);
    
    // Update all messages for this match where I am the receiver to is_read = true
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .eq('receiver_id', currentUserId)
      .select();

    if (error) {
      console.log('⚠️ Error updating is_read:', error.message);
    } else {
      console.log(`✅ Successfully marked ${data?.length || 0} messages as read`);
    }
  };

  markMessagesAsRead();

  // Subscribe to new messages
  const subscription = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const newMsg = payload.new;
        const transformedMsg: Message = {
          id: newMsg.message_id.toString(),
          text: newMsg.message,
          sender: newMsg.sender_id === currentUserId ? 'user' : 'other',
          timestamp: new Date(newMsg.created_at),
        };
        setMessages(prev => [...prev, transformedMsg]);
        
        // Mark new message as read if it's from the other user
        if (newMsg.sender_id !== currentUserId) {
          supabase
            .from('messages')
            .update({ is_read: true })
            .eq('message_id', newMsg.message_id)
            .then(({ error }) => {
              if (error) {
                console.log('Could not mark message as read:', error.message);
              }
            });
        }
      }
    )
    .subscribe();

  setMessagesSubscription(subscription);

  // Cleanup subscription on unmount
  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
}, [matchId, currentUserId]);

  const handleSendMessage = async () => {
  if (inputText.trim() && currentUserId && matchData) {
    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately
    
    // Determine receiver_id
    const receiverId = currentUserId === matchData.requester_id 
      ? matchData.receiver_id 
      : matchData.requester_id;

    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          match_id: matchId,
          sender_id: currentUserId,
          receiver_id: receiverId,
          message: messageText,
          is_read: false,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setInputText(messageText); // Restore text if failed
      return;
    }

    console.log('Message sent successfully:', data);
  }
};

  const handleEmojiPress = (emoji: string) => {
    setInputText(prev => prev + emoji);
    console.log('Emoji added:', emoji);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';
    // Determine avatar based on sender
    const avatarUri = isUser 
      ? (isBreedingChat ? decodeURIComponent(myCatImage) : decodeURIComponent(catImage))
      : (isBreedingChat ? decodeURIComponent(matchedCatImage) : decodeURIComponent(catImage));
    
    return (
      <View key={message.id} style={[styles.messageRow, isUser ? styles.userMessageRow : styles.otherMessageRow]}>
        {!isUser && (
          <Image 
            source={{ uri: avatarUri }} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.otherMessage]}>
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
              {message.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.otherTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
        {isUser && (
          <Image 
            source={{ uri: avatarUri }} 
            style={styles.messageAvatar} 
          />
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.otherMessage]}>
        <View style={[styles.messageBubble, styles.otherBubble, styles.typingBubble]}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
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
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          {isBreedingChat ? (
            <View style={styles.headerInfo}>
              <View style={styles.dualCatHeader}>
                <View style={styles.catGroup}>
                  <Image source={{ uri: decodeURIComponent(myCatImage) }} style={styles.smallCatAvatar} />
                  <Image source={{ uri: decodeURIComponent(matchedCatImage) }} style={[styles.smallCatAvatar, styles.overlappedAvatar]} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.breedChatTitle}>
                    {myCatName} 🐱 x {matchedCatName} 🐱
                  </Text>
                  <Text style={styles.breedInfo}>
                    {myCatBreed} {myCatGender === 'male' ? '♂' : '♀'} x {matchedCatBreed} {matchedCatGender === 'male' ? '♂' : '♀'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.headerInfo}>
              <Image source={{ uri: decodeURIComponent(catImage) }} style={styles.catAvatar} />
              <View style={styles.headerText}>
                <Text style={styles.catName}>{catName}</Text>
                <Text style={styles.onlineStatus}>Online</Text>
              </View>
            </View>
          )}
          
          <View>
  <TouchableOpacity 
    style={styles.moreButton} 
    onPress={() => setMenuVisible(!menuVisible)}
  >
    <Icon name="ellipsis-vertical" size={24} color={colors.text} />
  </TouchableOpacity>

  {menuVisible && (
    <View style={styles.menuContainer}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          setMenuVisible(false);
          setShowAgreement(true); // Show agreement modal instead of navigating
        }}
      >
        <Text style={styles.menuText}>View Agreement</Text>
      </TouchableOpacity>

        <TouchableOpacity
  style={[
    styles.menuItem,
    !agreementSigned && { opacity: 0.5 } // Dull look when disabled
  ]}
  disabled={!agreementSigned} // Disable button when not signed
  onPress={() => {
    if (!agreementSigned) return; // Safety check
    setMenuVisible(false);
    // Show custom alert instead of old confirmation overlay
    setCompleteAlert({
      visible: true,
      type: 'warning',
      title: 'Complete Match?',
      message: 'Are you sure you want to mark this breeding match as completed? This will move it out of active chats.'
    });
  }}
>
  <Text
    style={[
      styles.menuText,
      { color: agreementSigned ? colors.primary : colors.textLight }
    ]}
  >
    Mark as Completed
  </Text>
</TouchableOpacity>

<TouchableOpacity 
  style={[
    styles.menuItem,
    agreementSigned && { opacity: 0.5 } // faded look
  ]}
  disabled={agreementSigned}
  onPress={() => {
    if (agreementSigned) return; // safety check
    setMenuVisible(false);
    // Show custom alert instead of old confirmation overlay
    setCancelAlert({
      visible: true,
      type: 'warning',
      title: 'Cancel Match?',
      message: 'Do you really want to cancel this breeding match? This action cannot be undone.'
    });
  }}
>
  <Text 
    style={[
      styles.menuText, 
      { color: agreementSigned ? colors.textLight : 'red' }
    ]}
  >
    Cancel Match
  </Text>
</TouchableOpacity>


    </View>
  )}
</View>

        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          {renderTypingIndicator()}
        </ScrollView>

        {/* Emoji Shortcuts */}
        <View style={styles.emojiContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiContent}
          >
            {emojiShortcuts.map((emoji, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.emojiButton}
                onPress={() => handleEmojiPress(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={() => setShowAgreement(true)}
            >
              <Icon name="document-text" size={20} color={colors.textLight} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={isBreedingChat ? "Type message to discuss breeding..." : "Type a message..."}
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity 
              style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
              onPress={handleSendMessage}
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

      {/* Agreement Modal */}
      {matchData && (
  <MutualAgreement
    visible={showAgreement}
    onClose={() => setShowAgreement(false)}
    onProceed={() => {
      setShowAgreement(false);
      console.log("Agreement proceeded");
    }}
    ownerA={{ id: matchData.requester_id, name: matchData.owner_requester?.name || "Owner A" }}
    ownerB={{ id: matchData.receiver_id, name: matchData.owner_receiver?.name || "Owner B" }}
    currentUserId={currentUserId}
    catA={{ id: "catA", name: myCatName || catName }}
    catB={{ id: "catB", name: matchedCatName || "Other Cat" }}
    matchId={matchId ? Number(matchId) : undefined} // ✅ Add this line
  />
)}

      {/* Custom Alerts */}
      <CustomAlert
        visible={cancelAlert.visible}
        type={cancelAlert.type}
        title={cancelAlert.title}
        message={cancelAlert.message}
        confirmText="Yes, Cancel"
        cancelText="No"
        showCancelButton={true}
        onConfirm={async () => {
          setCancelAlert({ ...cancelAlert, visible: false });
          try {
            const { error } = await supabase
              .from('matchmaking')
              .update({ status: 'rejected' })
              .eq('match_id', matchId);

            if (error) {
              console.error('Error cancelling match:', error);
              setCancelAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to cancel match. Please try again.'
              });
            } else {
              setCancelAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Match cancelled successfully.'
              });
              // Close the success alert and navigate after a delay
              setTimeout(() => {
                setCancelAlert({ ...cancelAlert, visible: false });
                router.replace('/breed-chat-list');
              }, 2000);
            }
          } catch (err) {
            console.error('Unexpected error:', err);
            setCancelAlert({
              visible: true,
              type: 'error',
              title: 'Error',
              message: 'An unexpected error occurred.'
            });
          }
        }}
        onCancel={() => setCancelAlert({ ...cancelAlert, visible: false })}
      />

      <CustomAlert
        visible={completeAlert.visible}
        type={completeAlert.type}
        title={completeAlert.title}
        message={completeAlert.message}
        confirmText="Yes, Complete"
        cancelText="No"
        showCancelButton={true}
        onConfirm={async () => {
          setCompleteAlert({ ...completeAlert, visible: false });
          try {
            const { error } = await supabase
              .from('matchmaking')
              .update({ status: 'completed' })
              .eq('match_id', matchId);

            if (error) {
              console.error('Error completing match:', error);
              setCompleteAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to complete match. Please try again.'
              });
            } else {
              setCompleteAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Match marked as completed!'
              });
              // Close the success alert and navigate after a delay
              setTimeout(() => {
                setCompleteAlert({ ...completeAlert, visible: false });
                router.replace('/breed-chat-list');
              }, 2000);
            }
          } catch (err) {
            console.error('Unexpected error:', err);
            setCompleteAlert({
              visible: true,
              type: 'error',
              title: 'Error',
              message: 'An unexpected error occurred.'
            });
          }
        }}
        onCancel={() => setCompleteAlert({ ...completeAlert, visible: false })}
      />

      {/* <BottomNavigation /> */}
      {/* Old confirmation overlays have been replaced with CustomAlert components */}

    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  confirmOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
},
confirmBox: {
  backgroundColor: colors.white,
  width: '80%',
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
},
confirmTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: colors.text,
  marginBottom: 8,
},
confirmMessage: {
  fontSize: 15,
  color: colors.textLight,
  textAlign: 'center',
  marginBottom: 16,
},
confirmButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
},
confirmButton: {
  flex: 1,
  paddingVertical: 10,
  marginHorizontal: 5,
  borderRadius: 8,
  alignItems: 'center',
},
cancelButton: {
  backgroundColor: colors.border,
},
confirmDeleteButton: {
  backgroundColor: colors.error || '#e74c3c',
},
cancelText: {
  color: colors.text,
  fontWeight: '500',
},
confirmText: {
  color: colors.white,
  fontWeight: '600',
},

  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginBottom: 0, // Ensure no bottom margin
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
  catAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  catName: {
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
    marginBottom: 0, // Remove margin that was making room for bottom navigation
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
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
  otherMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  userTimestamp: {
    color: colors.textLight,
    textAlign: 'right',
  },
  otherTimestamp: {
    color: colors.textLight,
    textAlign: 'left',
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
  emojiContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 8,
  },
  emojiContent: {
    paddingHorizontal: 16,
  },
  emojiButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
  },
  emojiText: {
    fontSize: 20,
  },
  inputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12 to 8 for standard size
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0, // Remove any bottom gap
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center', // Changed from 'flex-end' to 'center' for better alignment
    backgroundColor: colors.backgroundAlt,
    borderRadius: 20,
    paddingHorizontal: 12, // Reduced from 16 to 12
    paddingVertical: 6, // Reduced from 8 to 6 for standard size
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 6, // Reduced from 8 to 6 for standard size
    minHeight: 20, // Ensure minimum height
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
  // Breeding chat styles
  dualCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catGroup: {
    flexDirection: 'row',
    marginRight: 12,
  },
  smallCatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
  },
  overlappedAvatar: {
    marginLeft: -12,
  },
  breedChatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  breedInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  // WhatsApp-style input components
  attachmentButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 8,
  },

  // Add new styles for message avatars
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 8,
  },

  menuContainer: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 99,
    minWidth: 200, // Increase minimum width to ensure text visibility
    paddingVertical: 8, // Add vertical padding
  },
  menuItem: {
    paddingVertical: 12, // Increase padding for better touch targets
    paddingHorizontal: 20, // Increase horizontal padding
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },

});
