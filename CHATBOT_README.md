# Next Level Softball Chatbot

A sophisticated AI-powered chatbot for the Next Level Softball platform, providing intelligent assistance to coaches, clients, and visitors.

## Features

### 🤖 **AI-Powered Responses**

- **OpenAI GPT-4o-mini Integration**: Real AI responses with deep platform understanding
- **Fallback System**: Rule-based responses if AI is unavailable
- **Context Awareness**: Understands user role, current page, and recent actions
- **Conversation Memory**: Maintains context across multiple messages

### 🎯 **Role-Based Assistance**

- **Coaches**: Detailed workflow guidance, program creation, client management
- **Clients**: Program access, video library, communication features
- **Visitors**: Platform overview, pricing, features, and benefits

### 💬 **Smart Features**

- **Quick Actions**: Pre-defined buttons for common queries
- **Markdown Rendering**: Rich text formatting in responses
- **Real-time Processing**: Natural conversation flow
- **Error Handling**: Graceful fallbacks and error recovery

## Technical Implementation

### Frontend Components

#### `ChatbotWidget.tsx`

- Floating chat interface with modern design
- Message history with scroll functionality
- Input handling with keyboard shortcuts
- Loading states and error handling
- Click-outside-to-close functionality

#### `ChatbotQuickActions.tsx`

- Role-based quick action buttons
- Dynamic content based on user type
- Modern gradient design with icons
- Responsive layout

#### `ChatbotContext.tsx`

- Global state management
- Page tracking and user role detection
- Recent actions logging

### Backend API

#### `/api/chatbot/route.ts`

- **OpenAI GPT Integration**: Real AI responses using GPT-4o-mini
- **Platform Knowledge Base**: Comprehensive understanding of the platform
- **Context Processing**: User role, current page, conversation history
- **Fallback System**: Rule-based responses if AI fails
- **Error Handling**: Graceful degradation

### Key Features

#### AI Integration

```typescript
// OpenAI GPT-4o-mini with platform knowledge
const completion = await openai.chat.completions.create({
	model: "gpt-4o-mini",
	messages: [
		{ role: "system", content: systemPrompt },
		...conversationHistory,
		{ role: "user", content: userMessage },
	],
	max_tokens: 800,
	temperature: 0.7,
	top_p: 0.9,
})
```

#### Platform Knowledge

The chatbot has deep understanding of:

- User roles and permissions
- Program creation and management
- Client management workflows
- Video library organization
- Scheduling and messaging
- Security and privacy features
- Troubleshooting guides
- Best practices

#### Context Awareness

- **User Role**: Coach, client, or visitor
- **Current Page**: Where the user is in the app
- **Recent Actions**: What they've been doing
- **Conversation History**: Previous messages for context

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# AI Configuration (OpenAI)
OPENAI_API_KEY="your_openai_api_key_here"
```

### 2. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### 3. Install Dependencies

The OpenAI package is already included in your `package.json`:

```json
{
	"openai": "^5.16.0"
}
```

### 4. Usage

The chatbot is automatically available on all pages through the floating chat button. Users can:

- Click the chat button to open the interface
- Use quick action buttons for common queries
- Type custom questions
- Get AI-powered responses with platform knowledge

## Configuration

### Model Settings

```typescript
// In /api/chatbot/route.ts
const completion = await openai.chat.completions.create({
	model: "gpt-4o-mini", // Cost-effective model
	max_tokens: 800, // Response length limit
	temperature: 0.7, // Creativity level (0-1)
	top_p: 0.9, // Response diversity
})
```

### System Prompt

The system prompt includes:

- Complete platform knowledge base
- User role and context information
- Response guidelines and formatting rules
- Security and privacy considerations

### Fallback System

If OpenAI API fails, the chatbot falls back to rule-based responses using the same platform knowledge, ensuring users always get helpful responses.

## Usage Examples

### For Coaches

```
User: "How do I create a training program?"
AI: "To create a training program on Next Level Softball:

1. **Navigate to Programs** - Click the Programs section
2. **Create New Program** - Click 'Create Program' button
3. **Program Details** - Fill in title, description, level, duration
4. **Add Structure** - Create weeks and days
5. **Add Drills** - Include video demonstrations
6. **Save & Publish** - Review and publish

**Pro Tip**: Use video demonstrations for each drill to provide clear visual instruction."
```

### For Clients

```
User: "How do I access my training programs?"
AI: "As a client, you can access your training programs by:

1. **Login to your account** using your credentials
2. **Navigate to Programs** in the main menu
3. **View assigned programs** from your coach
4. **Click on a program** to see the full structure
5. **Follow daily drills** with video demonstrations
6. **Track your progress** as you complete workouts

Your coach will assign programs specifically designed for your skill level and goals."
```

### For Visitors

```
User: "What features does the platform offer?"
AI: "**Next Level Softball Features:**

🎯 **For Coaches:**
- Create comprehensive training programs
- Manage client roster and track progress
- Upload and organize video library
- Schedule lessons and appointments
- Send messages and share content
- View analytics and performance data

🏃 **For Athletes:**
- Access personalized training programs
- View shared videos and demonstrations
- Communicate with your coach
- Track progress and performance
- View lesson schedule
- Receive notifications and reminders"
```

## Security & Privacy

### Data Protection

- **No Sensitive Data**: The chatbot doesn't access personal client information
- **Platform Knowledge Only**: Responses are based on public platform features
- **Secure API Calls**: All OpenAI API calls are server-side only
- **Error Handling**: No sensitive information in error messages

### API Key Security

- **Environment Variables**: API key stored securely in `.env`
- **Server-Side Only**: API calls made from backend, not frontend
- **Rate Limiting**: Built-in protection against abuse
- **Error Logging**: Secure error handling without exposing keys

## Troubleshooting

### Common Issues

#### OpenAI API Errors

- **Check API Key**: Ensure `OPENAI_API_KEY` is set in `.env`
- **Verify Account**: Make sure your OpenAI account has credits
- **Check Rate Limits**: Monitor API usage and limits
- **Fallback Works**: System automatically uses rule-based responses

#### Chatbot Not Responding

- **Check Network**: Ensure internet connection
- **Verify API Route**: Confirm `/api/chatbot` is accessible
- **Check Console**: Look for error messages in browser console
- **Restart Server**: Try restarting the development server

#### Environment Variables

- **File Location**: Ensure `.env` is in project root
- **Format**: Use `KEY="value"` format (no spaces around `=`)
- **Restart Required**: Changes require server restart
- **Case Sensitive**: Variable names are case-sensitive

## Future Enhancements

### Planned Features

- **Voice Integration**: Speech-to-text and text-to-speech
- **File Upload**: Allow users to share images/documents
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Chatbot usage insights
- **Custom Training**: Platform-specific AI fine-tuning

### Performance Optimizations

- **Response Caching**: Cache common responses
- **Streaming Responses**: Real-time response generation
- **Context Optimization**: Smarter conversation memory
- **Model Selection**: Dynamic model choice based on query complexity

## Support

For technical support or questions about the chatbot:

- Check the troubleshooting section above
- Review the API documentation
- Contact the development team
- Check OpenAI API status and documentation

---

**Version**: 3.0.0  
**Last Updated**: January 2025  
**Features**: OpenAI GPT integration, enhanced platform knowledge, role-based responses, security-aware
