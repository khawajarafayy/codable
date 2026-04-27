import { Navbar } from './components/Navbar';
import { ProgressSection } from './components/ProgressSection';
import { TopicCard } from './components/TopicCard';
import { Sidebar } from './components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { javaBookTopics } from '../../../data/javaBookTopics';
import learningApi from '../../../services/learningApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatPopup({ open, onClose, chapterId }) {
	const [messages, setMessages] = useState([
		{
			role: "assistant",
			text: "Hi, I am your Java Learning AI Assistant. Ask me anything about your Java course, chapters, or code.",
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	if (!open) return null;

	const quickPrompts = [
		"Explain OOP in simple Java terms.",
		"How do for and while loops differ in Java?",
		"Give me one beginner Java practice task.",
	];

	const sendMessage = async (textOverride = null) => {
		const content = (textOverride ?? input).trim();
		if (!content || loading) return;

		const userMsg = {
			role: "user",
			text: content,
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setLoading(true);

		try {
			const response = await learningApi.askAssistant(content, chapterId || null, messages);
			const assistantText =
				response?.response ||
				"I am your Java Learning AI Assistant. Please ask Java/course-related questions only.";
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: assistantText,
					time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				},
			]);
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: "I am unable to respond right now. Please try again with your Java/course question.",
					time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				},
			]);
			console.error("Assistant chat error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed z-[9999] bottom-24 right-16 pointer-events-auto">
			{/* Overlay */}
			<div
				className="fixed inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Chat Window */}
			<div
				role="dialog"
				aria-modal="true"
				className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-gray-950"
				style={{ width: "430px", height: "550px" }}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600">
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
							<span className="text-white text-sm">🤖</span>
						</div>
						<h3 className="text-white font-medium text-sm">Virtual Assistant</h3>
					</div>

					<button
						onClick={onClose}
						className="text-white/90 hover:text-white text-lg"
					>
						✕
					</button>
				</div>

				{/* Chat Body */}
				<div className="p-4 overflow-y-auto h-[calc(100%-150px)] space-y-4">
					{messages.map((msg, idx) => (
						<div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[85%] text-sm px-4 py-3 rounded-xl shadow-lg border ${
									msg.role === "user"
										? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent rounded-tr-none"
										: "bg-white/10 backdrop-blur-md text-gray-200 border-white/10 rounded-tl-none"
								}`}
							>
								<div className="markdown-body text-gray-200">
									{msg.role === "assistant" ? (
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											components={{
												p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
												ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
												ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
												li: ({node, ...props}) => <li className="mb-1" {...props} />,
												code: ({node, inline, className, children, ...props}) => {
													return inline ? (
														<code className="bg-black/30 px-1.5 py-0.5 rounded text-purple-200 font-mono text-[11px]" {...props}>
															{children}
														</code>
													) : (
														<pre className="bg-black/50 p-3 rounded-lg overflow-x-auto mb-2 text-[11px] font-mono text-gray-200">
															<code {...props}>{children}</code>
														</pre>
													);
												},
												strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
												em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
												h1: ({node, ...props}) => <h1 className="text-sm font-bold mb-2 text-white" {...props} />,
												h2: ({node, ...props}) => <h2 className="text-sm font-bold mb-2 text-white" {...props} />,
												h3: ({node, ...props}) => <h3 className="text-xs font-bold mb-2 text-white" {...props} />,
												a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
											}}
										>
											{msg.text}
										</ReactMarkdown>
									) : (
										msg.text
									)}
								</div>
								<div className="text-[10px] text-gray-300/80 mt-1">{msg.time}</div>
							</div>
						</div>
					))}

					{loading && (
						<div className="flex justify-start">
							<div className="max-w-[80%] bg-white/10 text-gray-200 text-sm px-4 py-3 rounded-xl rounded-tl-none border border-white/10">
								Thinking...
							</div>
						</div>
					)}

					{messages.length === 1 && !loading && (
						<div className="flex flex-wrap gap-2 mt-4">
							{quickPrompts.map((prompt) => (
								<button
									key={prompt}
									onClick={() => sendMessage(prompt)}
									disabled={loading}
									className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs shadow-md hover:opacity-90 transition disabled:opacity-50"
								>
									{prompt}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Input Area */}
				<div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 bg-gray-900/70">
					<input
						type="text"
						placeholder="Write your message..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") sendMessage();
						}}
						className="flex-1 bg-gray-800/70 text-gray-200 placeholder-gray-500 px-4 py-2 rounded-full text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
					/>

					<button
						onClick={() => sendMessage()}
						disabled={loading || !input.trim()}
						className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path d="M22 2 11 13" />
							<path d="M22 2 15 22 11 13 2 9l20-7Z" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}
export default function LearningDashboard() {
	const navigate = useNavigate();
	const [chatOpen, setChatOpen] = useState(false);
	const [chaptersProgress, setChaptersProgress] = useState([]);
	const [progressStats, setProgressStats] = useState({});
	const [loading, setLoading] = useState(true);
	const [topics, setTopics] = useState(javaBookTopics);
	const toggleChat = () => setChatOpen((v) => !v);
	const activeChapter = chaptersProgress.find((ch) => ch.status === "in-progress");

	// Fetch user's chapter progress on mount
	useEffect(() => {
		const fetchProgress = async () => {
			try {
				setLoading(true);
				const response = await learningApi.getChaptersProgress();
				
				if (response.success && response.chapters) {
					setChaptersProgress(response.chapters);
					setProgressStats(response.stats || {});
					
					// Merge progress data with static topic data
					const updatedTopics = javaBookTopics.map(topic => {
						const chapterProgress = response.chapters.find(
							ch => ch.chapterId === topic.chapter
						);
						
						if (chapterProgress) {
							return {
								...topic,
								status: chapterProgress.status,
								locked: chapterProgress.status === 'locked',
							};
						}
						return topic;
					});
					
					setTopics(updatedTopics);
				}
			} catch (error) {
				console.error('Error fetching progress:', error);
				// Use default topics if fetch fails
				setTopics(javaBookTopics);
			} finally {
				setLoading(false);
			}
		};

		fetchProgress();
	}, []);

	const handleTopicAction = async (topic) => {
		// Start chapter if not already started
		if (topic.status === 'not-started') {
			try {
				await learningApi.startChapter(topic.chapter);
			} catch (error) {
				console.error('Error starting chapter:', error);
			}
		}
		navigate(`/student/learning?topic=${topic.id}`);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
			<Navbar />

			<div className="flex max-w-[1600px] mx-auto">
				<main className="flex-1 p-6 lg:p-8">
					<ProgressSection 
						chaptersProgress={chaptersProgress} 
						stats={progressStats} 
						topics={topics} 
					/>

					<section className="mt-8">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-white mb-1">Learning Path</h2>
								<p className="text-gray-400">
									Continue your Java mastery journey
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
							{loading ? (
								<div className="col-span-3 text-center py-8">
									<div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
									<p className="text-gray-400">Loading your progress...</p>
								</div>
							) : (
								topics.map((topic) => (
									<div key={topic.id} className="h-full">
										<TopicCard
											topic={topic}
											chapterProgress={chaptersProgress.find(c => c.chapterId === topic.chapter)}
											onActionClick={() => {
												handleTopicAction(topic);
											}}
										/>
									</div>
								))
							)}
						</div>
					</section>
				</main>

				<Sidebar stats={progressStats} chaptersProgress={chaptersProgress} />
			</div>

			<button
				onClick={toggleChat}
				aria-haspopup="dialog"
				aria-expanded={chatOpen}
				className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-110 flex items-center justify-center group"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="w-6 h-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 6V2H8" />
					<path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
					<path d="M2 12h2" />
					<path d="M9 11v2" />
					<path d="M15 11v2" />
					<path d="M20 12h2" />
				</svg>
				<span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></span>
			</button>

			<ChatPopup
				open={chatOpen}
				onClose={() => setChatOpen(false)}
				chapterId={activeChapter?.chapterId || null}
			/>
		</div>
	);
}