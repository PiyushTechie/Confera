# Expansion Plan: Recruiters, Students & Professionals

This document outlines the proposed features and architectural changes to make Confera a versatile platform serving recruiters (interviews), students (education), and professionals (enterprise meetings).

## User Review Required
> [!IMPORTANT]
> Please review the proposed features and technology choices below. We will use `@monaco-editor/react` combined with our existing `socket.io` connection to build the real-time collaborative coding environment. Let me know if you agree with this direction or if you have specific preferences!

## Open Questions
> [!NOTE]
> 1. For the coding tool, which programming languages do you want to support initially? (e.g., JavaScript, Python, C++, Java)?
> 2. Do you want the code editor to just be a synchronized text editor, or do you also want to execute the code in the browser (e.g., using WebContainers or an execution API)?
> 3. Should these features be toggled based on a "Meeting Type" (Interview, Class, Standard Meeting) selected when the host creates the room?

## Proposed Features

### 1. Recruiters (Interview Mode)
- **Collaborative Code Editor**: A synchronized code editor where the candidate and interviewer can write code in real-time. This will be built as a new central panel option (alongside the Video Grid and Whiteboard).
- **Private Evaluation Notes**: A sidebar panel where the interviewer can jot down private notes during the meeting without the candidate seeing them.

### 2. School Students (Education Mode)
- **Polls & Quizzes**: A feature for teachers/hosts to create quick polls or multiple-choice questions that students can answer in real-time.
- **Hand Raising**: An indicator on the video tile so students can signal they have a question without interrupting the speaker.

### 3. Professionals (Enterprise Mode)
- **Meeting Agenda Tracker**: A shared checklist panel where participants can see the agenda items and check them off as the meeting progresses.
- **In-meeting File Sharing**: Enhancing the chat to allow drag-and-drop file sharing for quick document distribution.

## Technical Implementation

### Frontend (Collaborative Editor & Panels)
- **Dependencies**: Add `@monaco-editor/react` to `frontend/package.json`.
- **`frontend/src/components/Meeting/CollaborativeEditor.jsx`**: A new component that renders the Monaco editor. It will bind to the existing Socket.IO connection to emit and listen for `code-change` and `cursor-update` events.
- **`frontend/src/pages/Room.jsx` (or Main View)**: Introduce state to switch the main stage between the Video Grid, Whiteboard, and Code Editor. 
- **`frontend/src/components/Meeting/BottomControlBar.jsx`**: Add a `<Code />` button for the host/interviewer to switch the room into "Interview/Coding Mode".
- **`frontend/src/components/Meeting/Sidebars/PollsPanel.jsx` & `AgendaPanel.jsx`**: New sidebars for students and professionals.

### Backend (Socket Synchronization)
- **`backend/src/app.js` (or Socket Handlers)**: We will leverage the existing Socket.IO server to handle the new events.
- **Events to add**:
  - `code-change`: Broadcasts code updates to all peers in the room.
  - `cursor-update`: Broadcasts cursor positions for real-time presence.
  - `poll-created` & `poll-vote`: For the student education mode.
  - `agenda-update`: For the professional meeting tracker.

### Oracle Cloud Compatibility
I have reviewed your existing backend code (specifically `backend/src/mediasoup/config.js`). 
Your code is **perfectly good** for the Oracle Cloud setup! 
Because Oracle Cloud instances sit behind a NAT (meaning the VM's network interface has a private IP, but is accessed via a public IP), Mediasoup requires the `announcedIp` to be set to your public IP.
Your config correctly uses:
```javascript
announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1'
```
**To deploy on Oracle Cloud:**
1. Simply set `ANNOUNCED_IP=your_oracle_public_ip` in your production `.env` file.
2. **Crucial Step**: Ensure you open the UDP port range `40000-49999` in your Oracle Cloud Virtual Cloud Network (VCN) Ingress Security Rules, as these are the ports your Mediasoup config uses for WebRTC media traffic.

## Verification Plan

### Automated Tests
- N/A for UI components (we will rely on manual testing).

### Manual Verification
1. **Code Synchronization**: Open two browser tabs in the same meeting room. Type in the code editor in Tab 1 and verify the text appears instantly in Tab 2 without cursor jumping.
2. **Feature Toggles**: Verify that the new panels (Code, Polls, Agenda) open and close correctly without interfering with the video streams.
