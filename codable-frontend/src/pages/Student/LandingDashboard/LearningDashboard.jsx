import { Navbar } from './components/Navbar';
import { ProgressSection } from './components/ProgressSection';
import { TopicCard } from './components/TopicCard';
import { Sidebar } from './components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { javaBookTopics } from '../../../data/javaBookTopics';

function ChatPopup({ open, onClose }) {
	if (!open) return null;

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
					{/* Bot Bubble */}
					<div className="flex justify-start">
						<div className="max-w-[80%] bg-white/10 backdrop-blur-md text-gray-200 text-sm px-4 py-3 rounded-xl rounded-tl-none shadow-lg border border-white/10">
							Hi there 👋  
							<br />
							How can I help you today?
							<div className="text-[10px] text-gray-400 mt-1">4:46 PM</div>
						</div>
					</div>

					{/* Suggestion Buttons */}
					<div className="flex flex-col gap-2 mt-4">
						<button className="self-start px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs shadow-md hover:opacity-90 transition">
							What can this assistant do?
						</button>
						<button className="self-start px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs shadow-md hover:opacity-90 transition">
							Tell me about your offerings
						</button>
						<button className="self-start px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs shadow-md hover:opacity-90 transition">
							I have an issue
						</button>
					</div>
				</div>

				{/* Input Area */}
				<div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 bg-gray-900/70">
					<input
						type="text"
						placeholder="Write your message..."
						className="flex-1 bg-gray-800/70 text-gray-200 placeholder-gray-500 px-4 py-2 rounded-full text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
					/>

					<button className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center hover:scale-105 transition">
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
	const toggleChat = () => setChatOpen((v) => !v);

	const handleTopicAction = (topic) => {
		navigate(`/student/learning?topic=${topic.id}`);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
			<Navbar />

			<div className="flex max-w-[1600px] mx-auto">
				<main className="flex-1 p-6 lg:p-8">
					<ProgressSection />

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
							{javaBookTopics.map((topic) => (
								<div key={topic.id} className="h-full">
									<TopicCard
										topic={topic}
										onActionClick={() => {
											handleTopicAction(topic);
										}}
									/>
								</div>
							))}
						</div>
					</section>
				</main>

				<Sidebar />
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

			<ChatPopup open={chatOpen} onClose={() => setChatOpen(false)} />
		</div>
	);
}