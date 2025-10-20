import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MessagesScreenProps {
  navigation: any;
}

interface Message {
  id: string;
  sender: string;
  senderType: "coach" | "client";
  content: string;
  timestamp: string;
  isRead: boolean;
  avatar: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  isOnline: boolean;
}

export default function MessagesScreen({ navigation }: MessagesScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Coach Mike",
      lastMessage: "Great job on today's workout! Keep it up!",
      timestamp: "2 min ago",
      unreadCount: 2,
      avatar: "https://via.placeholder.com/50x50/3B82F6/FFFFFF?text=CM",
      isOnline: true,
    },
    {
      id: "2",
      name: "Coach Sarah",
      lastMessage: "Don't forget about tomorrow's session",
      timestamp: "1 hour ago",
      unreadCount: 0,
      avatar: "https://via.placeholder.com/50x50/10B981/FFFFFF?text=CS",
      isOnline: false,
    },
    {
      id: "3",
      name: "Group Chat",
      lastMessage: "Sarah: Anyone up for a group workout?",
      timestamp: "3 hours ago",
      unreadCount: 5,
      avatar: "https://via.placeholder.com/50x50/8B5CF6/FFFFFF?text=GC",
      isOnline: false,
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      sender: "Coach Mike",
      senderType: "coach",
      content: "How are you feeling after yesterday's workout?",
      timestamp: "10:30 AM",
      isRead: true,
      avatar: "https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=CM",
    },
    {
      id: "2",
      sender: "You",
      senderType: "client",
      content: "I'm feeling great! My legs are a bit sore but in a good way.",
      timestamp: "10:32 AM",
      isRead: true,
      avatar: "https://via.placeholder.com/40x40/6B7280/FFFFFF?text=ME",
    },
    {
      id: "3",
      sender: "Coach Mike",
      senderType: "coach",
      content:
        "That's perfect! That means the workout was effective. Make sure to stretch and hydrate well today.",
      timestamp: "10:35 AM",
      isRead: true,
      avatar: "https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=CM",
    },
    {
      id: "4",
      sender: "Coach Mike",
      senderType: "coach",
      content: "Also, don't forget about your nutrition goals for this week.",
      timestamp: "10:36 AM",
      isRead: false,
      avatar: "https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=CM",
    },
  ];

  const filteredConversations = conversations.filter(
    conversation =>
      conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Ionicons name="create" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#6B7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredConversations.map(conversation => (
          <TouchableOpacity
            key={conversation.id}
            style={[
              styles.conversationCard,
              selectedConversation === conversation.id &&
                styles.conversationCardActive,
            ]}
            onPress={() => setSelectedConversation(conversation.id)}
          >
            <View style={styles.conversationAvatar}>
              <Image
                source={{ uri: conversation.avatar }}
                style={styles.avatarImage}
              />
              {conversation.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.conversationTime}>
                  {conversation.timestamp}
                </Text>
              </View>

              <View style={styles.conversationMessage}>
                <Text
                  style={[
                    styles.lastMessage,
                    conversation.unreadCount > 0 && styles.unreadMessage,
                  ]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </Text>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {conversation.unreadCount > 9
                        ? "9+"
                        : conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages View (when conversation is selected) */}
      {selectedConversation && (
        <View style={styles.messagesContainer}>
          <View style={styles.messagesHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedConversation(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.messagesTitle}>Coach Mike</Text>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.senderType === "client" &&
                    styles.messageContainerRight,
                ]}
              >
                {message.senderType === "coach" && (
                  <Image
                    source={{ uri: message.avatar }}
                    style={styles.messageAvatar}
                  />
                )}

                <View
                  style={[
                    styles.messageBubble,
                    message.senderType === "client" &&
                      styles.messageBubbleRight,
                    !message.isRead &&
                      message.senderType === "coach" &&
                      styles.messageBubbleUnread,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.senderType === "client" &&
                        styles.messageTextRight,
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      message.senderType === "client" &&
                        styles.messageTimeRight,
                    ]}
                  >
                    {message.timestamp}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#6B7280"
              multiline
            />
            <TouchableOpacity style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  newMessageButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#fff",
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  conversationCardActive: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  conversationAvatar: {
    position: "relative",
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#111827",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  conversationTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  conversationMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#9CA3AF",
    marginRight: 8,
  },
  unreadMessage: {
    color: "#fff",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#3B82F6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  messagesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111827",
  },
  messagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  messageContainerRight: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "70%",
    backgroundColor: "#1F2937",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  messageBubbleRight: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  messageBubbleUnread: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  messageText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 18,
  },
  messageTextRight: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  messageTimeRight: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
});
