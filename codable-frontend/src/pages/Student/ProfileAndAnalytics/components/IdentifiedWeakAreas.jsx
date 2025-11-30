import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Progress } from "../../../../components/ui/progress";
import { AlertTriangle, ArrowRight, TrendingDown, Target } from "lucide-react";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Slider } from "../../../../components/ui/slider";

const weakAreas = [
	{
		topic: "Java Syntax & Hello World",
		score: 64,
		avgScore: 80,
		difficulty: "Low",
		status: "needs-improvement",
		attempts: 8,
		successRate: 70,
		recommendation: "Review basic syntax, class structure and main method",
		priority: 1,
	},
	{
		topic: "Variables & Data Types",
		score: 58,
		avgScore: 78,
		difficulty: "Low",
		status: "needs-improvement",
		attempts: 12,
		successRate: 62,
		recommendation: "Practice primitive vs reference types and type conversions",
		priority: 2,
	},
	{
		topic: "Control Flow (if / switch)",
		score: 55,
		avgScore: 75,
		difficulty: "Low",
		status: "needs-improvement",
		attempts: 10,
		successRate: 60,
		recommendation: "Work on conditional exercises and switch/case examples",
		priority: 3,
	},
	{
		topic: "Loops (for / while / do-while)",
		score: 50,
		avgScore: 72,
		difficulty: "Low",
		status: "weak",
		attempts: 9,
		successRate: 55,
		recommendation: "Practice loop patterns and common pitfalls (infinite loops)",
		priority: 4,
	},
	{
		topic: "Methods & Parameters",
		score: 62,
		avgScore: 78,
		difficulty: "Low",
		status: "needs-improvement",
		attempts: 7,
		successRate: 68,
		recommendation: "Understand method signatures, return types and overloading",
		priority: 5,
	},
	{
		topic: "Arrays & Basic Collections",
		score: 48,
		avgScore: 70,
		difficulty: "Medium",
		status: "weak",
		attempts: 11,
		successRate: 50,
		recommendation: "Practice array indexing, iteration and simple ArrayList usage",
		priority: 6,
	},
];

const getStatusConfig = (status) => {
	switch (status) {
		case "critical":
			return {
				color: "bg-red-500",
				textColor: "text-red-400",
				borderColor: "border-red-500/30",
				bgColor: "bg-red-500/10",
				label: "Critical",
			};

		case "needs-improvement":
			return {
				color: "bg-yellow-500",
				textColor: "text-yellow-400",
				borderColor: "border-yellow-500/30",
				bgColor: "bg-yellow-500/10",
				label: "Needs Improvement",
			};

		default:
			return {
				color: "bg-gray-500",
				textColor: "text-gray-400",
				borderColor: "border-gray-500/30",
				bgColor: "bg-gray-500/10",
				label: "Unknown",
			};
	}
};

export function IdentifiedWeakAreas() {
	const contentRef = useRef(null);
	const rafRef = useRef(null);
	const [percent, setPercent] = useState(0);
	const [showSlider, setShowSlider] = useState(false);

	// compute percentage from scroll position (throttled with rAF)
	const updatePercentFromScroll = useCallback(() => {
		const el = contentRef.current;
		if (!el) return;
		const max = el.scrollHeight - el.clientHeight;
		if (max <= 0) {
			setPercent(0);
			setShowSlider(false);
			return;
		}
		setShowSlider(true);
		const p = Math.round((el.scrollTop / max) * 100);
		setPercent((prev) => (prev === p ? prev : p));
	}, []);

	const onScroll = useCallback(() => {
		if (rafRef.current) return;
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			updatePercentFromScroll();
		});
	}, [updatePercentFromScroll]);

	// programmatic scroll from slider
	const scrollToPercent = useCallback(
		(p) => {
			const el = contentRef.current;
			if (!el) return;
			const max = el.scrollHeight - el.clientHeight;
			if (max <= 0) return;
			const top = Math.round((p / 100) * max);
			el.scrollTo({ top, behavior: "auto" });
			// update percent state (keeps slider in sync)
			setPercent(Math.max(0, Math.min(100, Math.round(p))));
		},
		[]
	);

	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		// initial check after layout
		const t = setTimeout(updatePercentFromScroll, 60);
		el.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", updatePercentFromScroll);
		return () => {
			clearTimeout(t);
			el.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", updatePercentFromScroll);
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
		};
	}, [onScroll, updatePercentFromScroll]);

	return (
		<Card className="bg-black/40 backdrop-blur-xl border-0 p-6 flex flex-col">
			{/* Header */}
			<div className="flex items-center gap-2 mb-6">
				<AlertTriangle className="h-5 w-5 text-orange-400" />
				<div>
					<h3 className="text-white">Identified Weak Areas</h3>
					<p className="text-sm text-muted-foreground">
						Topics requiring immediate attention
					</p>
				</div>
			</div>

			{/* scroll area + slider layout */}
			<div className="flex gap-4 mb-6">
				{/* ScrollArea wrapper (keeps existing component usage) */}
				<ScrollArea className="flex-1 max-h-[36rem]">
					{/* inner scrollable container we control */}
					<div
						ref={contentRef}
						className="space-y-4 pr-2 overflow-y-auto max-h-[36rem]"
						// allow keyboard focus and scrolling
						tabIndex={0}
					>
						{weakAreas.map((area, index) => {
							const statusConfig = getStatusConfig(area.status);
							const gap = area.avgScore - area.score;

							return (
								<div
									key={index}
									className={`p-5 rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor}`}
								>
									{/* Row 1 */}
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<div
													className={`h-2 w-2 rounded-full ${statusConfig.color}`}
												></div>

												<h4 className="text-white">{area.topic}</h4>

												<span
													className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
												>
													{statusConfig.label}
												</span>
											</div>

											{/* Meta */}
											<div className="flex items-center gap-4 text-xs text-muted-foreground">
												<span>{area.attempts} attempts</span>
												<span>•</span>
												<span>•</span>
												<span className="text-red-400">
													{gap} pts below avg
												</span>
											</div>
										</div>

										{/* Scores */}
										<div className="text-right">
											<div className="flex items-baseline gap-1 mb-1">
												<span
													className={`text-2xl ${statusConfig.textColor}`}
												>
													{area.score}
												</span>
												<span className="text-sm text-muted-foreground">
													/ {area.avgScore}
												</span>
											</div>
											<p className="text-xs text-muted-foreground">
												Your Score
											</p>
										</div>
									</div>

									{/* Progress */}
									<div className="mb-4">
										<div className="flex items-center justify-between text-xs mb-2 text-muted-foreground">
											<span>Performance vs Average</span>
											<span>
												{Math.round((area.score / area.avgScore) * 100)}%
											</span>
										</div>

										<div className="relative h-2 bg-accent/30 rounded-full overflow-hidden">
											<div
												className={`absolute left-0 top-0 h-full ${statusConfig.color}`}
												style={{
													width: `${(area.score / area.avgScore) * 100}%`,
												}}
											/>
										</div>
									</div>

									{/* Recommendation */}
									<div className="flex items-start gap-3 p-3 rounded-lg bg-accent/20 border border-border/30">
										<Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />

										<div className="flex-1">
											<p className="text-xs text-muted-foreground mb-1">
												Recommendation:
											</p>
											<p className="text-sm text-white">
												{area.recommendation}
											</p>
										</div>

										<Button
											size="sm"
											variant="ghost"
											className="text-xs text-blue-400 hover:text-blue-300 px-2"
										>
											Start{" "}
											<ArrowRight className="h-3 w-3 ml-1" />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</ScrollArea>

				{/* render slider only when content actually scrolls */}
				{showSlider && (
					<div className="flex items-start">
						<div className="h-[36rem] flex items-center">
							<Slider
								orientation="vertical"
								min={0}
								max={100}
								value={[percent]}
								onValueChange={(vals) => {
									const p = Array.isArray(vals) ? vals[0] : vals;
									scrollToPercent(p);
								}}
								className="h-[36rem] px-1"
							/>
						</div>
					</div>
				)}
			</div>

			{/* Summary */}
			<div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-accent/10 border border-border/30">
				<div>
					<p className="text-xs text-muted-foreground mb-1">Areas to Improve</p>
					<p className="text-2xl text-white">{weakAreas.length}</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground mb-1">Avg Gap</p>
					<p className="text-2xl text-red-400">
						{Math.round(
							weakAreas.reduce((sum, a) => sum + (a.avgScore - a.score), 0) /
								weakAreas.length
						)}
						%
					</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground mb-1">Priority Level</p>
					<p className="text-2xl text-orange-400">Medium</p>
				</div>
			</div>

			{/* Action */}
			<div className="mt-6">
				<Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
					<TrendingDown className="h-4 w-4 mr-2" />
					Create Personalized Study Plan
				</Button>
			</div>
		</Card>
	);
}
