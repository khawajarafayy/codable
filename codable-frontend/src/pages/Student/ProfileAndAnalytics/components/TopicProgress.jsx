import { Card } from "../../../../components/ui/card";
import { Progress } from "../../../../components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const topics = [
	{
		name: "Introduction to Java",
		progress: 85,
		completed: 8,
		total: 11,
		status: "good",
		avgTime: "8 min",
	},
	{
		name: "Setup & First Program",
		progress: 90,
		completed: 9,
		total: 10,
		status: "excellent",
		avgTime: "12 min",
	},
	{
		name: "Variables & Data Types",
		progress: 55,
		completed: 11,
		total: 20,
		status: "good",
		avgTime: "10 min",
	},
	{
		name: "Operators & Expressions",
		progress: 50,
		completed: 5,
		total: 10,
		status: "good",
		avgTime: "9 min",
	},
	{
		name: "Control Flow (if / switch)",
		progress: 48,
		completed: 6,
		total: 12,
		status: "good",
		avgTime: "11 min",
	},
	{
		name: "Loops (for / while / do)",
		progress: 42,
		completed: 5,
		total: 12,
		status: "average",
		avgTime: "13 min",
	},
	{
		name: "Methods & Parameters",
		progress: 36,
		completed: 4,
		total: 11,
		status: "average",
		avgTime: "14 min",
	},
	{
		name: "Arrays & Basic Collections",
		progress: 30,
		completed: 3,
		total: 10,
		status: "average",
		avgTime: "16 min",
	},
	{
		name: "OOP Basics: Classes & Objects",
		progress: 25,
		completed: 2,
		total: 10,
		status: "average",
		avgTime: "18 min",
	},
	{
		name: "Constructors & Encapsulation",
		progress: 20,
		completed: 2,
		total: 10,
		status: "weak",
		avgTime: "15 min",
	},
];

const getStatusColor = (status) => {
	switch (status) {
		case "excellent":
			return "bg-green-500";
		case "good":
			return "bg-blue-500";
		case "average":
			return "bg-yellow-500";
		case "weak":
			return "bg-red-500";
		default:
			return "bg-gray-500";
	}
};

const getStatusText = (status) => {
	switch (status) {
		case "excellent":
			return "text-green-400";
		case "good":
			return "text-blue-400";
		case "average":
			return "text-yellow-400";
		case "weak":
			return "text-red-400";
		default:
			return "text-gray-400";
	}
};

export function TopicProgress() {
	return (
		<Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
			<div className="mb-6">
				<h3 className="text-white mb-2">Topic-wise Progress</h3>
				<p className="text-sm text-muted-foreground">
					Track your performance across all Java topics
				</p>
			</div>

			<div className="space-y-5">
				{topics.map((topic, index) => (
					<div key={index} className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{topic.progress >= 85 ? (
									<CheckCircle2 className="h-4 w-4 text-green-400" />
								) : (
									<Circle className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="text-white text-sm">{topic.name}</span>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Clock className="h-3 w-3" />
									<span>{topic.avgTime}</span>
								</div>
								<span className={`text-sm ${getStatusText(topic.status)}`}>
									{topic.progress}%
								</span>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Progress value={topic.progress} className="h-2 flex-1" />
							<span className="text-xs text-muted-foreground whitespace-nowrap">
								{topic.completed}/{topic.total}
							</span>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
